import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import * as od from "./onedrive";

const KEY = "dm.data.v1";
const META = "dm.meta.v1";
export const COLLECTIONS = ["FixedExpense", "VariableExpense", "AnnualExpense", "Income", "SavingsEntry", "SavingsContribution", "GuardiolaMovement"];

const empty = () => ({ version: 1, ...Object.fromEntries(COLLECTIONS.map((c) => [c, []])), deleted: {}, updatedAt: null });
const now = () => new Date().toISOString();
const newId = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);

function loadLocal() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY));
    if (d && Array.isArray(d.VariableExpense)) return { ...empty(), ...d, deleted: d.deleted || {} };
  } catch { /* ignore */ }
  return empty();
}
function loadMeta() {
  try { return JSON.parse(localStorage.getItem(META)) || {}; } catch { return {}; }
}
function saveLocal(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch { /* storage full or blocked */ } }
function saveMeta(m) { try { localStorage.setItem(META, JSON.stringify(m)); } catch { /* ignore */ } }

/** Merge two datasets record by record: newest updated_at wins, deletions win over older edits. */
export function merge(a, b) {
  const out = empty();
  out.deleted = { ...(a.deleted || {}) };
  for (const [id, ts] of Object.entries(b.deleted || {})) if (!out.deleted[id] || out.deleted[id] < ts) out.deleted[id] = ts;
  for (const c of COLLECTIONS) {
    const map = new Map();
    for (const r of [...(a[c] || []), ...(b[c] || [])]) {
      const prev = map.get(r.id);
      if (!prev || (r.updated_at || "") > (prev.updated_at || "")) map.set(r.id, r);
    }
    out[c] = [...map.values()].filter((r) => !(out.deleted[r.id] && out.deleted[r.id] >= (r.updated_at || "")));
  }
  const stamps = [a.updatedAt, b.updatedAt].filter(Boolean).sort();
  out.updatedAt = stamps[stamps.length - 1] || null;
  return out;
}

const fingerprint = (d) => JSON.stringify(COLLECTIONS.map((c) => [...(d[c] || [])].sort((x, y) => (x.id < y.id ? -1 : 1)))) + JSON.stringify(d.deleted);

const Ctx = createContext(null);

export function DataProvider({ children }) {
  const [data, setData] = useState(loadLocal);
  const [sync, setSync] = useState({ status: "starting", account: null, lastSync: loadMeta().lastSync || null, error: null });
  const dataRef = useRef(data);
  const pushTimer = useRef(null);
  const busy = useRef(false);
  const again = useRef(false);

  const commit = useCallback((d) => {
    dataRef.current = d;
    saveLocal(d);
    setData(d);
  }, []);

  /** Pull from OneDrive, merge with local, push back if anything differs. */
  const syncNow = useCallback(async () => {
    if (busy.current) { again.current = true; return; }
    const account = await od.getAccount().catch(() => null);
    if (!account) { setSync((s) => ({ ...s, status: "local", account: null })); return; }
    if (!navigator.onLine) { setSync((s) => ({ ...s, status: "offline", account })); return; }
    busy.current = true;
    setSync((s) => ({ ...s, status: "syncing", account, error: null }));
    try {
      const remote = await od.readRemote();
      const merged = remote ? merge(dataRef.current, remote) : dataRef.current;
      if (fingerprint(merged) !== fingerprint(dataRef.current)) commit(merged);
      if (!remote || fingerprint(merged) !== fingerprint(remote)) {
        await od.writeRemote(merged);
        const meta = loadMeta();
        const day = new Date().toISOString().slice(0, 10);
        if (meta.lastBackup !== day) { await od.writeDailyBackup(merged); saveMeta({ ...loadMeta(), lastBackup: day }); }
      }
      const lastSync = now();
      saveMeta({ ...loadMeta(), lastSync, dirty: false });
      setSync({ status: "synced", account, lastSync, error: null });
    } catch (e) {
      if (e.message === "REDIRECTING") return;
      console.error(e);
      setSync((s) => ({ ...s, status: "error", account, error: e.message }));
    } finally {
      busy.current = false;
      if (again.current) { again.current = false; syncNow(); }
    }
  }, [commit]);

  const schedulePush = useCallback(() => {
    saveMeta({ ...loadMeta(), dirty: true });
    clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(syncNow, 1200);
  }, [syncNow]);

  // initial sync + re-sync when coming back to the app or back online
  useEffect(() => {
    syncNow();
    const onVis = () => document.visibilityState === "visible" && syncNow();
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("online", syncNow);
    return () => { document.removeEventListener("visibilitychange", onVis); window.removeEventListener("online", syncNow); };
  }, [syncNow]);

  const mutate = useCallback((fn) => {
    const d = structuredClone(dataRef.current);
    fn(d);
    d.updatedAt = now();
    commit(d);
    schedulePush();
  }, [commit, schedulePush]);

  const api = useMemo(() => {
    const crud = (c) => ({
      create: (rec) => { const id = newId(); mutate((d) => { d[c].push({ ...rec, id, created_at: now(), updated_at: now() }); }); return id; },
      update: (id, rec) => mutate((d) => { d[c] = d[c].map((r) => (r.id === id ? { ...r, ...rec, id, updated_at: now() } : r)); }),
      remove: (id) => mutate((d) => { d[c] = d[c].filter((r) => r.id !== id); d.deleted[id] = now(); }),
    });
    return {
      db: Object.fromEntries(COLLECTIONS.map((c) => [c, crud(c)])),
      /** Merge records from an exported file (this app's format or a Base44 export). */
      importData: (incoming) => {
        const inc = empty();
        for (const c of COLLECTIONS) {
          inc[c] = (incoming[c] || []).map((r) => ({
            ...r,
            id: String(r.id || newId()),
            created_at: r.created_at || r.created_date || now(),
            updated_at: r.updated_at || r.updated_date || now(),
          }));
        }
        inc.deleted = incoming.deleted || {};
        mutate((d) => { const m = merge(d, inc); Object.assign(d, m); });
        return COLLECTIONS.reduce((n, c) => n + inc[c].length, 0);
      },
      syncNow,
      signIn: od.signIn,
      signOut: async () => { await od.signOut(); setSync((s) => ({ ...s, status: "local", account: null })); },
    };
  }, [mutate, syncNow]);

  const value = useMemo(() => ({
    ...Object.fromEntries(COLLECTIONS.map((c) => [c, data[c] || []])),
    data, sync, ...api,
  }), [data, sync, api]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useData = () => useContext(Ctx);

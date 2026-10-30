import React, { useState } from "react";
import { Pencil, Trash2, Printer } from "lucide-react";
import { Button, Field, Input, Select, cn } from "./ui";
import { colorCategoria, eur, fmtMes } from "../lib/finance";

export function Capcalera({ titol, subtitol, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{titol}</h1>
        {subtitol && <p className="text-muted-foreground mt-1">{subtitol}</p>}
      </div>
      <div className="flex flex-wrap gap-2 no-print">
        <Button variant="outline" onClick={() => window.print()}><Printer className="w-4 h-4" /><span className="hidden sm:inline">Imprimir</span></Button>
        {children}
      </div>
    </div>
  );
}

const COLORS = {
  primary: "bg-primary/10 text-primary",
  violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  green: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  red: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
};

export function StatCard({ icon: Icon, label, value, sublabel, color = "primary" }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-5 flex items-center gap-4">
      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", COLORS[color])}><Icon className="w-6 h-6" /></div>
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground font-medium">{label}</p>
        <p className="text-2xl font-bold tabular-nums">{value}</p>
        {sublabel && <p className="text-xs text-muted-foreground mt-0.5">{sublabel}</p>}
      </div>
    </div>
  );
}

export function SelectorMes({ value, onChange, mesos, className }) {
  return (
    <Select value={value} onChange={(e) => onChange(e.target.value)} className={cn("w-40 no-print", className)}>
      {mesos.map((m) => <option key={m} value={m}>{fmtMes(m)}</option>)}
    </Select>
  );
}

export function Accions({ onEdit, onDelete }) {
  return (
    <div className="flex gap-0.5 no-print">
      <Button variant="ghost" size="iconSm" onClick={onEdit} aria-label="Editar"><Pencil className="w-3.5 h-3.5" /></Button>
      <Button variant="ghost" size="iconSm" onClick={onDelete} aria-label="Eliminar"><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
    </div>
  );
}

/** One expense / income line. `dreta` can add extra blocks before the actions. */
export function Fila({ e, extra, onEdit, onDelete, dreta, subimport }) {
  const compartida = e.total_bill && e.my_percentage != null && e.my_percentage !== 100;
  return (
    <div className="flex items-center justify-between gap-3 p-3 sm:p-4 bg-card rounded-xl border border-border">
      <div className="flex items-center gap-3 min-w-0">
        {e.category && <span className={cn("shrink-0 hidden sm:inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold", colorCategoria(e.category))}>{e.category}</span>}
        <div className="min-w-0">
          <p className="font-medium truncate">{e.name}</p>
          <p className="text-xs text-muted-foreground truncate">
            <span className="sm:hidden">{e.category}{(extra || e.notes) ? " · " : ""}</span>
            {[extra, e.notes].filter(Boolean).join(" · ")}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <div className="text-right">
          <p className="font-semibold tabular-nums">{eur(e.amount)}</p>
          {compartida
            ? <p className="text-xs text-muted-foreground tabular-nums">{eur(e.total_bill)} · {e.my_percentage}%</p>
            : subimport && <p className="text-xs text-muted-foreground">{subimport}</p>}
        </div>
        {dreta}
        <Accions onEdit={() => onEdit(e)} onDelete={() => onDelete(e)} />
      </div>
    </div>
  );
}

export function Buit({ icon: Icon, text, children }) {
  return (
    <div className="text-center py-14 bg-card rounded-2xl border border-border">
      <Icon className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
      <p className="text-muted-foreground">{text}</p>
      {children && <div className="mt-4 no-print">{children}</div>}
    </div>
  );
}

const NOMS_MES = ["Gener", "Febrer", "Març", "Abril", "Maig", "Juny", "Juliol", "Agost", "Setembre", "Octubre", "Novembre", "Desembre"];

/** Month picker that works the same in every browser (Safari on Mac has no native one). */
export function EntradaMes({ value, onChange }) {
  const [y, m] = (value || "").split("-");
  const anyActual = new Date().getFullYear();
  const anys = [];
  for (let a = anyActual + 1; a >= anyActual - 6; a--) anys.push(String(a));
  if (y && !anys.includes(y)) anys.push(y);
  return (
    <div className="grid grid-cols-[1fr_auto] gap-2">
      <Select value={m || ""} onChange={(e) => onChange(`${y || anyActual}-${e.target.value}`)} required>
        <option value="" disabled>Mes…</option>
        {NOMS_MES.map((n, i) => <option key={n} value={String(i + 1).padStart(2, "0")}>{n}</option>)}
      </Select>
      <Select value={y || String(anyActual)} onChange={(e) => onChange(`${e.target.value}-${m || "01"}`)} className="w-28">
        {anys.map((a) => <option key={a} value={a}>{a}</option>)}
      </Select>
    </div>
  );
}

const r2 = (n) => Math.round(n * 100) / 100;

/**
 * Generic form. `camps`: [{key,label,type:'text'|'number'|'select'|'month'|'date',options,required,placeholder}]
 * `compartida`: shows "total invoice × my %" fields and computes `amount`.
 */
export function FormDespesa({ inicial, camps, compartida, onSubmit, onCancel }) {
  const [f, setF] = useState(() => {
    const base = { my_percentage: 100, ...inicial };
    if (compartida && base.total_bill == null && base.amount != null) base.total_bill = Math.round((base.amount * 100 / (Number(base.my_percentage) || 100)) * 100) / 100;
    return base;
  });
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const total = parseFloat(String(f.total_bill ?? "").replace(",", ".")) || 0;
  const pctRaw = parseFloat(String(f.my_percentage ?? "").replace(",", "."));
  const pct = isNaN(pctRaw) ? 100 : Math.min(100, Math.max(0, pctRaw));

  const submit = (ev) => {
    ev.preventDefault();
    const out = { ...f };
    for (const c of camps) if (c.type === "number" && out[c.key] !== undefined && out[c.key] !== "") out[c.key] = parseFloat(String(out[c.key]).replace(",", "."));
    if (compartida) { out.total_bill = total; out.my_percentage = pct; out.amount = r2((total * pct) / 100); }
    for (const k of Object.keys(out)) if (out[k] === "") delete out[k];
    onSubmit(out);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {compartida && (
        <div className="space-y-3 rounded-xl border border-border bg-muted/40 p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Repartició de la despesa</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Total factura (€)"><Input type="text" inputMode="decimal" placeholder="0,00" value={f.total_bill ?? ""} onChange={(e) => set("total_bill", e.target.value)} required /></Field>
            <Field label="% que assumeixo"><Input type="text" inputMode="decimal" placeholder="100" value={f.my_percentage ?? ""} onChange={(e) => set("my_percentage", e.target.value)} /></Field>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-primary/10 px-4 py-2.5">
            <span className="text-sm font-medium">La meva part</span>
            <span className="font-bold text-lg text-primary tabular-nums">{eur(r2((total * pct) / 100))}</span>
          </div>
        </div>
      )}
      {camps.map((c) => (
        <Field key={c.key} label={`${c.label}${c.required ? " *" : ""}`}>
          {c.type === "month" ? (
            <EntradaMes value={f[c.key] || ""} onChange={(v) => set(c.key, v)} />
          ) : c.type === "select" ? (
            <Select value={f[c.key] || ""} onChange={(e) => set(c.key, e.target.value)} required={c.required}>
              <option value="" disabled>Selecciona…</option>
              {c.options.map((o) => <option key={o} value={o}>{o}</option>)}
            </Select>
          ) : (
            <Input
              type={c.type === "number" ? "text" : c.type || "text"}
              inputMode={c.type === "number" ? "decimal" : undefined}
              placeholder={c.placeholder || (c.type === "number" ? "0,00" : "")}
              value={f[c.key] ?? ""} onChange={(e) => set(c.key, e.target.value)} required={c.required} />
          )}
        </Field>
      ))}
      <div className="flex gap-3 pt-1">
        <Button variant="outline" className="flex-1" onClick={onCancel}>Cancel·lar</Button>
        <Button type="submit" className="flex-1">Desar</Button>
      </div>
    </form>
  );
}

// OneDrive storage via Microsoft Graph. The app only gets access to its own
// app folder (Files.ReadWrite.AppFolder); this app keeps everything in the
// "despeses-mensuals" subfolder.
import { PublicClientApplication, InteractionRequiredAuthError } from "@azure/msal-browser";

export const CLIENT_ID = "b6fb0355-8aef-4d2e-ae70-6f56b02f6154";
const SCOPES = ["User.Read", "Files.ReadWrite.AppFolder"];
const ROOT = "https://graph.microsoft.com/v1.0/me/drive/special/approot:/despeses-mensuals";
const FILE_URL = `${ROOT}/dades.json:/content`;
const BACKUP_URL = (name) => `${ROOT}/copies/${name}:/content`;
const PDF_URL = (name) => `${ROOT}/informes/${encodeURIComponent(name)}:/content`;

export const redirectUri = () => new URL(import.meta.env.BASE_URL, window.location.origin).href;

let msal = null;
let ready = null;

export function getMsal() {
  if (!ready) {
    msal = new PublicClientApplication({
      auth: {
        clientId: CLIENT_ID,
        authority: "https://login.microsoftonline.com/consumers",
        redirectUri: redirectUri(),
        postLogoutRedirectUri: redirectUri(),
      },
      cache: { cacheLocation: "localStorage" },
    });
    ready = msal.initialize().then(async () => {
      const res = await msal.handleRedirectPromise().catch((e) => {
        console.warn("MSAL redirect error", e);
        return null;
      });
      if (res?.account) msal.setActiveAccount(res.account);
      else if (!msal.getActiveAccount() && msal.getAllAccounts().length) msal.setActiveAccount(msal.getAllAccounts()[0]);
      return msal;
    });
  }
  return ready;
}

export async function getAccount() {
  const m = await getMsal();
  return m.getActiveAccount();
}

export async function signIn() {
  const m = await getMsal();
  await m.loginRedirect({ scopes: SCOPES, prompt: "select_account" });
}

export async function signOut() {
  const m = await getMsal();
  const account = m.getActiveAccount();
  // Local sign-out only: forget the session in this browser without signing out of Microsoft everywhere.
  if (account) await m.clearCache({ account });
}

async function token() {
  const m = await getMsal();
  const account = m.getActiveAccount();
  if (!account) throw new Error("NOT_SIGNED_IN");
  try {
    const r = await m.acquireTokenSilent({ scopes: SCOPES, account });
    return r.accessToken;
  } catch (e) {
    if (e instanceof InteractionRequiredAuthError) {
      await m.acquireTokenRedirect({ scopes: SCOPES, account });
      throw new Error("REDIRECTING");
    }
    throw e;
  }
}

/** Returns parsed JSON, or null when the file does not exist yet. */
export async function readRemote() {
  const t = await token();
  const r = await fetch(FILE_URL, { headers: { Authorization: `Bearer ${t}` }, cache: "no-store" });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`OneDrive ${r.status}`);
  return r.json();
}

export async function writeRemote(data) {
  const t = await token();
  const r = await fetch(FILE_URL, {
    method: "PUT",
    headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
    body: JSON.stringify(data, null, 1),
  });
  if (!r.ok) throw new Error(`OneDrive ${r.status}`);
}

/** Keeps one dated copy per day in Apps/Propietats Xavier/copies. */
export async function writeDailyBackup(data) {
  const t = await token();
  const name = `despeses-mensuals-${new Date().toISOString().slice(0, 10)}.json`;
  await fetch(BACKUP_URL(name), {
    method: "PUT",
    headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).catch(() => {});
}


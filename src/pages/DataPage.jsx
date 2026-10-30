import React, { useRef, useState } from "react";
import { Cloud, LogIn, LogOut, RefreshCw, Download, Upload, Smartphone, ShieldCheck, AlertCircle } from "lucide-react";
import { useData } from "../lib/store";
import { Button, Card, PageHeader, cn } from "../components/ui";

function fmtStamp(iso) {
  if (!iso) return "mai";
  return new Date(iso).toLocaleString("ca-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function DataPage() {
  const { data, VariableExpense, FixedExpense, AnnualExpense, Income, GuardiolaMovement, sync, syncNow, signIn, signOut, importData } = useData();
  const fileRef = useRef(null);
  const [msg, setMsg] = useState(null);

  const exportFile = async () => {
    const name = `despeses-mensuals-${new Date().toISOString().slice(0, 10)}.json`;
    const file = new File([JSON.stringify(data, null, 1)], name, { type: "application/json" });
    // On iPhone/iPad the share sheet offers "Save to Files" (iCloud Drive, OneDrive…)
    if (navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file], title: name }); return; } catch (e) { if (e.name === "AbortError") return; }
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(file);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };

  const onImport = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    try {
      const json = JSON.parse(await f.text());
      const n = importData(json);
      setMsg({ ok: true, text: `S'han importat ${n} registres. Els que ja existien s'han actualitzat.` });
    } catch {
      setMsg({ ok: false, text: "No s'ha pogut llegir el fitxer. Ha de ser una còpia exportada d'aquesta app." });
    }
  };

  const connected = !!sync.account;

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader title="Dades i sincronització" subtitle="On es guarden les teves dades i com fer-ne còpies" />

      <Card>
        <div className="flex items-start gap-4">
          <div className={cn("p-3 rounded-xl", connected ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600")}><Cloud className="w-6 h-6" /></div>
          <div className="flex-1 min-w-0 space-y-1">
            <h2 className="font-semibold">OneDrive</h2>
            {connected ? (
              <>
                <p className="text-sm text-muted-foreground">Connectat com a <span className="font-medium text-foreground break-all">{sync.account.username}</span>. Cada canvi es desa automàticament i es veu a la resta de dispositius.</p>
                <p className="text-sm text-muted-foreground">Última sincronització: <span className="text-foreground">{fmtStamp(sync.lastSync)}</span></p>
                <p className="text-xs text-muted-foreground">Carpeta: OneDrive › Aplicacions › Propietats Xavier › despeses-mensuals (dades i una còpia diària).</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Ara mateix les dades només són en aquest navegador. Connecta el teu compte Microsoft perquè es desin al teu OneDrive i les vegis a l'iPhone, l'iPad i el Mac.</p>
            )}
            {sync.status === "error" && (
              <p className="text-sm text-destructive flex items-center gap-1.5"><AlertCircle className="w-4 h-4" />No s'ha pogut sincronitzar ({sync.error}). Els canvis són segurs en aquest dispositiu i es tornarà a provar.</p>
            )}
            {sync.status === "offline" && <p className="text-sm text-amber-600">Sense connexió: els canvis es pujaran quan tornis a tenir internet.</p>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {connected ? (
            <>
              <Button onClick={syncNow} disabled={sync.status === "syncing"}><RefreshCw className={cn("w-4 h-4", sync.status === "syncing" && "animate-spin")} />Sincronitzar ara</Button>
              <Button variant="outline" onClick={() => window.confirm("Desconnectar OneDrive d'aquest dispositiu? Les dades que ja hi ha a OneDrive no s'esborren.") && signOut()}><LogOut className="w-4 h-4" />Desconnectar</Button>
            </>
          ) : (
            <Button onClick={signIn}><LogIn className="w-4 h-4" />Connectar amb OneDrive</Button>
          )}
        </div>
      </Card>

      <Card>
        <h2 className="font-semibold mb-1">Còpia de seguretat manual</h2>
        <p className="text-sm text-muted-foreground mb-4">Desa un fitxer amb totes les dades on vulguis (per exemple a iCloud Drive), o recupera'n un. Importar no esborra res: afegeix i actualitza.</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={exportFile}><Download className="w-4 h-4" />Exportar còpia</Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()}><Upload className="w-4 h-4" />Importar còpia</Button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={onImport} />
        </div>
        {msg && <p className={cn("text-sm mt-3", msg.ok ? "text-green-600 dark:text-green-400" : "text-destructive")}>{msg.text}</p>}
        <p className="text-xs text-muted-foreground mt-4">Ara mateix: {FixedExpense.length} fixes · {VariableExpense.length} variables · {AnnualExpense.length} anuals · {Income.length} ingressos · {GuardiolaMovement.length} moviments de guardiola</p>
      </Card>

      <Card>
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-primary/10 text-primary"><Smartphone className="w-6 h-6" /></div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <h2 className="font-semibold text-foreground">Tenir-la com una app</h2>
            <p><span className="font-medium text-foreground">iPhone i iPad:</span> obre aquesta pàgina amb Safari, prem el botó Compartir i tria «Afegir a la pantalla d'inici».</p>
            <p><span className="font-medium text-foreground">Mac:</span> a Safari, menú Arxiu › «Afegir al Dock». A Chrome, la icona d'instal·lar de la barra d'adreces.</p>
          </div>
        </div>
      </Card>

      <p className="flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="w-4 h-4" />Les dades no passen per cap servidor nostre: només viuen en els teus dispositius i al teu OneDrive.</p>
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { LayoutDashboard, CreditCard, Zap, CalendarClock, BarChart2, PiggyBank, Coins, Banknote, Cloud, CloudOff, RefreshCw, AlertCircle, HardDrive } from "lucide-react";
import { DataProvider, useData } from "./lib/store";
import { cn } from "./components/ui";
import Resum from "./pages/Resum";
import { Fixes, Variables, Anuals, Ingressos, Estalvis } from "./pages/Llistes";
import Guardiola from "./pages/Guardiola";
import Historic from "./pages/Historic";
import DataPage from "./pages/DataPage";

const NAV = [
  ["resum", "Resum", LayoutDashboard, Resum],
  ["fixes", "Fixes", CreditCard, Fixes],
  ["variables", "Variables", Zap, Variables],
  ["anuals", "Anuals", CalendarClock, Anuals],
  ["estalvis", "Estalvis", PiggyBank, Estalvis],
  ["ingressos", "Ingressos", Banknote, Ingressos],
  ["guardiola", "Guardiola", Coins, Guardiola],
  ["historic", "Històric", BarChart2, Historic],
];
const PAGES = { ...Object.fromEntries(NAV.map(([k, , , el]) => [k, el])), dades: DataPage };
const actual = () => { const k = window.location.hash.replace(/^#\/?/, ""); return PAGES[k] ? k : "resum"; };

function SyncBadge() {
  const { sync } = useData();
  const m = {
    starting: [RefreshCw, "Iniciant…", "text-muted-foreground", true],
    syncing: [RefreshCw, "Sincronitzant…", "text-muted-foreground", true],
    synced: [Cloud, "OneDrive", "text-emerald-600 dark:text-emerald-400"],
    local: [HardDrive, "Només aquí", "text-amber-600 dark:text-amber-400"],
    offline: [CloudOff, "Sense connexió", "text-amber-600"],
    error: [AlertCircle, "Error", "text-red-500"],
  }[sync.status];
  const [Icon, text, cls, spin] = m;
  return (
    <a href="#/dades" title="Dades i sincronització" className={cn("flex items-center gap-1.5 text-xs font-medium px-2.5 py-2 rounded-lg hover:bg-muted", cls)}>
      <Icon className={cn("w-4 h-4", spin && "animate-spin")} /><span className="hidden lg:inline">{text}</span>
    </a>
  );
}

function Shell() {
  const [page, setPage] = useState(actual);
  useEffect(() => {
    const on = () => { setPage(actual()); window.scrollTo(0, 0); };
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  const Page = PAGES[page];
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 bg-card/90 backdrop-blur-lg border-b border-border pt-safe no-print">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <a href="#/resum" className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center"><CreditCard className="w-5 h-5 text-primary-foreground" /></div>
            <span className="font-bold text-lg tracking-tight">Despeses</span>
          </a>
          <nav className="hidden md:flex items-center gap-0.5 overflow-x-auto">
            {NAV.map(([k, label, Icon]) => (
              <a key={k} href={`#/${k}`} className={cn("flex items-center gap-1.5 px-2.5 lg:px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                page === k ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted")}>
                <Icon className="w-4 h-4" /><span className="hidden lg:inline">{label}</span><span className="lg:hidden">{label.slice(0, 4)}</span>
              </a>
            ))}
          </nav>
          <SyncBadge />
        </div>
      </header>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border pb-safe no-print">
        <div className="grid grid-cols-4 px-1 pt-1.5">
          {NAV.map(([k, label, Icon]) => (
            <a key={k} href={`#/${k}`} className={cn("flex flex-col items-center gap-0.5 py-1.5 text-[11px] font-medium", page === k ? "text-primary" : "text-muted-foreground")}>
              <Icon className="w-5 h-5" /><span className="truncate w-full text-center">{label}</span>
            </a>
          ))}
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-6 sm:py-8 pb-36 md:pb-10"><Page /></main>
    </div>
  );
}

export default function App() {
  return <DataProvider><Shell /></DataProvider>;
}

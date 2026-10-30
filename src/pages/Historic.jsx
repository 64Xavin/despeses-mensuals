import React, { useState } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { useData } from "../lib/store";
import { Select, cn } from "../components/ui";
import { Capcalera } from "../components/despeses";
import { eur, fmtMes } from "../lib/finance";

export default function Historic() {
  const { VariableExpense: llista } = useData();
  const [cat, setCat] = useState("Totes");
  const categories = [...new Set(llista.map((e) => e.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ca"));
  const mesos = [...new Set(llista.map((e) => e.month).filter(Boolean))].sort();

  const dades = mesos.map((m) => {
    const t = llista.filter((e) => e.month === m && (cat === "Totes" || e.category === cat)).reduce((s, e) => s + (e.amount || 0), 0);
    return { mes: fmtMes(m, true), value: Math.round(t * 100) / 100 };
  });
  const ambValor = dades.filter((d) => d.value > 0);
  const mitjana = ambValor.length ? ambValor.reduce((s, d) => s + d.value, 0) / ambValor.length : 0;
  const darrer = mesos[mesos.length - 1];

  const resum = categories.map((c) => {
    const items = llista.filter((e) => e.category === c);
    const n = new Set(items.map((e) => e.month)).size;
    const total = items.reduce((s, e) => s + (e.amount || 0), 0);
    const avg = n ? total / n : 0;
    const ultim = items.filter((e) => e.month === darrer).reduce((s, e) => s + (e.amount || 0), 0);
    return { c, avg, ultim, diff: ultim - avg, n };
  });

  return (
    <div className="space-y-6">
      <Capcalera titol="Històric de variables" subtitol="Comparativa mes a mes respecte a la mitjana" />

      <div className="bg-card rounded-2xl border border-border p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
          <h2 className="font-semibold">{cat === "Totes" ? "Total de variables per mes" : cat}</h2>
          <Select value={cat} onChange={(e) => setCat(e.target.value)} className="w-48 no-print">
            <option value="Totes">Totes les categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </div>
        {!dades.length ? <p className="text-muted-foreground text-center py-16 text-sm">Encara no hi ha dades</p> : (
          <>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dades} margin={{ top: 10, right: 8, left: -6, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="mes" fontSize={12} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis fontSize={12} tickFormatter={(v) => `${v}€`} tick={{ fill: "hsl(var(--muted-foreground))" }} width={56} />
                  <Tooltip formatter={(v) => [eur(v), "Import"]} cursor={{ fill: "hsl(var(--muted))" }}
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 13 }} />
                  <ReferenceLine y={Math.round(mitjana * 100) / 100} stroke="hsl(270 65% 58%)" strokeDasharray="6 3" />
                  <Bar dataKey="value" fill="hsl(234 85% 55%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-2"><span className="w-4 h-3 rounded bg-primary inline-block" />Import mensual</span>
              <span className="flex items-center gap-2"><span className="w-6 border-t-2 border-dashed inline-block" style={{ borderColor: "hsl(270 65% 58%)" }} />Mitjana ({eur(mitjana)})</span>
            </div>
          </>
        )}
      </div>

      <div className="bg-card rounded-2xl border border-border p-5 sm:p-6">
        <h2 className="font-semibold mb-4">Resum per categoria</h2>
        {!resum.length ? <p className="text-muted-foreground text-sm">Encara no hi ha dades</p> : (
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="pb-3 px-2 font-medium">Categoria</th>
                  <th className="pb-3 px-2 font-medium text-right">Mitjana</th>
                  <th className="pb-3 px-2 font-medium text-right">{darrer ? fmtMes(darrer, true) : "Últim"}</th>
                  <th className="pb-3 px-2 font-medium text-right">Diferència</th>
                  <th className="pb-3 px-2 font-medium text-right hidden sm:table-cell">Mesos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {resum.map(({ c, avg, ultim, diff, n }) => {
                  const alt = diff > 0.005, baix = diff < -0.005;
                  return (
                    <tr key={c} onClick={() => setCat(cat === c ? "Totes" : c)}
                      className={cn("cursor-pointer hover:bg-muted/50", cat === c && "bg-primary/5")}>
                      <td className="py-3 px-2 font-medium">{c}</td>
                      <td className="py-3 px-2 text-right tabular-nums whitespace-nowrap">{eur(avg)}</td>
                      <td className="py-3 px-2 text-right tabular-nums font-semibold whitespace-nowrap">{eur(ultim)}</td>
                      <td className="py-3 px-2 text-right">
                        <span className={cn("inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-lg text-xs whitespace-nowrap",
                          alt ? "bg-destructive/10 text-destructive" : baix ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-foreground")}>
                          {alt ? <TrendingUp className="w-3 h-3" /> : baix ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                          {alt ? "+" : ""}{diff.toLocaleString("ca-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right text-muted-foreground hidden sm:table-cell">{n}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-4 no-print">Toca una categoria per veure-la al gràfic.</p>
      </div>
    </div>
  );
}

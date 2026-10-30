import React, { useState } from "react";
import { CreditCard, Zap, CalendarClock, Wallet, PiggyBank, Banknote, TrendingUp } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { useData } from "../lib/store";
import { Capcalera, SelectorMes, StatCard } from "../components/despeses";
import { despesesDelMes, eur, fmtMes, mesActual, mesosDisponibles, suma } from "../lib/finance";

const COLORS = ["hsl(270 65% 58%)", "hsl(234 85% 55%)", "hsl(160 55% 42%)", "hsl(35 90% 52%)", "hsl(340 70% 55%)"];
const tip = { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 13 };

export default function Resum() {
  const { FixedExpense, VariableExpense, AnnualExpense, Income, SavingsEntry, SavingsContribution } = useData();
  const [mes, setMes] = useState(mesActual());
  const mesos = mesosDisponibles([VariableExpense, Income], mesActual(), mes);

  const { totalFixes, totalVariables, anualMensual, totalDespeses, fixesActives, variablesMes } = despesesDelMes(FixedExpense, VariableExpense, AnnualExpense, mes);
  const totalAnual = suma(AnnualExpense.filter((e) => e.active !== false));
  const ingressos = suma(Income.filter((e) => e.month === mes));
  const estalvisFixos = suma(SavingsEntry.filter((e) => e.active !== false));
  const estalvisVar = suma(SavingsContribution.filter((e) => e.month === mes));
  const estalvis = estalvisFixos + estalvisVar;
  const disponible = ingressos - totalDespeses;
  const totalMensual = totalDespeses + estalvis;

  const files = [
    { label: "Despeses fixes", value: totalFixes },
    { label: "Despeses variables", value: totalVariables },
    { label: "Despeses anuals (part mensual)", value: anualMensual },
    { label: "Estalvis fixos", value: estalvisFixos },
    { label: "Estalvis puntuals", value: estalvisVar },
  ];
  const pie = files.map((f, i) => ({ ...f, color: COLORS[i] })).filter((d) => d.value > 0);

  const cat = {};
  [...fixesActives, ...variablesMes].forEach((e) => { cat[e.category] = (cat[e.category] || 0) + (e.amount || 0); });
  const barres = Object.entries(cat).map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 })).sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-6 sm:space-y-8">
      <Capcalera titol="Resum" subtitol={`Les teves despeses de ${fmtMes(mes)}`}>
        <SelectorMes value={mes} onChange={setMes} mesos={mesos} />
      </Capcalera>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={CreditCard} label="Fixes" value={eur(totalFixes)} sublabel={`${fixesActives.length} subscripcions`} color="violet" />
        <StatCard icon={Zap} label="Variables" value={eur(totalVariables)} sublabel={fmtMes(mes)} color="primary" />
        <StatCard icon={CalendarClock} label="Anuals (part mensual)" value={eur(anualMensual)} sublabel={`${eur(totalAnual)}/any`} color="green" />
        <StatCard icon={PiggyBank} label="Estalvis" value={eur(estalvis)} sublabel={`Fixos ${eur(estalvisFixos)} + puntuals ${eur(estalvisVar)}`} color="amber" />
        <StatCard icon={Banknote} label="Ingressos" value={eur(ingressos)} sublabel={fmtMes(mes)} color="green" />
        <StatCard icon={TrendingUp} label="Disponible" value={eur(disponible)} sublabel="Ingressos − despeses" color={disponible >= 0 ? "green" : "red"} />
        <StatCard icon={Wallet} label="Total mensual" value={eur(totalMensual)} sublabel={`Despeses ${eur(totalDespeses)} + estalvis ${eur(estalvis)}`} color="primary" />
      </div>

      <div className="bg-card rounded-2xl border border-border p-5 sm:p-6">
        <h2 className="font-semibold mb-4">Total mensual desglossat</h2>
        <div className="space-y-3">
          {files.map((r, i) => (
            <div key={r.label} className="grid grid-cols-[1fr_auto] sm:grid-cols-[14rem_1fr_7rem] items-center gap-x-4 gap-y-1">
              <span className="text-sm text-muted-foreground">{r.label}</span>
              <div className="col-span-2 sm:col-span-1 row-start-2 sm:row-start-auto bg-muted rounded-full h-2.5 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: totalMensual > 0 ? `${(r.value / totalMensual) * 100}%` : "0%", background: COLORS[i] }} />
              </div>
              <span className="font-semibold tabular-nums text-sm text-right col-start-2 row-start-1 sm:col-start-auto sm:row-start-auto">{eur(r.value)}</span>
            </div>
          ))}
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <span className="text-sm font-semibold">TOTAL</span>
            <span className="font-bold text-lg tabular-nums text-primary">{eur(totalMensual)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl border border-border p-5 sm:p-6">
          <h2 className="font-semibold mb-4">Distribució mensual</h2>
          {pie.length ? (
            <>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pie} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value" nameKey="label" stroke="none">
                      {pie.map((d) => <Cell key={d.label} fill={d.color} />)}
                    </Pie>
                    <Tooltip contentStyle={tip} formatter={(v, n) => [eur(v), n]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 mt-3">
                {pie.map((d) => (
                  <div key={d.label} className="flex items-center gap-2 text-sm min-w-0">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ background: d.color }} />
                    <span className="text-muted-foreground truncate">{d.label}</span>
                    <span className="ml-auto font-medium tabular-nums shrink-0">{eur(d.value)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : <p className="text-muted-foreground text-sm text-center py-16">Encara no hi ha dades</p>}
        </div>

        <div className="bg-card rounded-2xl border border-border p-5 sm:p-6">
          <h2 className="font-semibold mb-4">Per categories <span className="text-xs font-normal text-muted-foreground">(fixes i variables)</span></h2>
          {barres.length ? (
            <div style={{ height: Math.max(200, barres.length * 36) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barres} layout="vertical" margin={{ left: 0, right: 56, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" tickFormatter={(v) => `${v}€`} fontSize={11} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis type="category" dataKey="name" fontSize={11} width={110} tick={{ fill: "hsl(var(--foreground))" }} />
                  <Tooltip contentStyle={tip} formatter={(v) => [eur(v), "Import"]} cursor={{ fill: "hsl(var(--muted))" }} />
                  <Bar dataKey="value" fill="hsl(234 85% 55%)" radius={[0, 6, 6, 0]}
                    label={{ position: "right", formatter: (v) => `${Math.round(v)}€`, fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="text-muted-foreground text-sm text-center py-16">Encara no hi ha dades</p>}
        </div>
      </div>
    </div>
  );
}

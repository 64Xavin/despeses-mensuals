import React, { useMemo, useState } from "react";
import { Plus, CreditCard, CalendarClock, Zap, Banknote, Wallet, TrendingUp, TrendingDown, Minus, PiggyBank } from "lucide-react";
import { useData } from "../lib/store";
import { Button, Modal, cn } from "../components/ui";
import { Buit, Capcalera, Fila, FormDespesa, SelectorMes, StatCard } from "../components/despeses";
import { CATEGORIES, avui, actiuAlMes, despesesDelMes, eur, fmtData, fmtMes, fmtMesAny, mesActual, mesosDisponibles, suma } from "../lib/finance";

/** Shared add / edit / delete state for a collection. */
function useEdicio(col) {
  const { db } = useData();
  const [form, setForm] = useState(null); // null | {item?}
  const desar = (dades, onMes) => {
    if (dades.date) { dades.month = dades.date.slice(0, 7); onMes?.(dades.month); }
    if (form?.item) db[col].update(form.item.id, dades);
    else db[col].create(dades);
    setForm(null);
  };
  const eliminar = (e) => window.confirm(`Segur que vols eliminar «${e.name || e.description}»? Aquesta acció no es pot desfer.`) && db[col].remove(e.id);
  return { form, setForm, desar, eliminar };
}

/** New entries get today's date; old ones without a date start on the 1st of their month. */
const ambData = (item) => (item ? { ...item, date: item.date || (item.month ? `${item.month}-01` : avui()) } : { date: avui() });
/** Newest first by date, then by name. */
const ordenaData = (l) => [...l].sort((a, b) => (b.date || "").localeCompare(a.date || "") || (a.name || "").localeCompare(b.name || "", "ca"));
const ordenaNom = (l) => [...l].sort((a, b) => (a.name || "").localeCompare(b.name || "", "ca"));

// ───────────────────────── Fixes ─────────────────────────
export function Fixes() {
  const { FixedExpense: llista } = useData();
  const ed = useEdicio("FixedExpense");
  const actives = llista.filter((e) => actiuAlMes(e, mesActual()));
  const camps = [
    { key: "name", label: "Nom", placeholder: "Ex: Netflix", required: true },
    { key: "category", label: "Categoria", type: "select", options: CATEGORIES.FixedExpense, required: true },
    { key: "start_date", label: "Data d'inici", type: "date" },
    { key: "end_date", label: "Data de final", type: "date" },
    { key: "notes", label: "Notes", placeholder: "Opcional" },
  ];
  return (
    <div className="space-y-6">
      <Capcalera titol="Despeses fixes" subtitol="Subscripcions i pagaments mensuals recurrents">
        <Button onClick={() => ed.setForm({})}><Plus className="w-4 h-4" />Afegir</Button>
      </Capcalera>
      <div className="max-w-sm"><StatCard icon={CreditCard} label="Total mensual" value={eur(suma(actives))} sublabel={`${actives.length} actives aquest mes`} color="violet" /></div>
      <div className="space-y-2.5">
        {!llista.length ? <Buit icon={CreditCard} text="Encara no tens despeses fixes"><Button variant="outline" onClick={() => ed.setForm({})}><Plus className="w-4 h-4" />Afegir la primera</Button></Buit>
          : ordenaNom(llista).map((e) => (
            <div key={e.id} className={cn(!actiuAlMes(e, mesActual()) && "opacity-55")}>
              <Fila e={e} onEdit={(x) => ed.setForm({ item: x })} onDelete={ed.eliminar}
                extra={[e.start_date && `Inici: ${fmtMesAny(e.start_date)}`, e.end_date && `Final: ${fmtMesAny(e.end_date)}`, !actiuAlMes(e, mesActual()) && "Inactiva"].filter(Boolean).join(" · ")} />
            </div>
          ))}
      </div>
      <Modal open={!!ed.form} title={ed.form?.item ? "Editar despesa fixa" : "Nova despesa fixa"} onClose={() => ed.setForm(null)}>
        {ed.form && <FormDespesa inicial={ed.form.item || {}} camps={camps} compartida onSubmit={(d) => ed.desar(ed.form.item ? d : { ...d, active: true })} onCancel={() => ed.setForm(null)} />}
      </Modal>
    </div>
  );
}

// ───────────────────────── Anuals ─────────────────────────
export function Anuals() {
  const { AnnualExpense: llista } = useData();
  const ed = useEdicio("AnnualExpense");
  const actives = llista.filter((e) => e.active !== false);
  const delMes = llista.filter((e) => actiuAlMes(e, mesActual()));
  const camps = [
    { key: "name", label: "Nom", placeholder: "Ex: Assegurança cotxe", required: true },
    { key: "category", label: "Categoria", type: "select", options: CATEGORIES.AnnualExpense, required: true },
    { key: "due_date", label: "Data de venciment", type: "date" },
    { key: "start_date", label: "Data d'alta", type: "date" },
    { key: "end_date", label: "Data de baixa", type: "date" },
    { key: "notes", label: "Notes", placeholder: "Opcional" },
  ];
  return (
    <div className="space-y-6">
      <Capcalera titol="Despeses anuals" subtitol="Assegurances, quotes i pagaments anuals">
        <Button onClick={() => ed.setForm({})}><Plus className="w-4 h-4" />Afegir</Button>
      </Capcalera>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
        <StatCard icon={CalendarClock} label="Total anual" value={eur(suma(actives))} sublabel={`${actives.length} despeses`} color="green" />
        <StatCard icon={CalendarClock} label="Equivalent mensual" value={eur(suma(delMes, (e) => (e.amount || 0) / 12))} sublabel="Repartit en 12 mesos" color="amber" />
      </div>
      <div className="space-y-2.5">
        {!llista.length ? <Buit icon={CalendarClock} text="Encara no tens despeses anuals"><Button variant="outline" onClick={() => ed.setForm({})}><Plus className="w-4 h-4" />Afegir la primera</Button></Buit>
          : ordenaNom(llista).map((e) => (
            <div key={e.id} className={cn(!actiuAlMes(e, mesActual()) && "opacity-55")}>
              <Fila e={e} onEdit={(x) => ed.setForm({ item: x })} onDelete={ed.eliminar} subimport={`${eur((e.amount || 0) / 12)}/mes`}
                extra={[e.due_date && `Venciment: ${fmtData(e.due_date)}`, e.start_date && `Alta: ${fmtMesAny(e.start_date)}`, e.end_date && `Baixa: ${fmtMesAny(e.end_date)}`].filter(Boolean).join(" · ")} />
            </div>
          ))}
      </div>
      <Modal open={!!ed.form} title={ed.form?.item ? "Editar despesa anual" : "Nova despesa anual"} onClose={() => ed.setForm(null)}>
        {ed.form && <FormDespesa inicial={ed.form.item || {}} camps={camps} compartida onSubmit={(d) => ed.desar(ed.form.item ? d : { ...d, active: true })} onCancel={() => ed.setForm(null)} />}
      </Modal>
    </div>
  );
}

// ───────────────────────── Variables ─────────────────────────
export function Variables() {
  const { VariableExpense: llista } = useData();
  const ed = useEdicio("VariableExpense");
  const [mes, setMes] = useState(mesActual());
  const mesos = mesosDisponibles([llista], mesActual(), mes);
  const delMes = llista.filter((e) => e.month === mes);
  const mitjana = useMemo(() => {
    const acc = {};
    llista.forEach((e) => { (acc[e.name] ||= { t: 0, n: 0 }); acc[e.name].t += e.amount || 0; acc[e.name].n++; });
    return (nom) => (acc[nom]?.n ? acc[nom].t / acc[nom].n : null);
  }, [llista]);
  const camps = [
    { key: "name", label: "Nom", placeholder: "Ex: Factura llum", required: true },
    { key: "category", label: "Categoria", type: "select", options: CATEGORIES.VariableExpense, required: true },
    { key: "date", label: "Data", type: "date", required: true },
    { key: "notes", label: "Notes", placeholder: "Opcional" },
  ];
  return (
    <div className="space-y-6">
      <Capcalera titol="Despeses variables" subtitol="Llum, aigua, gas i altres despeses de cada mes">
        <Button onClick={() => ed.setForm({})}><Plus className="w-4 h-4" />Afegir</Button>
      </Capcalera>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="w-full max-w-sm"><StatCard icon={Zap} label={`Total ${fmtMes(mes)}`} value={eur(suma(delMes))} sublabel={`${delMes.length} despeses`} color="primary" /></div>
        <SelectorMes value={mes} onChange={setMes} mesos={mesos} />
      </div>
      <div className="space-y-2.5">
        {!delMes.length ? <Buit icon={Zap} text={`Cap despesa variable a ${fmtMes(mes)}`}><Button variant="outline" onClick={() => ed.setForm({})}><Plus className="w-4 h-4" />Afegir despesa</Button></Buit>
          : ordenaData(delMes).map((e) => {
            const avg = mitjana(e.name);
            const diff = avg !== null ? (e.amount || 0) - avg : null;
            const alt = diff > 0.005, baix = diff < -0.005;
            return (
              <Fila key={e.id} e={e} extra={e.date && fmtData(e.date)} onEdit={(x) => ed.setForm({ item: x })} onDelete={ed.eliminar} subimport="aquest mes"
                dreta={avg !== null && (
                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block"><p className="text-sm text-muted-foreground tabular-nums">{eur(avg)}</p><p className="text-xs text-muted-foreground">mitjana</p></div>
                    <span title={`Diferència respecte a la mitjana: ${eur(diff)}`} className={cn("flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg",
                      alt ? "bg-destructive/10 text-destructive" : baix ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-foreground")}>
                      {alt ? <TrendingUp className="w-3 h-3" /> : baix ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                      <span className="hidden sm:inline tabular-nums">{alt ? "+" : ""}{(diff).toLocaleString("ca-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span>
                    </span>
                  </div>
                )} />
            );
          })}
      </div>
      <Modal open={!!ed.form} title={ed.form?.item ? "Editar despesa variable" : "Nova despesa variable"} onClose={() => ed.setForm(null)}>
        {ed.form && <FormDespesa inicial={ambData(ed.form.item)} camps={camps} compartida onSubmit={(d) => ed.desar(d, setMes)} onCancel={() => ed.setForm(null)} />}
      </Modal>
    </div>
  );
}

// ───────────────────────── Ingressos ─────────────────────────
export function Ingressos() {
  const { Income: llista, FixedExpense, VariableExpense, AnnualExpense } = useData();
  const ed = useEdicio("Income");
  const [mes, setMes] = useState(mesActual());
  const mesos = mesosDisponibles([llista], mesActual(), mes);
  const delMes = llista.filter((e) => e.month === mes);
  const total = suma(delMes);
  const { totalDespeses } = despesesDelMes(FixedExpense, VariableExpense, AnnualExpense, mes);
  const disponible = total - totalDespeses;
  const camps = [
    { key: "name", label: "Descripció", placeholder: "Ex: Nòmina", required: true },
    { key: "amount", label: "Import (€)", type: "number", required: true },
    { key: "category", label: "Categoria", type: "select", options: CATEGORIES.Income, required: true },
    { key: "date", label: "Data", type: "date", required: true },
    { key: "notes", label: "Notes", placeholder: "Opcional" },
  ];
  return (
    <div className="space-y-6">
      <Capcalera titol="Ingressos" subtitol="Registra els ingressos i consulta el disponible">
        <SelectorMes value={mes} onChange={setMes} mesos={mesos} />
        <Button onClick={() => ed.setForm({})}><Plus className="w-4 h-4" />Afegir</Button>
      </Capcalera>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Banknote} label="Ingressos" value={eur(total)} sublabel={fmtMes(mes)} color="green" />
        <StatCard icon={Wallet} label="Despeses mensuals" value={eur(totalDespeses)} sublabel="Fixes + variables + anuals" color="primary" />
        <StatCard icon={TrendingUp} label="Disponible" value={eur(disponible)} sublabel="Ingressos − despeses" color={disponible >= 0 ? "green" : "red"} />
      </div>
      <h2 className="font-semibold">Ingressos de {fmtMes(mes)}</h2>
      <div className="space-y-2.5">
        {!delMes.length ? <Buit icon={Banknote} text="No hi ha ingressos registrats aquest mes"><Button variant="outline" onClick={() => ed.setForm({})}><Plus className="w-4 h-4" />Afegir el primer</Button></Buit>
          : ordenaData(delMes).map((e) => <Fila key={e.id} e={e} extra={e.date && fmtData(e.date)} onEdit={(x) => ed.setForm({ item: x })} onDelete={ed.eliminar} />)}
      </div>
      <Modal open={!!ed.form} title={ed.form?.item ? "Editar ingrés" : "Nou ingrés"} onClose={() => ed.setForm(null)}>
        {ed.form && <FormDespesa inicial={ambData(ed.form.item)} camps={camps} onSubmit={(d) => ed.desar(d, setMes)} onCancel={() => ed.setForm(null)} />}
      </Modal>
    </div>
  );
}

// ───────────────────────── Estalvis ─────────────────────────
export function Estalvis() {
  const { SavingsEntry: fixes, SavingsContribution: variables, db } = useData();
  const [form, setForm] = useState(null); // {tipus:'fix'|'var', item?}
  const [mes, setMes] = useState(mesActual());
  const mesos = mesosDisponibles([variables], mesActual(), mes);
  const actius = fixes.filter((e) => e.active !== false);
  const delMes = variables.filter((e) => e.month === mes);
  const tFix = suma(actius), tVar = suma(delMes);
  const col = (t) => (t === "fix" ? "SavingsEntry" : "SavingsContribution");
  const base = [
    { key: "name", label: "Nom", placeholder: "Ex: Fons vacances", required: true },
    { key: "amount", label: "Import (€)", type: "number", required: true },
    { key: "category", label: "Categoria", type: "select", options: CATEGORIES.Savings, required: true },
  ];
  const camps = (t) => (t === "fix"
    ? [...base, { key: "notes", label: "Notes", placeholder: "Opcional" }]
    : [...base, { key: "date", label: "Data", type: "date", required: true }, { key: "notes", label: "Notes", placeholder: "Opcional" }]);
  const desar = (d) => {
    if (d.date) { d.month = d.date.slice(0, 7); setMes(d.month); }
    const c = col(form.tipus);
    if (form.item) db[c].update(form.item.id, d);
    else db[c].create(form.tipus === "fix" ? { ...d, active: true } : d);
    setForm(null);
  };
  const eliminar = (t) => (e) => window.confirm(`Segur que vols eliminar «${e.name}»?`) && db[col(t)].remove(e.id);
  return (
    <div className="space-y-6">
      <Capcalera titol="Estalvis" subtitol="Aportacions fixes i puntuals als teus plans d'estalvi">
        <Button variant="outline" onClick={() => setForm({ tipus: "var" })}><TrendingUp className="w-4 h-4" />Aportació puntual</Button>
        <Button onClick={() => setForm({ tipus: "fix" })}><Plus className="w-4 h-4" />Aportació fixa</Button>
      </Capcalera>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={PiggyBank} label="Fixes mensuals" value={eur(tFix)} sublabel={`${actius.length} aportacions`} color="green" />
        <StatCard icon={TrendingUp} label={`Puntuals ${fmtMes(mes)}`} value={eur(tVar)} sublabel={`${delMes.length} aportacions`} color="amber" />
        <StatCard icon={PiggyBank} label={`Total ${fmtMes(mes)}`} value={eur(tFix + tVar)} sublabel="fixes + puntuals" color="primary" />
      </div>
      <section>
        <h2 className="text-lg font-semibold mb-3">Aportacions fixes mensuals</h2>
        <div className="space-y-2.5">
          {!actius.length ? <Buit icon={PiggyBank} text="Cap aportació fixa" />
            : ordenaNom(actius).map((e) => <Fila key={e.id} e={e} onEdit={(x) => setForm({ tipus: "fix", item: x })} onDelete={eliminar("fix")} />)}
        </div>
      </section>
      <section>
        <div className="flex items-center justify-between mb-3 gap-3">
          <h2 className="text-lg font-semibold">Aportacions puntuals</h2>
          <SelectorMes value={mes} onChange={setMes} mesos={mesos} className="w-36" />
        </div>
        <div className="space-y-2.5">
          {!delMes.length ? <Buit icon={TrendingUp} text={`Cap aportació puntual a ${fmtMes(mes)}`}><Button variant="outline" size="sm" onClick={() => setForm({ tipus: "var" })}><Plus className="w-4 h-4" />Afegir</Button></Buit>
            : ordenaData(delMes).map((e) => <Fila key={e.id} e={e} extra={e.date && fmtData(e.date)} onEdit={(x) => setForm({ tipus: "var", item: x })} onDelete={eliminar("var")} />)}
        </div>
      </section>
      <Modal open={!!form} title={form ? `${form.item ? "Editar" : "Nova"} aportació ${form.tipus === "fix" ? "fixa" : "puntual"}` : ""} onClose={() => setForm(null)}>
        {form && <FormDespesa inicial={form.tipus === "var" ? ambData(form.item) : form.item || {}} camps={camps(form.tipus)} onSubmit={desar} onCancel={() => setForm(null)} />}
      </Modal>
    </div>
  );
}

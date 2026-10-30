import React, { useState } from "react";
import { Plus, PiggyBank, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { useData } from "../lib/store";
import { Button, Field, Input, Modal, Select, cn } from "../components/ui";
import { Accions, Buit, Capcalera } from "../components/despeses";
import { avui, eur, fmtData } from "../lib/finance";

function Formulari({ item, onSubmit, onCancel }) {
  const [f, setF] = useState({ type: "entrada", date: avui(), description: "", notes: "", ...item, amount: item?.amount != null ? String(item.amount) : "" });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onSubmit({ ...f, amount: Math.abs(parseFloat(f.amount.replace(",", "."))) }); }}>
      <Field label="Tipus">
        <Select value={f.type} onChange={set("type")}>
          <option value="entrada">Entrada (ingrés)</option>
          <option value="sortida">Sortida (despesa)</option>
        </Select>
      </Field>
      <Field label="Descripció *"><Input value={f.description} onChange={set("description")} placeholder="Ex: Retirada caixer, reserva vacances…" required /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Import (€) *"><Input inputMode="decimal" value={f.amount} onChange={set("amount")} placeholder="0,00" required /></Field>
        <Field label="Data *"><Input type="date" value={f.date} onChange={set("date")} required /></Field>
      </div>
      <Field label="Notes"><Input value={f.notes || ""} onChange={set("notes")} placeholder="Opcional" /></Field>
      <div className="flex gap-3 pt-1">
        <Button variant="outline" className="flex-1" onClick={onCancel}>Cancel·lar</Button>
        <Button type="submit" className="flex-1">Desar</Button>
      </div>
    </form>
  );
}

export default function Guardiola() {
  const { GuardiolaMovement: llista, db } = useData();
  const [form, setForm] = useState(null);
  const moviments = [...llista].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  const entrades = llista.filter((m) => m.type === "entrada").reduce((s, m) => s + (m.amount || 0), 0);
  const sortides = llista.filter((m) => m.type === "sortida").reduce((s, m) => s + (m.amount || 0), 0);
  const saldo = entrades - sortides;
  const desar = (d) => { form.item ? db.GuardiolaMovement.update(form.item.id, d) : db.GuardiolaMovement.create(d); setForm(null); };

  return (
    <div className="space-y-6">
      <Capcalera titol="Guardiola" subtitol="Registre dels diners en efectiu">
        <Button onClick={() => setForm({})}><Plus className="w-4 h-4" />Nou moviment</Button>
      </Capcalera>

      <div className="bg-card rounded-2xl border border-border p-8 flex flex-col items-center gap-2 text-center">
        <PiggyBank className="w-12 h-12 text-primary mb-1" />
        <p className="text-muted-foreground text-sm font-medium uppercase tracking-wider">Saldo actual</p>
        <p className={cn("text-4xl sm:text-5xl font-bold tabular-nums", saldo < 0 && "text-destructive")}>{eur(saldo)}</p>
        <div className="flex gap-8 mt-4">
          <div><p className="text-xs text-muted-foreground mb-1">Total entrades</p><p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">+{eur(entrades)}</p></div>
          <div><p className="text-xs text-muted-foreground mb-1">Total sortides</p><p className="text-lg font-semibold text-destructive tabular-nums">−{eur(sortides)}</p></div>
        </div>
      </div>

      {!moviments.length ? (
        <Buit icon={PiggyBank} text="Cap moviment enregistrat"><Button variant="outline" onClick={() => setForm({})}><Plus className="w-4 h-4" />Afegir el primer</Button></Buit>
      ) : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border"><h2 className="font-semibold">Moviments</h2></div>
          <div className="divide-y divide-border">
            {moviments.map((m) => {
              const in_ = m.type === "entrada";
              return (
                <div key={m.id} className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5">
                  <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0", in_ ? "bg-emerald-500/10" : "bg-destructive/10")}>
                    {in_ ? <ArrowUpCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> : <ArrowDownCircle className="w-5 h-5 text-destructive" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{m.description}</p>
                    <p className="text-xs text-muted-foreground truncate">{fmtData(m.date)}{m.notes ? ` · ${m.notes}` : ""}</p>
                  </div>
                  <p className={cn("font-bold tabular-nums shrink-0", in_ ? "text-emerald-600 dark:text-emerald-400" : "text-destructive")}>{in_ ? "+" : "−"}{eur(m.amount)}</p>
                  <Accions onEdit={() => setForm({ item: m })} onDelete={() => window.confirm(`Eliminar «${m.description}»?`) && db.GuardiolaMovement.remove(m.id)} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Modal open={!!form} title={form?.item ? "Editar moviment" : "Nou moviment"} onClose={() => setForm(null)}>
        {form && <Formulari item={form.item} onSubmit={desar} onCancel={() => setForm(null)} />}
      </Modal>
    </div>
  );
}

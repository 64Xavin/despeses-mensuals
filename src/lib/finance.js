// Same rules as the original app.

/** "YYYY-MM" for the current month, in local time. */
export const mesActual = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};
export const avui = () => {
  const d = new Date();
  return `${mesActual()}-${String(d.getDate()).padStart(2, "0")}`;
};

const MESOS = ["Gen", "Feb", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Oct", "Nov", "Des"];
export const fmtMes = (m, curt) => {
  if (!m) return "";
  const [y, mo] = m.split("-");
  return `${MESOS[parseInt(mo, 10) - 1]} ${curt ? y.slice(2) : y}`;
};
export const fmtData = (d) => (d ? d.split("-").reverse().join("/") : "");
export const fmtMesAny = (d) => (d ? `${d.slice(5, 7)}/${d.slice(0, 4)}` : "");
export const eur = (n) => `${(Number(n) || 0).toLocaleString("ca-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;

/** Is a fixed / annual expense counted in month "YYYY-MM" (active flag + start/end dates)? */
export const actiuAlMes = (e, mes) => {
  if (e.active === false) return false;
  if (e.start_date && mes < e.start_date.slice(0, 7)) return false;
  if (e.end_date && mes > e.end_date.slice(0, 7)) return false;
  return true;
};

const suma = (l, f = (e) => e.amount) => l.reduce((s, e) => s + (Number(f(e)) || 0), 0);

export function despesesDelMes(fixes, variables, anuals, mes) {
  const fixesActives = fixes.filter((e) => actiuAlMes(e, mes));
  const variablesMes = variables.filter((e) => e.month === mes);
  const anualsActives = anuals.filter((e) => actiuAlMes(e, mes));
  const totalFixes = suma(fixesActives);
  const totalVariables = suma(variablesMes);
  const anualMensual = suma(anualsActives, (e) => (e.amount || 0) / 12);
  return { fixesActives, variablesMes, anualsActives, totalFixes, totalVariables, anualMensual, totalDespeses: totalFixes + totalVariables + anualMensual };
}

export { suma };

/** Month options: the given extra months plus every month that appears in the lists, newest first. */
export const mesosDisponibles = (llistes, ...extra) =>
  [...new Set([...extra, ...llistes.flat().map((e) => e.month).filter(Boolean)])].sort().reverse();

export const CATEGORIES = {
  FixedExpense: ["Agents IA", "Altres", "Assegurança", "Internet", "Software", "Streaming", "Suscripcions", "Telefonia", "Xarxes Socials"],
  VariableExpense: ["Aigua", "Alimentació", "Altres", "Autocaravana", "Connexions", "Gas", "Gasoil", "Llum", "Manteniment", "Neteja", "Restaurant", "Supermercat", "Transport", "Viatges"],
  AnnualExpense: ["Altres", "Assegurança", "Impostos", "Manteniment", "Quota entitat", "Suscripcions"],
  Income: ["Altres", "Extra", "Freelance", "Pensió", "Regal", "Rendes", "Salari"],
  Savings: ["Altres", "Estalvi general", "Fons d'emergència", "Habitatge", "Jubilació", "Vacances"],
};

// Category pill colours (light + dark)
const PALETA = [
  "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
  "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
];
export const colorCategoria = (c) => {
  if (!c || c === "Altres") return "bg-muted text-muted-foreground";
  let h = 0;
  for (const ch of c) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETA[h % PALETA.length];
};

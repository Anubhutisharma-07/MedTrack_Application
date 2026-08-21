/**
 * Shared status pill.
 *
 * Four hub pages (clinical AI, cold-chain command, pharmacy supply, telehealth)
 * previously defined the same pill markup inline. Callers pass their own
 * domain `map` (e.g. STATUS_META, CRYO_STATUS, CONSULT_STATUS_META) plus an
 * optional `fallback` entry for unknown statuses.
 */

export function StatusPill({ status, map, fallback }) {
  const meta = (map || {})[status] || fallback || { label: status, cls: "text-slate-400 bg-slate-500/10 border-slate-500/30" };
  return <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold ${meta.cls}`}>{meta.label}</span>;
}

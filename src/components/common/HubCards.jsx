/**
 * Shared card primitives for the detail-panel style hubs.
 *
 * The four "new-style" hub pages (blood bank, cardiology cath lab, pathology,
 * neonatal NICU) previously defined their own `Row`, `StatCard` and
 * `Vital`/`MiniStat` components inline, byte-identical across pages. This
 * module is the single source of truth:
 *
 *  - `DetailRow`       - bordered label/value row used in inspection panels
 *  - `AlertStatCard`   - stat card whose border/text shift when `alert` is set
 *  - `MiniStat`        - compact centered stat tile (Cardiology's `Vital` and
 *                        Neonatal's `MiniStat` are the same component; the
 *                        third line is a unit/annotation string)
 */

export function DetailRow({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2.5">
      <span className="text-xs text-slate-400">{label}</span>
      <span className="text-right text-sm font-medium text-slate-200">{value}</span>
    </div>
  );
}

export function AlertStatCard({ label, value, icon, alert }) {
  return (
    <div className={`rounded-xl border p-4 ${alert ? "border-rose-500/40 bg-rose-500/5" : "border-slate-800 bg-slate-900"}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">{label}</span>
        {icon}
      </div>
      <p className={`mt-2 text-2xl font-bold ${alert ? "text-rose-300" : "text-white"}`}>{value}</p>
    </div>
  );
}

export function MiniStat({ label, value, sub, alert }) {
  return (
    <div className={`rounded-lg border p-2 text-center ${alert ? "border-rose-500/40 bg-rose-500/10" : "border-slate-800 bg-slate-900"}`}>
      <p className={`text-[10px] uppercase tracking-wide ${alert ? "text-rose-300" : "text-slate-500"}`}>{label}</p>
      <p className={`text-base font-bold ${alert ? "text-rose-300" : "text-white"}`}>{value}</p>
      <p className="text-[10px] text-slate-500">{sub}</p>
    </div>
  );
}

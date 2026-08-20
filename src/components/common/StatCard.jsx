/**
 * Shared stat-card primitives.
 *
 * Fourteen hub pages previously defined their own stat card markup. Two
 * visual variants exist:
 *  - `StatCard`         - icon-in-a-tinted-box layout driven by a `tone` key
 *                         (clinical AI, cold-chain, emergency, ICU, pharmacy,
 *                         clinical trials, telehealth)
 *  - `CompactStatCard`  - plain accent-tinted icon layout driven by an
 *                         `accent` class (regulatory audit, lab automation,
 *                         pharmacovigilance, radiology, security, surgical)
 */

const TONE_ICON_CLS = {
  sky: "text-sky-400 bg-sky-500/10 border-sky-500/20",
  rose: "text-rose-400 bg-rose-500/10 border-rose-500/20",
  amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  violet: "text-violet-400 bg-violet-500/10 border-violet-500/20",
};

export function StatCard({ icon: Icon, label, value, sub, tone = "sky" }) {
  const iconCls = TONE_ICON_CLS[tone];
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg shadow-black/20">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
          <p className="mt-1.5 text-2xl font-black text-white tabular-nums">{value}</p>
          <p className="mt-1 text-[11px] text-slate-400">{sub}</p>
        </div>
        <div className={`rounded-xl border p-2.5 ${iconCls}`}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

export const CompactStatCard = ({ icon: Icon, label, value, sub, accent = "text-emerald-400" }) => (
  <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium text-slate-400">{label}</span>
      <Icon size={16} className={accent} />
    </div>
    <div className="mt-2 text-2xl font-bold text-slate-100">{value}</div>
    {sub && <div className="mt-1 text-[11px] text-slate-500">{sub}</div>}
  </div>
);

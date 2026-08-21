/**
 * Full-width progress bar.
 *
 * `pct` is 0–100. `tone` maps to a bg color:
 * sky (default), rose, amber, emerald, violet.
 */
export function ProgressBar({ pct, tone = "sky" }) {
  const cls =
    {
      sky: "bg-sky-500",
      rose: "bg-rose-500",
      amber: "bg-amber-500",
      emerald: "bg-emerald-500",
      violet: "bg-violet-500",
    }[tone] || "bg-sky-500";

  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
      <div
        className={`h-full rounded-full ${cls} transition-all duration-700`}
        style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
      />
    </div>
  );
}

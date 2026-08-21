/**
 * Compact inline meter bar.
 *
 * Displays a fixed-width bar whose fill represents `value` (0–100).
 * `color` accepts any Tailwind bg- utility name (default: bg-emerald-400).
 */
export function Meter({ value, color = "bg-emerald-400" }) {
  return (
    <div className="h-1.5 w-24 rounded-full bg-slate-800">
      <div
        className={`h-full rounded-full ${color}`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

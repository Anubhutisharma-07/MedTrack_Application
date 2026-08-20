/**
 * Shared severity filter chips.
 *
 * Three hub pages (Clinical AI, ICU Telemetry, Pharmacy Supply) previously
 * defined this identical component inline. It renders an "All severities"
 * pill plus one pill per severity level, colored from a `SEVERITY_META`-style
 * map passed in by the page (the map is domain-specific, so it stays local
 * to each page).
 */

export function SeverityChips({ value, onChange, meta }) {
  const opts = ["all", "critical", "high", "medium", "low"];
  return (
    <div className="flex flex-wrap items-center gap-2">
      {opts.map((o) => {
        const active = value === o;
        const m = o === "all" ? meta.medium : meta[o];
        return (
          <button
            key={o}
            onClick={() => onChange(o)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold capitalize transition ${
              active ? `${m.bg} ${m.border} ${m.text}` : "border-slate-800 bg-slate-900/50 text-slate-500 hover:border-slate-700 hover:text-slate-300"
            }`}
          >
            {o === "all" ? "All severities" : m.label}
          </button>
        );
      })}
    </div>
  );
}

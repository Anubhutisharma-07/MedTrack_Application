/**
 * Shared filter-chip cluster.
 *
 * Six hub pages (variant B) rendered their per-tab status filters inline as
 * near-identical clusters: `{options.map((f) => <button>)}` with emerald
 * active styling. This module is the single source of truth; pass the
 * option list, the current value, and the setter.
 */

export function FilterChips({ options, value, onChange }) {
  return (
    <div className="flex gap-1.5">
      {options.map((f) => (
        <button
          key={f}
          onClick={() => onChange(f)}
          className={`rounded-lg border px-3 py-1.5 text-[11px] font-medium ${
            value === f ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300" : "border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200"
          }`}
        >
          {f}
        </button>
      ))}
    </div>
  );
}

import { Search } from "lucide-react";

/**
 * Shared search input primitives.
 *
 * Seven hub pages previously defined their own `SearchBox` component inline
 * (byte-identical except the Cold Chain hub's cyan focus ring), and six
 * variant-B pages each rendered a compact inline search input with an
 * emerald focus ring. This module is the single source of truth for both:
 *
 *  - `SearchBox`      - the full-width panel search (variant A): `w-full
 *    sm:w-72`, larger padding, sky focus ring by default (`accent="cyan"`
 *    for the Cold Chain hub).
 *  - `CompactSearch`  - the toolbar search (variant B): fixed `w-64`,
 *    smaller padding, emerald focus ring.
 */

export function SearchBox({ value, onChange, placeholder, accent = "sky" }) {
  const focusCls = accent === "cyan"
    ? "focus:border-cyan-500/50 focus:ring-cyan-500/20"
    : "focus:border-sky-500/50 focus:ring-sky-500/20";
  return (
    <div className="relative w-full sm:w-72">
      <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 outline-none transition ${focusCls}`}
      />
    </div>
  );
}

export function CompactSearch({ value, onChange, placeholder }) {
  return (
    <div className="relative">
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-64 rounded-xl border border-slate-800 bg-slate-900 py-2 pl-9 pr-3 text-xs text-slate-200 placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none"
      />
    </div>
  );
}

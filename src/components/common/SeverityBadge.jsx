/**
 * Shared severity metadata + badge.
 *
 * Severity styling was previously copy-pasted into seven hub pages (clinical,
 * cold-chain, emergency triage, ICU telemetry, pharmacy supply, clinical
 * trials, telehealth) with drift between copies (e.g. ClinicalAIHub carried an
 * extra `ring` field). This module is the single source of truth; every page
 * imports `SEVERITY_META` / `SeverityBadge` instead of redefining them.
 */

export const SEVERITY_META = {
  critical: { label: "Critical", text: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/30", dot: "bg-rose-500", ring: "shadow-rose-500/20" },
  high: { label: "High", text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", dot: "bg-amber-500", ring: "shadow-amber-500/20" },
  medium: { label: "Medium", text: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/30", dot: "bg-sky-500", ring: "shadow-sky-500/20" },
  low: { label: "Low", text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", dot: "bg-emerald-500", ring: "shadow-emerald-500/20" },
};

export function SeverityBadge({ tone = "medium", children, className = "" }) {
  const meta = SEVERITY_META[tone] || SEVERITY_META.medium;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${meta.bg} ${meta.border} ${meta.text} ${className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {children}
    </span>
  );
}

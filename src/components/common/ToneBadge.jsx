/**
 * Shared tone map + badge.
 *
 * Six hub pages (regulatory audit, lab automation, pharmacovigilance,
 * radiology, security compliance, surgical robotics) previously defined the
 * same `toneClass` map and the same text-derived `Badge` component inline.
 * This module consolidates both. Each page keeps its own domain-specific
 * `toneOf` word->tone classifier (the vocabularies genuinely differ between
 * domains) and passes it through the `toneOf` prop.
 */

export const toneClass = {
  red: "bg-red-500/10 text-red-400 border-red-500/30",
  amber: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  green: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  sky: "bg-sky-500/10 text-sky-400 border-sky-500/30",
  slate: "bg-slate-500/10 text-slate-400 border-slate-500/30",
};

export const ToneBadge = ({ children, tone, toneOf = () => "slate" }) => (
  <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${toneClass[tone || toneOf(children)]}`}>
    {children}
  </span>
);

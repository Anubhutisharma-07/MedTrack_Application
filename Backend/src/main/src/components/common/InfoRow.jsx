/**
 * Shared label/value row primitives.
 *
 * Thirteen hub pages previously defined their own (near-identical) `InfoRow`
 * (inspection-panel style) or `Row` (detail-list style) inline. This module is
 * the single source of truth for both variants.
 */

export function InfoRow({ label, value, mono = false }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-800/60 py-2 last:border-0">
      <span className="text-xs text-slate-500">{label}</span>
      <span className={`text-xs font-semibold text-slate-200 ${mono ? "font-mono tabular-nums" : ""}`}>{value}</span>
    </div>
  );
}

export const Row = ({ label, value, accent }) => (
  <div className="flex items-center justify-between border-b border-slate-800/70 pb-2 last:border-0">
    <span className="text-xs text-slate-400">{label}</span>
    <span className={`text-xs font-medium ${accent || "text-slate-200"}`}>{value}</span>
  </div>
);

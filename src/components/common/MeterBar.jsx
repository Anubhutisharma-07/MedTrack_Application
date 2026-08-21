/**
 * Shared thin progress meter.
 *
 * The transfusion/oncology/renal/sterile hub pages each defined their own
 * `Meter` inline — identical except the track width (`w-24` vs `w-full`).
 * `full` selects the wide variant; the fill uses the same clamped percentage
 * as the page-local versions.
 */

export const Meter = ({ value, color = "bg-emerald-400", full = false }) => (
  <div className={`h-1.5 ${full ? "w-full" : "w-24"} rounded-full bg-slate-800`}>
    <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
  </div>
);

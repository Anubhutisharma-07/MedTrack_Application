/* ------------------------------------------------------------------ */
/*  Shared hub section header rows                                     */
/* ------------------------------------------------------------------ */

/**
 * The compact-hub table section header row: icon + title + optional
 * count badge + optional right-hand caption. `icon` is a rendered
 * element (including its own className) so each page's icon markup
 * stays byte-identical.
 */
export function SectionHeader({ icon, title, badge, right }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-sm font-semibold text-slate-100">{title}</h2>
        {badge != null && (
          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">{badge}</span>
        )}
      </div>
      {right != null && <span className="text-[11px] text-slate-500">{right}</span>}
    </div>
  );
}

/** Compact panel title row (icon + heading, optional static badge). */
export function PanelHeader({ icon, title, badge }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      {icon}
      <h2 className="text-sm font-semibold text-slate-100">{title}</h2>
      {badge != null && (
        <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">{badge}</span>
      )}
    </div>
  );
}

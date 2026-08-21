/* ------------------------------------------------------------------ */
/*  Shared hub section scaffolding                                     */
/* ------------------------------------------------------------------ */

/**
 * The compact-hub table section: bordered card with a header row
 * (icon + title + optional count badge + optional right-hand caption).
 * `icon` is a rendered element (including its own className), so each
 * page's icon markup stays byte-identical.
 */
export function SectionCard({ icon, title, badge, right, children }) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60">
      <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-sm font-semibold text-slate-100">{title}</h2>
          {badge != null && (
            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">
              {badge}
            </span>
          )}
        </div>
        {right != null && (
          <span className="text-[11px] text-slate-500">{right}</span>
        )}
      </div>
      {children}
    </section>
  );
}

/**
 * Compact panel title row (icon + heading, no badge/caption).
 *
 * NOTE: This was previously duplicated in both SectionCard.jsx and
 * SectionHeader.jsx. It now lives solely here to avoid export conflicts.
 */
export function PanelHeader({ icon, title }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      {icon}
      <h2 className="text-sm font-semibold text-slate-100">{title}</h2>
    </div>
  );
}

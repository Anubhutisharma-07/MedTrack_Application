/* ------------------------------------------------------------------ */
/*  Shared hub page header + footer                                    */
/* ------------------------------------------------------------------ */

/**
 * The compact-hub header's left cluster: accent icon tile + title +
 * subtitle. `icon` is a rendered element so per-page icons (including
 * local SVGs that ignore props) render byte-identical to before.
 */
export function PageHeader({ icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-3">
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2.5">
        {icon}
      </div>
      <div>
        <h1 className="text-xl font-bold text-slate-100">{title}</h1>
        <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>
      </div>
    </div>
  );
}

/** Slim page footer strip used at the bottom of every hub. */
export function Footer({ children }) {
  return (
    <footer className="border-t border-slate-800 px-6 py-4 text-center text-[10px] text-slate-600">
      {children}
    </footer>
  );
}

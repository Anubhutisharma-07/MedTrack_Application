/**
 * Shared tab bar primitive.
 *
 * Thirteen hub pages previously rendered their module switcher inline with
 * (near-identical) `tabs.map(...)` blocks in two flavors:
 *
 *  - emerald accent (variant B): `tab === t.id`, `setTab(t.id)`, wrapped in a
 *    single `mt-5 flex flex-wrap gap-2` container. This variant is
 *    self-contained; render it where the old block sat.
 *  - sky/cyan accent (variant A): `activeTab === t.key`, `setActiveTab(t.key)`,
 *    inside a scrollable `flex gap-2 overflow-x-auto pb-1` row. The page keeps
 *    its own outer `mt-8` wrapper (it also holds the toolbar and tab content),
 *    so this variant renders ONLY the inner row.
 *
 * Both preserve the exact button markup of the page-local versions they
 * replace. `accent` selects the active-state color scheme; tabs may carry
 * either an `id` or a `key` field.
 */

export function TabsBar({ tabs, active, onChange, accent = "emerald" }) {
  const emerald = accent === "emerald";
  const activeCls = emerald
    ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
    : accent === "cyan"
      ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-400 shadow-lg shadow-cyan-500/10"
      : "border-sky-500/50 bg-sky-500/10 text-sky-400 shadow-lg shadow-sky-500/10";
  const inactiveCls = emerald
    ? "border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200"
    : "border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700 hover:text-slate-200";
  const btnCls = emerald
    ? "flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-colors"
    : "flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition";
  const iconSize = emerald ? 15 : 16;

  const buttons = tabs.map((t) => {
    const Icon = t.icon;
    const id = t.id ?? t.key;
    const isActive = active === id;
    return (
      <button
        key={id}
        onClick={() => onChange(id)}
        className={`${btnCls} ${isActive ? activeCls : inactiveCls}`}
      >
        <Icon size={iconSize} />
        {t.label}
      </button>
    );
  });

  if (emerald) {
    return <div className="mt-5 flex flex-wrap gap-2">{buttons}</div>;
  }
  return <div className="flex gap-2 overflow-x-auto pb-1">{buttons}</div>;
}

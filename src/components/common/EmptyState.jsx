/**
 * Shared empty-state primitive.
 *
 * Six hub pages previously defined their own `EmptyState` component inline,
 * identical except for the icon. This module is the single source of truth;
 * pass the page's domain icon via `icon`.
 */

export function EmptyState({ message, icon: Icon }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 py-14 text-slate-500">
      <Icon size={28} className="mb-2 opacity-40" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

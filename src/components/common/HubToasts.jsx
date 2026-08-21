import { useCallback, useState } from "react";
import { AlertTriangle, Bell, CheckCircle2, ShieldAlert } from "lucide-react";

/**
 * Shared toast state + renderers for the new hub pages.
 *
 * Two flavors exist, matching the two toast conventions the new hub pages
 * copied from their seed data:
 *
 *  - `useKindToasts` / `KindToastTray`  - `{ id, msg, kind }` with
 *    kind = "info" | "warn" | "error", bottom-right stack (blood bank,
 *    cardiology, pathology, neonatal). Keeps the three most recent toasts.
 *  - `useSeverityToasts` / `SeverityToastTray` - `{ id, message, severity }`
 *    with severity = "Low" | "Medium" | "High", top-right stack
 *    (transfusion, oncology, renal, sterile). Keeps the four most recent.
 *
 * Both auto-dismiss after 4.2s and generate IDs from Date.now()+random, so
 * pages keep their own domain state untouched.
 */

export function useKindToasts() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((msg, kind = "info") => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((t) => [...t.slice(-3), { id, msg, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  return { toasts, addToast };
}

export function KindToastTray({ toasts }) {
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center gap-3 rounded-xl border px-4 py-3 text-sm shadow-xl backdrop-blur ${
            t.kind === "error"
              ? "border-rose-500/50 bg-rose-950/90 text-rose-200"
              : t.kind === "warn"
                ? "border-amber-500/50 bg-amber-950/90 text-amber-200"
                : "border-emerald-500/50 bg-emerald-950/90 text-emerald-200"
          }`}
        >
          {t.kind === "error" ? <AlertTriangle className="h-4 w-4 shrink-0" /> : t.kind === "warn" ? <Bell className="h-4 w-4 shrink-0" /> : <CheckCircle2 className="h-4 w-4 shrink-0" />}
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  );
}

export function useSeverityToasts() {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((message, severity = "Low") => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((current) => [...current.slice(-4), { id, message, severity }]);
    setTimeout(() => setToasts((current) => current.filter((item) => item.id !== id)), 4200);
  }, []);

  return { toasts, toast };
}

export function SeverityToastTray({ toasts }) {
  return (
    <div className="fixed right-4 top-4 z-[60] flex w-80 flex-col gap-2">
      {toasts.map((item) => (
        <div
          key={item.id}
          className="flex items-start gap-2 rounded-xl border border-slate-700 bg-slate-900/95 p-3 shadow-xl backdrop-blur"
        >
          {item.severity === "High" ? (
            <ShieldAlert size={16} className="mt-0.5 shrink-0 text-red-400" />
          ) : item.severity === "Medium" ? (
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-400" />
          ) : (
            <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-400" />
          )}
          <p className="text-xs text-slate-300">{item.message}</p>
        </div>
      ))}
    </div>
  );
}

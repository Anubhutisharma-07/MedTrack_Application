import { useCallback, useRef, useState, useEffect } from "react";
import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Compact (variant B) toast tray                                     */
/* ------------------------------------------------------------------ */

/**
 * Toast state + push helper for the compact hubs: keeps up to `max`
 * toasts and auto-dismisses each after 4.2 s.
 *
 * FIX: Cleanup all pending timeouts on unmount to prevent
 * setState-on-unmounted-component memory leaks.
 */
export function useToastTray(max = 4) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());

  // Cleanup all timers on unmount
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
  }, []);

  const toast = useCallback(
    (msg, sev = "Low") => {
      const id = Date.now() + Math.random();

      setToasts((t) => [...t.slice(-(max - 1)), { id, msg, sev }]);

      const timerId = setTimeout(() => {
        setToasts((t) => t.filter((x) => x.id !== id));
        timersRef.current.delete(id);
      }, 4200);

      timersRef.current.set(id, timerId);
    },
    [max],
  );

  return { toasts, toast };
}

/**
 * Fixed top-right toast renderer. `critical` lists which severities get
 * the red shield icon (per-page wording differs: High/Critical vs
 * Critical/Flagged).
 */
export default function ToastTray({ toasts, critical = ["High", "Critical"] }) {
  return (
    <div className="fixed right-4 top-4 z-[60] flex w-80 flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="flex items-start gap-2 rounded-xl border border-slate-700 bg-slate-900/95 p-3 shadow-xl backdrop-blur"
        >
          {critical.includes(t.sev) ? (
            <ShieldAlert
              size={16}
              className="mt-0.5 shrink-0 text-red-400"
            />
          ) : t.sev === "Medium" ? (
            <AlertTriangle
              size={16}
              className="mt-0.5 shrink-0 text-amber-400"
            />
          ) : (
            <CheckCircle2
              size={16}
              className="mt-0.5 shrink-0 text-emerald-400"
            />
          )}
          <p className="text-xs text-slate-300">{t.msg}</p>
        </div>
      ))}
    </div>
  );
}

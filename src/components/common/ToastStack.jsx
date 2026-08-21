import { useCallback, useRef, useState } from "react";
import { X } from "lucide-react";

/**
 * Toast state for the simulated hub pages: keeps the four most recent toasts,
 * auto-dismisses each after 6.5s, and returns a `dismissToast` for manual
 * dismissal. Toast IDs are generated from an internal counter, so pages keep
 * their own `seqRef` for domain sequence numbers.
 */
export function useToasts() {
  const [toasts, setToasts] = useState([]);
  const seqRef = useRef(1);

  const pushToast = useCallback((title, body, tone = "medium") => {
    const id = `T-${seqRef.current++}`;
    setToasts((prev) => [...prev.slice(-3), { id, title, body, tone }]);
    window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 6500);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  return { toasts, pushToast, dismissToast };
}

/**
 * Fixed bottom-right toast stack. `severityMeta` maps a tone to `{ border, dot }`
 * classes (pages pass their domain severity map, e.g. SEVERITY_META).
 */
export default function ToastStack({ toasts, onDismiss, severityMeta }) {
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-80 flex-col gap-2">
      {toasts.map((t) => {
        const meta = severityMeta[t.tone] || severityMeta.medium;
        return (
          <div key={t.id} className={`pointer-events-auto flex items-start gap-3 rounded-xl border bg-slate-900 p-3 shadow-2xl shadow-black/50 animate-fadeSlideIn ${meta.border}`}>
            <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${meta.dot}`} />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white">{t.title}</p>
              <p className="mt-0.5 text-[11px] leading-snug text-slate-400">{t.body}</p>
            </div>
            <button onClick={() => onDismiss(t.id)} className="text-slate-600 transition hover:text-white" aria-label="Dismiss notification">
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

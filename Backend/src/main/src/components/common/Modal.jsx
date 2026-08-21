import { useEffect, useRef, useCallback } from "react";
import { X } from "lucide-react";

/**
 * Shared modal primitives.
 *
 * Thirteen hub pages previously defined their own (near-identical) `Modal`
 * component inline. This module is the single source of truth in two flavors:
 *
 *  - `InspectionModal`  - the "inspection panel" modal: controlled via `open`,
 *    closes on Escape or backdrop click, optional `wide` layout, and an icon
 *    tile whose accent color is configurable (`text-sky-400` default; the
 *    Cold Chain hub uses `text-cyan-400`). Includes focus-trap for a11y.
 *  - `SimpleModal`      - the lightweight confirmation/detail modal: always
 *    rendered, closes on Escape or backdrop click, optional custom `closeIcon`.
 *
 * Both preserve the exact markup of the page-local versions they replace.
 */

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

/**
 * Returns a ref-callback that locks focus inside the given container
 * element. Tab and Shift+Tab cycle through the container's focusable
 * children instead of escaping to the document behind the modal.
 */
function useFocusTrap(containerRef) {
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;

    const FOCUSABLE =
      'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

    function handleKey(e) {
      if (e.key !== "Tab") return;

      const focusable = [...el.querySelectorAll(FOCUSABLE)];
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    el.addEventListener("keydown", handleKey);
    return () => el.removeEventListener("keydown", handleKey);
  }, [containerRef]);
}

/* ------------------------------------------------------------------ */
/*  InspectionModal                                                   */
/* ------------------------------------------------------------------ */

export function InspectionModal({
  open,
  onClose,
  title,
  subtitle,
  icon: Icon,
  children,
  wide = false,
  accent = "text-sky-400",
}) {
  const panelRef = useRef(null);

  // Escape key
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Focus trap
  useFocusTrap(panelRef);

  // Focus the panel on open
  useEffect(() => {
    if (open && panelRef.current) {
      panelRef.current.focus();
    }
  }, [open]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className={`relative w-full ${wide ? "max-w-3xl" : "max-w-xl"} max-h-[86vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl shadow-black/60 animate-scale-up outline-none`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-slate-800 bg-slate-900/95 px-5 py-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <div
              className={`rounded-xl border border-slate-700 bg-slate-800 p-2 ${accent}`}
            >
              <Icon size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">{title}</h3>
              {subtitle && (
                <p className="text-xs text-slate-400">{subtitle}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-700 p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
            aria-label="Close inspection panel"
          >
            <X size={16} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SimpleModal                                                       */
/* ------------------------------------------------------------------ */

export function SimpleModal({
  title,
  subtitle,
  onClose,
  children,
  closeIcon: CloseIcon = X,
}) {
  const panelRef = useRef(null);

  // Escape key
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Focus trap
  useFocusTrap(panelRef);

  // Focus the panel on mount
  useEffect(() => {
    if (panelRef.current) {
      panelRef.current.focus();
    }
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
            {subtitle && (
              <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            aria-label="Close modal"
          >
            <CloseIcon size={16} />
          </button>
        </div>
        <div className="max-h-[60vh] space-y-3 overflow-y-auto text-sm text-slate-300">
          {children}
        </div>
      </div>
    </div>
  );
}

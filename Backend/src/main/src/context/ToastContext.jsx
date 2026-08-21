/**
 * ToastContext — application-wide notification provider.
 *
 * Exposes `addToast(message, type, duration?)` and
 * `removeToast(id)` through `useToast()`.
 *
 * Types: "info" (default) | "success" | "error" | "warning"
 */

import { createContext, useCallback, useContext, useRef, useState, useEffect } from "react";

const ToastContext = createContext(null);

/* ------------------------------------------------------------------ */
/*  Provider                                                          */
/* ------------------------------------------------------------------ */

export function ToastProvider({ children }) {
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

  /**
   * Add a toast notification.
   *
   * @param {string} message  – body text.
   * @param {string} type     – "info" | "success" | "error" | "warning".
   * @param {number} duration – auto-dismiss in ms (default 4000).
   * @returns {number} unique numeric id for programmatic removal.
   */
  const addToast = useCallback((message, type = "info", duration = 4000) => {
    const id = Date.now() + Math.random();

    setToasts((prev) => [...prev, { id, message, type }]);

    const timerId = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      timersRef.current.delete(id);
    }, duration);

    timersRef.current.set(id, timerId);
    return id;
  }, []);

  /**
   * Remove a toast by its id.
   *
   * @param {number} id
   */
  const removeToast = useCallback((id) => {
    const timerId = timersRef.current.get(id);
    if (timerId) {
      clearTimeout(timerId);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
}

/* ------------------------------------------------------------------ */
/*  Hook                                                              */
/* ------------------------------------------------------------------ */

/**
 * Returns `{ toasts, addToast, removeToast }` when used inside
 * `<ToastProvider>`. Returns `null` when used outside the provider.
 */
export function useToast() {
  return useContext(ToastContext);
}

export default ToastContext;

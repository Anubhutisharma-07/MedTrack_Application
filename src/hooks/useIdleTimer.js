import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Events that count as user activity. `mousemove`/`scroll` fire continuously,
 * so they are throttled by `ACTIVITY_RESET_THROTTLE_MS` before they bump the
 * idle clock - otherwise a user simply resting the cursor would reset the
 * session every few hundred milliseconds and the timeout could never fire.
 */
const ACTIVITY_EVENTS = [
  "mousemove",
  "mousedown",
  "keydown",
  "scroll",
  "touchstart",
  "pointerdown",
  "wheel",
];

/** Minimum gap between two activity resets triggered by high-frequency events. */
const ACTIVITY_RESET_THROTTLE_MS = 250;

/** How often the countdown clock re-computes the remaining time. */
export const DEFAULT_TICK_MS = 1000;

/**
 * Tracks the time since the user's last real interaction and exposes a
 * monotonically decreasing countdown until `timeoutMs` of inactivity elapses.
 *
 * - Any registered activity event resets the clock (throttled for
 *   high-frequency events such as mousemove).
 * - The countdown keeps counting while the tab is hidden; background-tab
 *   throttling of setInterval is corrected on `visibilitychange`, so a user
 *   who leaves the tab open and walks away is still locked out.
 * - `onLock` fires exactly once when the countdown reaches zero (the internal
 *   interval stops itself), after which the parent decides what to do.
 *
 * The `enabled` flag only controls whether listeners/timers are installed, so
 * the hook can be called unconditionally in a component that sometimes has no
 * session (e.g. signed-out visitors) without violating the rules of hooks.
 *
 * @param {object} options
 * @param {number} options.timeoutMs  Inactivity duration before onLock fires.
 * @param {() => void} options.onLock Called once when the countdown hits zero.
 * @param {number} [options.tickMs]   How often the countdown re-computes.
 * @param {boolean} [options.enabled] False disables tracking entirely.
 */
export default function useIdleTimer({
  timeoutMs,
  onLock,
  tickMs = DEFAULT_TICK_MS,
  enabled = true,
}) {
  const [remainingMs, setRemainingMs] = useState(timeoutMs);
  const lastActivityRef = useRef(Date.now());
  // Held in a ref so a new onLock identity (an inline arrow in the caller)
  // does not tear down and recreate the interval on every render.
  const onLockRef = useRef(onLock);
  onLockRef.current = onLock;

  const reset = useCallback(() => {
    lastActivityRef.current = Date.now();
    setRemainingMs(timeoutMs);
  }, [timeoutMs]);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const bump = () => {
      const now = Date.now();
      if (now - lastActivityRef.current < ACTIVITY_RESET_THROTTLE_MS) {
        return;
      }
      lastActivityRef.current = now;
      setRemainingMs(timeoutMs);
    };

    const onVisibilityChange = () => {
      if (!document.hidden) {
        // Correct any drift from background-tab timer throttling: elapsed time
        // is measured from the last activity, which predates the tab hiding.
        setRemainingMs(
          Math.max(0, timeoutMs - (Date.now() - lastActivityRef.current))
        );
      }
    };

    ACTIVITY_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, bump, { passive: true });
    });
    document.addEventListener("visibilitychange", onVisibilityChange);

    const interval = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      const next = Math.max(0, timeoutMs - elapsed);
      setRemainingMs(next);
      if (next === 0) {
        clearInterval(interval);
        onLockRef.current?.();
      }
    }, tickMs);

    return () => {
      ACTIVITY_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, bump);
      });
      document.removeEventListener("visibilitychange", onVisibilityChange);
      clearInterval(interval);
    };
  }, [enabled, timeoutMs, tickMs]);

  return { remainingMs, reset };
}

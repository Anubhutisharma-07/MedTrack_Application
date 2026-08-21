import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import useIdleTimer from "../../hooks/useIdleTimer";
import SessionTimeoutModal, { formatCountdown } from "./SessionTimeoutModal";

/**
 * Medical-workstation sessions must not sit unlocked on an unattended
 * machine. These defaults follow the common HIPAA-style auto-lock guidance
 * (lock after 15 minutes of inactivity) with a 1-minute warning lead so the
 * user can stop the lock without losing their place.
 *
 * Both can be overridden at runtime for demos / kiosks via localStorage:
 *   localStorage.setItem("medtrack_idle_timeout_ms", "30000")   // 30s
 *   localStorage.setItem("medtrack_idle_warn_ms", "10000")      // warn at 10s
 */
export const DEFAULT_IDLE_TIMEOUT_MS = 15 * 60 * 1000;
export const DEFAULT_WARN_LEAD_MS = 60 * 1000;

const IDLE_TIMEOUT_KEY = "medtrack_idle_timeout_ms";
const WARN_LEAD_KEY = "medtrack_idle_warn_ms";

function readLocalPositiveMs(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw) {
      const value = Number(raw);
      if (Number.isFinite(value) && value > 0) {
        return value;
      }
    }
  } catch {
    // Storage unavailable (private mode / tests) - fall through to default.
  }
  return fallback;
}

export function getSessionConfig() {
  return {
    timeoutMs: readLocalPositiveMs(IDLE_TIMEOUT_KEY, DEFAULT_IDLE_TIMEOUT_MS),
    warnLeadMs: readLocalPositiveMs(WARN_LEAD_KEY, DEFAULT_WARN_LEAD_MS),
  };
}

/**
 * Renders children (the whole app) and, while a user is signed in, enforces
 * the session inactivity policy:
 *
 *  1. After `timeoutMs` without interaction, the session is locked - the
 *     user is signed out with an explicit reason (surfaced on the login
 *     screen) instead of being left with a silently expired JWT.
 *  2. `warnLeadMs` before the lock, a countdown dialog appears; the user can
 *     extend the session ("Stay signed in") or end it immediately.
 *  3. Any real activity (mouse, keys, touch, scroll) automatically cancels
 *     the warning and restarts the clock.
 *
 * Signed-out visitors render children untouched and no timers are installed.
 */
export default function SessionGuard({
  children,
  timeoutMs: timeoutOverride,
  warnLeadMs: warnOverride,
}) {
  const { user, logout } = useAuth();
  const { addToast } = useToast();

  const config = getSessionConfig();
  const timeoutMs = timeoutOverride ?? config.timeoutMs;
  const warnLeadMs = warnOverride ?? config.warnLeadMs;

  const handleLock = () => {
    logout(
      `Your session was locked after ${formatCountdown(timeoutMs)} of inactivity. Please sign in again.`
    );
    addToast("Session locked due to inactivity. Please sign in again.", "warning", 6000);
  };

  // Hook is called unconditionally; `enabled` gates the listeners.
  const { remainingMs, reset } = useIdleTimer({
    timeoutMs,
    onLock: handleLock,
    enabled: !!user,
  });

  if (!user) {
    return children;
  }

  const showWarning = remainingMs > 0 && remainingMs <= warnLeadMs;

  const handleStaySignedIn = () => {
    reset();
    addToast("Welcome back. Your session has been extended.", "info", 4000);
  };

  return (
    <>
      {children}
      {showWarning && (
        <SessionTimeoutModal
          remainingMs={remainingMs}
          warnLeadMs={warnLeadMs}
          onStaySignedIn={handleStaySignedIn}
          onSignOut={() => logout("You signed out from the session timeout warning.")}
        />
      )}
    </>
  );
}

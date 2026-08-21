import { Timer, LogOut, ShieldCheck } from "lucide-react";

/**
 * Formats a millisecond countdown as "Xm Ys" (or "Ys" under a minute).
 * Exported for tests and for the warning copy in SessionGuard.
 */
export function formatCountdown(ms) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) {
    return `${seconds}s`;
  }
  return `${minutes}m ${seconds}s`;
}

/**
 * Modal shown just before an idle session is locked. The countdown is the
 * live `remainingMs` from useIdleTimer; "Stay signed in" resets the idle
 * clock, "Sign out now" ends the session immediately.
 */
export default function SessionTimeoutModal({
  remainingMs,
  warnLeadMs,
  onStaySignedIn,
  onSignOut,
}) {
  // 1 when the warning first appears, 0 at lock time.
  const progress = Math.min(1, Math.max(0, remainingMs / warnLeadMs));
  const progressPercent = Math.round(progress * 100);

  return (
    <div
      className="fixed inset-0 z-[9990] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      data-testid="session-timeout-overlay"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="session-timeout-title"
        aria-describedby="session-timeout-message"
        className="w-full max-w-md rounded-2xl bg-surface text-primary border border-slate-200 dark:border-slate-700 shadow-2xl p-8 space-y-5 animate-slide-in"
      >
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400">
            <Timer size={26} />
          </span>
          <div>
            <h2
              id="session-timeout-title"
              className="text-xl font-bold text-primary"
            >
              Session timeout
            </h2>
            <p className="text-sm text-secondary">
              You&apos;ve been inactive
            </p>
          </div>
        </div>

        <p id="session-timeout-message" className="text-sm text-secondary leading-relaxed">
          For your security and to protect patient and hospital data, your
          session will be locked automatically in{" "}
          <span className="font-semibold text-primary" data-testid="session-countdown">
            {formatCountdown(remainingMs)}
          </span>{" "}
          unless you continue working.
        </p>

        <div
          role="progressbar"
          aria-label="Time until session lock"
          aria-valuemin={0}
          aria-valuemax={warnLeadMs}
          aria-valuenow={remainingMs}
          className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden"
        >
          <div
            className="h-full rounded-full bg-amber-500 transition-all duration-1000 ease-linear"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <button
            onClick={onStaySignedIn}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
          >
            <ShieldCheck size={18} />
            Stay signed in
          </button>
          <button
            onClick={onSignOut}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 text-primary font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <LogOut size={18} />
            Sign out now
          </button>
        </div>

        <p className="text-xs text-secondary/70 flex items-center gap-1.5">
          <ShieldCheck size={14} className="shrink-0" />
          Auto-lock protects unattended workstations in clinical areas.
        </p>
      </div>
    </div>
  );
}

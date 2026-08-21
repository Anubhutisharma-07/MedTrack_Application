import { ShieldAlert, Timer, LogOut, X } from "lucide-react";

/**
 * Maps the raw session-end reason string (passed to AuthContext.logout and
 * persisted by it) to a presentation category. Returns null when there is
 * no reason to show (e.g. a normal, deliberate sign-out).
 */
export function categorizeSessionReason(reason) {
  if (!reason) return null;
  const text = reason.toLowerCase();
  if (/administrator|revoked|invalidated/i.test(text)) return "revoked";
  if (/inactiv|lock/i.test(text)) return "locked";
  return "signed-out";
}

const TYPE_CONFIG = {
  revoked: {
    icon: ShieldAlert,
    title: "Session ended by an administrator",
    description:
      "Your permissions or account were changed by an administrator, so your session was invalidated for security. Please sign in again to refresh your access.",
    containerClass:
      "border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/40",
    iconClass: "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/50",
    titleClass: "text-red-800 dark:text-red-200",
  },
  locked: {
    icon: Timer,
    title: "Session locked for inactivity",
    description:
      "The session was locked automatically after a period of inactivity to protect unattended workstations. Sign back in to continue where you left off.",
    containerClass:
      "border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40",
    iconClass:
      "text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50",
    titleClass: "text-amber-800 dark:text-amber-200",
  },
  "signed-out": {
    icon: LogOut,
    title: "You were signed out",
    description:
      "Your session was ended before you finished working.",
    containerClass:
      "border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40",
    iconClass:
      "text-slate-600 dark:text-slate-300 bg-slate-200/70 dark:bg-slate-800",
    titleClass: "text-slate-800 dark:text-slate-200",
  },
};

/**
 * Dismissible banner shown on the login screen explaining why the previous
 * session ended. Renders nothing when there is no reason (or a null one),
 * so the normal sign-out flow stays untouched.
 */
export default function SessionEndNotice({ reason, onDismiss }) {
  const type = categorizeSessionReason(reason);
  if (!type) return null;

  const config = TYPE_CONFIG[type];
  const Icon = config.icon;

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`mb-6 flex items-start gap-3 rounded-xl border p-4 ${config.containerClass}`}
      data-testid="session-end-notice"
      data-reason-type={type}
    >
      <span
        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${config.iconClass}`}
      >
        <Icon size={18} />
      </span>
      <div className="flex-1 min-w-0">
        <h2 className={`text-sm font-semibold ${config.titleClass}`}>
          {config.title}
        </h2>
        <p className="mt-0.5 text-sm text-secondary leading-relaxed">
          {reason}
        </p>
        <p className="mt-1 text-xs text-secondary/80 leading-relaxed">
          {config.description}
        </p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notice"
        className="shrink-0 rounded p-1 text-secondary/70 hover:bg-black/5 hover:text-primary dark:hover:bg-white/10 transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
}

// src/components/common/RequirePermission.jsx
import usePermissions from "../../hooks/usePermissions";
import { describePermissionDenial } from "../../security/permissions";

/**
 * Presentational "locked" notice shown in place of gated UI. Also used as the
 * default fallback for RequirePermission, so every locked surface shares the
 * same visual language and wording.
 */
export function PermissionLocked({ permission, message, compact = false }) {
  const text = message || describePermissionDenial(permission);
  if (compact) {
    return (
      <span
        className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600"
        role="img"
        aria-label="Locked: missing permission"
        title={text}
      >
        🔒 {permission}
      </span>
    );
  }
  return (
    <div
      className="flex items-start gap-3 p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10"
      role="status"
      aria-label={`Missing permission: ${permission}`}
    >
      <span className="text-xl" aria-hidden="true">
        🔒
      </span>
      <div>
        <p className="text-sm font-bold text-amber-600">Permission required</p>
        <p className="text-xs text-secondary mt-1">{text}</p>
      </div>
    </div>
  );
}

/**
 * Declarative gate around UI that needs a fine-grained permission.
 *
 * The backend revokes permissions per role through the RBAC console; wrapping
 * an action in this component makes the UI react to that change immediately
 * instead of rendering a control that fails with 403 when used.
 *
 * Modes:
 *   - "render" (default): children when allowed, otherwise `fallback` (or a
 *     PermissionLocked notice, or nothing when `fallback` is null).
 *   - "disable": children always render, but with `disabled` and reduced
 *     opacity when denied — right for toolbars where a greyed-out button is
 *     clearer than a disappearing one.
 *
 * @param {string} permission single permission code required for access
 * @param {string[]} [anyOf] alternative to `permission`: grant when the session
 *   holds any of these codes
 * @param {"render"|"disable"} [mode] how a denial is presented
 * @param {React.ReactNode|Function} [fallback] rendered when denied in "render"
 *   mode. A function receives { permission } and may return null to render nothing.
 * @param {string} [message] overrides the default locked notice text
 */
export default function RequirePermission({
  permission,
  anyOf,
  mode = "render",
  fallback,
  message,
  children,
  className = "",
  ...rest
}) {
  const { hasPermission, hasAnyPermission } = usePermissions();

  const allowed = anyOf
    ? hasAnyPermission(anyOf)
    : hasPermission(permission);

  if (allowed) {
    return children;
  }

  if (mode === "disable") {
    return (
      <span
        className={`inline-block opacity-40 pointer-events-none select-none ${className}`}
        title={message || describePermissionDenial(permission || anyOf?.[0])}
        {...rest}
      >
        {children}
      </span>
    );
  }

  if (fallback) {
    if (typeof fallback === "function") {
      return fallback({ permission, anyOf });
    }
    return fallback;
  }

  if (fallback === null) {
    return null;
  }

  return <PermissionLocked permission={permission} message={message} />;
}

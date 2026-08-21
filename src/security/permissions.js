// src/security/permissions.js
//
// Frontend counterpart of the backend authority/permission model.
//
// The backend issues every authenticated user a fine-grained permission set
// (AuthorityService.ROLE_PERMISSIONS), returned by GET /api/auth/authority/version/:id
// and surfaced to the session as `authorityState.permissions`. A hospital
// administrator can revoke or grant those permissions per role through the RBAC
// console, and the next authority poll (or the next sign-in) delivers the change.
//
// This module is the single place the frontend reasons about that model:
//
//   - PERMISSIONS / ROLE_DEFAULT_PERMISSIONS mirror the backend matrix so the UI
//     can fall back to a correct baseline when the authority endpoint has not
//     answered yet (and for demo accounts, which never call it);
//   - mergePermissions() decides which set is authoritative — the server's list
//     when one is available, otherwise the role matrix — so a revoked permission
//     stays revoked and a not-yet-loaded permission set never blanks the UI;
//   - filterNavLinks() lets the navbar hide links the session can no longer use
//     instead of letting them 403 at the API boundary.

/** Every permission code the backend can issue, mirrored from AuthorityService. */
export const PERMISSIONS = Object.freeze({
  READ_BASIC: "READ_BASIC",
  READ_EQUIPMENT: "READ_EQUIPMENT",
  WRITE_EQUIPMENT: "WRITE_EQUIPMENT",
  READ_ORDERS: "READ_ORDERS",
  CREATE_ORDERS: "CREATE_ORDERS",
  READ_MAINTENANCE: "READ_MAINTENANCE",
  UPDATE_MAINTENANCE: "UPDATE_MAINTENANCE",
  MANAGE_USERS: "MANAGE_USERS",
  SUBMIT_DIAGNOSTICS: "SUBMIT_DIAGNOSTICS",
  UPDATE_ORDER_STATUS: "UPDATE_ORDER_STATUS",
  READ_SHIPMENTS: "READ_SHIPMENTS",
  WRITE_SHIPMENTS: "WRITE_SHIPMENTS",
  SEND_INVOICE: "SEND_INVOICE",
});

/** All permission codes as a flat list, for validation and "any of" checks. */
export const ALL_PERMISSIONS = Object.freeze(Object.values(PERMISSIONS));

/**
 * Human-readable metadata per permission, used by gated UI and the Access Denied
 * messaging so a user learns *what* they lost, not just a raw code.
 */
export const PERMISSION_META = Object.freeze({
  [PERMISSIONS.READ_BASIC]: {
    label: "Basic access",
    description: "Sign in and browse public content.",
  },
  [PERMISSIONS.READ_EQUIPMENT]: {
    label: "View equipment",
    description: "View hospital asset records.",
  },
  [PERMISSIONS.WRITE_EQUIPMENT]: {
    label: "Manage equipment",
    description: "Create, edit, or retire equipment assets.",
  },
  [PERMISSIONS.READ_ORDERS]: {
    label: "View orders",
    description: "View procurement orders and their status.",
  },
  [PERMISSIONS.CREATE_ORDERS]: {
    label: "Create orders",
    description: "Raise new procurement requests.",
  },
  [PERMISSIONS.READ_MAINTENANCE]: {
    label: "View maintenance",
    description: "View the maintenance schedule and task lists.",
  },
  [PERMISSIONS.UPDATE_MAINTENANCE]: {
    label: "Update maintenance",
    description: "Record work done, status, and diagnostics on tasks.",
  },
  [PERMISSIONS.MANAGE_USERS]: {
    label: "Manage users",
    description: "Administer accounts and security settings.",
  },
  [PERMISSIONS.SUBMIT_DIAGNOSTICS]: {
    label: "Submit diagnostics",
    description: "Submit equipment diagnostic reports.",
  },
  [PERMISSIONS.UPDATE_ORDER_STATUS]: {
    label: "Update order status",
    description: "Advance the shipping status of an order.",
  },
  [PERMISSIONS.READ_SHIPMENTS]: {
    label: "View shipments",
    description: "View shipment and delivery records.",
  },
  [PERMISSIONS.WRITE_SHIPMENTS]: {
    label: "Manage shipments",
    description: "Create and update shipment records.",
  },
  [PERMISSIONS.SEND_INVOICE]: {
    label: "Send invoices",
    description: "Issue invoices for delivered orders.",
  },
});

/**
 * Default permission set per role, mirrored from
 * Backend AuthorityService.ROLE_PERMISSIONS. Keys are lower-cased role names,
 * matching the values the backend serialises in `user.role`.
 *
 * This is a *fallback baseline only*: the server's authority response is the
 * authority when it exists, because an administrator can revoke individual
 * permissions per role through the RBAC console.
 */
export const ROLE_DEFAULT_PERMISSIONS = Object.freeze({
  hospital: Object.freeze([
    PERMISSIONS.READ_EQUIPMENT,
    PERMISSIONS.WRITE_EQUIPMENT,
    PERMISSIONS.READ_ORDERS,
    PERMISSIONS.CREATE_ORDERS,
    PERMISSIONS.READ_MAINTENANCE,
    PERMISSIONS.MANAGE_USERS,
  ]),
  technician: Object.freeze([
    PERMISSIONS.READ_EQUIPMENT,
    PERMISSIONS.READ_MAINTENANCE,
    PERMISSIONS.UPDATE_MAINTENANCE,
    PERMISSIONS.SUBMIT_DIAGNOSTICS,
  ]),
  supplier: Object.freeze([
    PERMISSIONS.READ_ORDERS,
    PERMISSIONS.UPDATE_ORDER_STATUS,
    PERMISSIONS.READ_SHIPMENTS,
    PERMISSIONS.WRITE_SHIPMENTS,
    PERMISSIONS.SEND_INVOICE,
  ]),
});

/**
 * The default baseline for any role not in the matrix (matches the backend's
 * `getOrDefault(role, Set.of("READ_BASIC"))`).
 */
export const UNKNOWN_ROLE_PERMISSIONS = Object.freeze([PERMISSIONS.READ_BASIC]);

/**
 * The permission set a role would receive from the backend today, without any
 * administrator overrides.
 *
 * @param {string|undefined} role role name; matched case-insensitively
 * @returns {string[]} permission codes for the role
 */
export function permissionsForRole(role) {
  if (!role) {
    return UNKNOWN_ROLE_PERMISSIONS;
  }
  return ROLE_DEFAULT_PERMISSIONS[String(role).toLowerCase()] || UNKNOWN_ROLE_PERMISSIONS;
}

/**
 * Resolves the effective permission set for a session.
 *
 * The server's authority list wins whenever it is a non-empty array — an empty
 * list means "not loaded yet" (the authority fetch is async, after sign-in) or
 * "no backend" (demo accounts), never "granted nothing", because the backend
 * always issues at least READ_BASIC. In that window the role matrix provides the
 * correct baseline so gated UI never flickers to locked for the few hundred
 * milliseconds before the authority response lands.
 *
 * @param {string[]|undefined} serverPermissions permissions from the authority endpoint
 * @param {string|undefined} role user's role, for the fallback baseline
 * @returns {string[]} the effective, de-duplicated permission codes
 */
export function mergePermissions(serverPermissions, role) {
  const serverList = Array.isArray(serverPermissions) ? serverPermissions : [];
  const base = serverList.length > 0 ? serverList : permissionsForRole(role);
  return [...new Set(base)];
}

/**
 * Whether a permission set grants a specific code.
 *
 * @param {string[]} permissionSet effective permission codes
 * @param {string} permission a single permission code to check
 * @returns {boolean}
 */
export function hasPermissionIn(permissionSet, permission) {
  return permissionSet.includes(permission);
}

/**
 * Whether a permission set grants any of the requested codes.
 *
 * @param {string[]} permissionSet effective permission codes
 * @param {string[]} requested one or more permission codes; empty means "yes"
 * @returns {boolean}
 */
export function hasAnyPermissionIn(permissionSet, requested) {
  if (!requested || requested.length === 0) {
    return true;
  }
  return requested.some((permission) => permissionSet.includes(permission));
}

/**
 * Filters a navbar link list down to the links the session may use.
 *
 * Links without a `permission` field are always kept. Links with one are kept
 * only when the session holds that permission, so a permission revoked by an
 * administrator disappears from the menu on the next authority poll instead of
 * navigating to a page that 403s.
 *
 * @param {Array<{label: string, page: string, permission?: string}>} links
 * @param {Function} hasPermission predicate accepting a permission code
 * @returns {Array} the links the session may use, in original order
 */
export function filterNavLinks(links, hasPermission) {
  if (!Array.isArray(links)) {
    return [];
  }
  return links.filter(
    (link) => !link.permission || hasPermission(link.permission)
  );
}

/**
 * A user-facing sentence explaining a permission denial, reusing the metadata
 * above so messages read well and stay consistent.
 *
 * @param {string} permission the permission code the session lacks
 * @returns {string}
 */
export function describePermissionDenial(permission) {
  const meta = PERMISSION_META[permission];
  const label = meta ? meta.label : permission;
  return (
    `This action requires the ${label} permission (${permission}), ` +
    "which your account no longer has. Contact your hospital administrator."
  );
}

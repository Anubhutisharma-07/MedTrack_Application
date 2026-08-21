// src/hooks/usePermissions.js
import { useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import {
  mergePermissions,
  hasPermissionIn,
  hasAnyPermissionIn,
} from "../security/permissions";

/**
 * Access to the session's effective permission set.
 *
 * The raw permission list from AuthContext is empty until the authority fetch
 * answers after sign-in, and stays empty for demo accounts. mergePermissions()
 * fills that window with the role's baseline matrix, so the values here are
 * correct the moment the user object exists — no loading flashes, no demo
 * accounts locked out of everything.
 *
 * The server's list remains authoritative whenever it is present: a permission
 * revoked through the RBAC console disappears here on the next authority poll.
 */
export default function usePermissions() {
  const { user, permissions } = useAuth();

  const effectivePermissions = useMemo(
    () => mergePermissions(permissions, user && user.role),
    [permissions, user]
  );

  const hasPermission = useMemo(
    () => (permission) => hasPermissionIn(effectivePermissions, permission),
    [effectivePermissions]
  );

  const hasAnyPermission = useMemo(
    () => (requested) => hasAnyPermissionIn(effectivePermissions, requested),
    [effectivePermissions]
  );

  return {
    /** The raw list from the authority endpoint (may be empty pre-fetch). */
    permissions,
    /** The effective list: server list when present, else the role matrix. */
    effectivePermissions,
    /** Whether the session holds a single permission code. */
    hasPermission,
    /** Whether the session holds any of the given codes. */
    hasAnyPermission,
  };
}

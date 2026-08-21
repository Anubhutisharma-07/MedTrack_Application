import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { getAuthorityVersion } from "../services/AuthService";
import { readJson, writeJson, remove } from "../utils/safeSessionStorage";

const USER_KEY = "medtrack_user";
const AUTHORITY_KEY = "medtrack_authority";
const SESSION_END_REASON_KEY = "medtrack_session_end_reason";
const DEFAULT_AUTHORITY = { authorityVersion: 1, permissions: [] };

/** How often the client re-checks its authority version against the server. */
const AUTHORITY_POLL_INTERVAL_MS = 60000;

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Read through safeSessionStorage. A bare JSON.parse here threw out of the provider's render on
  // any malformed value, and because ErrorBoundary is nested inside this provider it never mounted
  // and could not catch it - the whole tree unmounted to a permanently blank page with no route left
  // that could offer a way to sign out.
  const [user, setUser] = useState(() => readJson(USER_KEY, null));

  const [authorityState, setAuthorityState] = useState(
    () => readJson(AUTHORITY_KEY, DEFAULT_AUTHORITY)
  );

  const [authorityLoading, setAuthorityLoading] = useState(false);

  /**
   * Set when the session ended for a reason the user should see again: ended
   * by an administrator (authority revocation) or auto-locked for inactivity.
   * Persisted so the reason survives a page refresh on the login screen.
   */
  const [revokedReason, setRevokedReason] = useState(() =>
    readJson(SESSION_END_REASON_KEY, null)
  );

  const login = (userData) => {
    setRevokedReason(null);
    remove(SESSION_END_REASON_KEY);
    setUser(userData);
    writeJson(USER_KEY, userData);
    if (userData && userData.id) {
      fetchUserAuthority(userData.id);
    }
  };

  const logout = useCallback((reason = null) => {
    setUser(null);
    setAuthorityState(DEFAULT_AUTHORITY);
    setRevokedReason(reason);
    remove(USER_KEY);
    remove(AUTHORITY_KEY);
    if (reason) {
      writeJson(SESSION_END_REASON_KEY, reason);
    } else {
      remove(SESSION_END_REASON_KEY);
    }
  }, []);

  /** Dismisses the session-end notice once the user has read it. */
  const clearRevokedReason = useCallback(() => {
    setRevokedReason(null);
    remove(SESSION_END_REASON_KEY);
  }, []);

  // Held in a ref so fetchUserAuthority can call logout without taking it as a dependency, which
  // would put the callback's identity back on a state value and restart the poll interval.
  const logoutRef = useRef(logout);
  logoutRef.current = logout;

  // Latest committed authority state, also held in a ref. fetchUserAuthority is a stable callback
  // (empty deps), so it cannot read authorityState directly without going stale between renders -
  // but the revocation comparison needs the current version at fetch time.
  const authorityStateRef = useRef(authorityState);
  authorityStateRef.current = authorityState;

  // No dependency on authorityState. It previously depended on authorityState.authorityVersion while
  // also *setting* authorityState, so the callback identity changed on every poll, the effect below
  // tore down and recreated its interval each time, and an extra immediate fetch fired outside the
  // 60-second cadence. The version comparison also read a value captured when the callback was
  // created, so it could compare against a stale number.
  const fetchUserAuthority = useCallback(async (userId) => {
    if (!userId || userId === "demo-user") return;
    setAuthorityLoading(true);
    try {
      const data = await getAuthorityVersion(userId);
      if (data) {
        const newAuth = {
          authorityVersion: data.authorityVersion || 1,
          permissions: data.permissions || [],
          role: data.role || "",
          active: data.active
        };

        // Authority version exists so an administrator can revoke live sessions - that is what
        // POST /api/auth/authority/version/increment and /bump-global are for, and what the
        // Enterprise Security Center presents as "Active tokens invalidated!". Compare against the
        // committed value read at fetch time. The previous version must NOT be compared inside a
        // setState updater: React defers updater functions to the render phase, so a flag written
        // there is still false when checked synchronously and the logout below never runs.
        const previousAuth = authorityStateRef.current;
        if (
          previousAuth.authorityVersion &&
          newAuth.authorityVersion > previousAuth.authorityVersion
        ) {
          logoutRef.current(
            "Your session was ended by an administrator. Please sign in again."
          );
          return;
        }

        setAuthorityState(newAuth);
        writeJson(AUTHORITY_KEY, newAuth);
      }
    } catch (err) {
      console.error("Failed to fetch user authority state:", err);
    } finally {
      setAuthorityLoading(false);
    }
  }, []);

  // Periodic verification of the authority version. Depends only on the user id, so the interval is
  // created once per session rather than being recreated on every authority change.
  useEffect(() => {
    if (!user || !user.id) {
      return undefined;
    }
    fetchUserAuthority(user.id);
    const interval = setInterval(() => {
      fetchUserAuthority(user.id);
    }, AUTHORITY_POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [user?.id, fetchUserAuthority]);

  const hasPermission = (permissionName) => {
    if (!permissionName) return true;
    return authorityState.permissions.includes(permissionName);
  };

  const refreshAuthority = () => {
    if (user && user.id) {
      return fetchUserAuthority(user.id);
    }
    return Promise.resolve();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        authorityState,
        authorityVersion: authorityState.authorityVersion,
        permissions: authorityState.permissions,
        authorityLoading,
        revokedReason,
        clearRevokedReason,
        login,
        logout,
        hasPermission,
        refreshAuthority
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

// Exported for testing — allows MockAuthProvider to wrap components with a known context value
export { AuthContext };

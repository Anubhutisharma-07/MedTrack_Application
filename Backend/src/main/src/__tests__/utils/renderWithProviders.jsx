/**
 * renderWithProviders — test helper that wraps a component tree with
 * the providers every MedTrack page needs: ToastProvider and
 * AuthContextProvider.
 *
 * Usage in tests:
 *
 *   import { renderWithProviders } from "../../utils/renderWithProviders";
 *
 *   renderWithProviders(<Dashboard onNavigate={() => {}} />, {
 *     authValue: { user: { id: "demo-hosp-1", role: "hospital", name: "Admin" } },
 *   });
 */

import { render } from "@testing-library/react";
import { ToastProvider } from "../../context/ToastContext";

/* ------------------------------------------------------------------ */
/*  Minimal AuthContext stub                                          */
/* ------------------------------------------------------------------ */

import { createContext, useContext } from "react";

const AuthContext = createContext(null);

/**
 * Minimal AuthProvider that passes through the value given to
 * renderWithProviders. For unit tests we don't need the full
 * login/logout flow — just the context value.
 */
function AuthProvider({ value, children }) {
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

/* ------------------------------------------------------------------ */
/*  Combined render helper                                            */
/* ------------------------------------------------------------------ */

/**
 * Render `ui` inside <ToastProvider> + <AuthProvider>.
 *
 * @param {ReactNode} ui          – component tree to render.
 * @param {object}    options
 * @param {object}    options.authValue – value for useAuth(). Defaults
 *                      to `{ user: null }`.
 */
export function renderWithProviders(
  ui,
  { authValue = { user: null }, ...renderOptions } = {},
) {
  function Wrapper({ children }) {
    return (
      <AuthProvider value={authValue}>
        <ToastProvider>{children}</ToastProvider>
      </AuthProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

export default renderWithProviders;

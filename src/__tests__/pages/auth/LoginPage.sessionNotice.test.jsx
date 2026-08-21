import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "../../utils/renderWithProviders";
import LoginPage from "../../../pages/auth/LoginPage";

const renderLogin = (authValue = {}) =>
  renderWithProviders(<LoginPage onNavigate={vi.fn()} />, { authValue });

describe("LoginPage session-end notice", () => {
  it("shows the notice when the previous session was ended for a reason", () => {
    renderLogin({
      user: null,
      revokedReason:
        "Your session was locked after 15m 0s of inactivity. Please sign in again.",
    });
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(
      screen.getByText("Session locked for inactivity")
    ).toBeInTheDocument();
  });

  it("dismisses the notice via the close button", () => {
    const clearRevokedReason = vi.fn();
    renderLogin({
      user: null,
      revokedReason: "Your session was ended by an administrator. Please sign in again.",
      clearRevokedReason,
    });
    fireEvent.click(screen.getByRole("button", { name: "Dismiss notice" }));
    expect(clearRevokedReason).toHaveBeenCalledTimes(1);
  });

  it("renders no notice for a normal sign-out", () => {
    renderLogin({ user: null, revokedReason: null });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

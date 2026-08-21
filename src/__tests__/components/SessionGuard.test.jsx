import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { act } from "react";
import { ToastProvider } from "../../context/ToastContext";
import { renderWithProviders } from "../utils/renderWithProviders";
import SessionGuard from "../../components/common/SessionGuard";

const TIMEOUT_MS = 60_000;
const WARN_LEAD_MS = 30_000;

function advance(ms) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

function renderGuard({ user = { id: "u1", role: "hospital" }, logout } = {}) {
  const authValue = {
    user,
    logout: logout || vi.fn(),
    hasPermission: () => true,
  };
  return renderWithProviders(
    <ToastProvider>
      <SessionGuard timeoutMs={TIMEOUT_MS} warnLeadMs={WARN_LEAD_MS}>
        <div>Protected content</div>
      </SessionGuard>
    </ToastProvider>,
    { authValue }
  );
}

describe("SessionGuard", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("is a no-op for signed-out visitors - no warning, no lock", () => {
    const logout = vi.fn();
    renderGuard({ user: null, logout });
    expect(screen.getByText("Protected content")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    advance(5 * 60_000);
    expect(logout).not.toHaveBeenCalled();
  });

  it("renders children normally while the user is active", () => {
    renderGuard();
    expect(screen.getByText("Protected content")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows the countdown dialog once the warning lead is reached", () => {
    renderGuard();
    advance(35_000); // remaining 25s <= 30s warning lead
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Session timeout" })).toBeInTheDocument();
    expect(screen.getByTestId("session-countdown")).toHaveTextContent("25s");
    // The app stays usable underneath the warning.
    expect(screen.getByText("Protected content")).toBeInTheDocument();
  });

  it("ticks the countdown down as time passes", () => {
    renderGuard();
    advance(35_000);
    expect(screen.getByTestId("session-countdown")).toHaveTextContent("25s");
    advance(5_000);
    expect(screen.getByTestId("session-countdown")).toHaveTextContent("20s");
  });

  it("keeps the session alive when the user chooses to stay signed in", () => {
    const logout = vi.fn();
    renderGuard({ logout });
    advance(35_000);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Stay signed in" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(logout).not.toHaveBeenCalled();

    // The clock restarted from the reset point.
    advance(20_000);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("cancels the warning automatically when the user resumes activity", () => {
    renderGuard();
    advance(35_000);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.mouseMove(window);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("signs the user out with a reason when the timeout elapses", () => {
    const logout = vi.fn();
    renderGuard({ logout });
    advance(TIMEOUT_MS);
    expect(logout).toHaveBeenCalledTimes(1);
    expect(logout.mock.calls[0][0]).toMatch(/inactivity/i);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("signs out immediately from the warning dialog", () => {
    const logout = vi.fn();
    renderGuard({ logout });
    advance(35_000);
    fireEvent.click(screen.getByRole("button", { name: "Sign out now" }));
    expect(logout).toHaveBeenCalledTimes(1);
  });
});

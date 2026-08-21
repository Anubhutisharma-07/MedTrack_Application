import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SessionTimeoutModal, {
  formatCountdown,
} from "../../components/common/SessionTimeoutModal";

const WARN_LEAD_MS = 60_000;

describe("formatCountdown", () => {
  it("renders zero and negatives as 0s", () => {
    expect(formatCountdown(0)).toBe("0s");
    expect(formatCountdown(-500)).toBe("0s");
  });

  it("renders sub-minute values as plain seconds (rounded up)", () => {
    expect(formatCountdown(59_000)).toBe("59s");
    // 59.1s rounds up to a full minute boundary.
    expect(formatCountdown(59_100)).toBe("1m 0s");
  });

  it("renders minute values as Xm Ys", () => {
    expect(formatCountdown(60_000)).toBe("1m 0s");
    expect(formatCountdown(61_000)).toBe("1m 1s");
    expect(formatCountdown(90_000)).toBe("1m 30s");
    expect(formatCountdown(14 * 60_000 + 5_000)).toBe("14m 5s");
  });
});

describe("SessionTimeoutModal", () => {
  const renderModal = (props = {}) =>
    render(
      <SessionTimeoutModal
        remainingMs={45_000}
        warnLeadMs={WARN_LEAD_MS}
        onStaySignedIn={vi.fn()}
        onSignOut={vi.fn()}
        {...props}
      />
    );

  it("renders the dialog with the live countdown", () => {
    renderModal({ remainingMs: 75_000 });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Session timeout" })).toBeInTheDocument();
    expect(screen.getByTestId("session-countdown")).toHaveTextContent("1m 15s");
  });

  it("exposes the countdown as an accessible progressbar", () => {
    renderModal({ remainingMs: 30_000 });
    const bar = screen.getByRole("progressbar", { name: "Time until session lock" });
    expect(bar).toHaveAttribute("aria-valuenow", "30000");
    expect(bar).toHaveAttribute("aria-valuemax", String(WARN_LEAD_MS));
  });

  it("calls onStaySignedIn when the user chooses to stay", () => {
    const onStaySignedIn = vi.fn();
    renderModal({ onStaySignedIn });
    fireEvent.click(screen.getByRole("button", { name: "Stay signed in" }));
    expect(onStaySignedIn).toHaveBeenCalledTimes(1);
  });

  it("calls onSignOut when the user signs out immediately", () => {
    const onSignOut = vi.fn();
    renderModal({ onSignOut });
    fireEvent.click(screen.getByRole("button", { name: "Sign out now" }));
    expect(onSignOut).toHaveBeenCalledTimes(1);
  });
});

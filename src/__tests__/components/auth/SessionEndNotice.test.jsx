import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SessionEndNotice, {
  categorizeSessionReason,
} from "../../../components/auth/SessionEndNotice";

describe("categorizeSessionReason", () => {
  it("returns null for no reason (normal sign-out)", () => {
    expect(categorizeSessionReason(null)).toBeNull();
    expect(categorizeSessionReason("")).toBeNull();
    expect(categorizeSessionReason(undefined)).toBeNull();
  });

  it("detects an administrator-ended session", () => {
    expect(
      categorizeSessionReason("Your session was ended by an administrator. Please sign in again.")
    ).toBe("revoked");
    expect(
      categorizeSessionReason("Your permissions were revoked. Please sign in again.")
    ).toBe("revoked");
  });

  it("detects an inactivity lock", () => {
    expect(
      categorizeSessionReason("Your session was locked after 15m 0s of inactivity. Please sign in again.")
    ).toBe("locked");
  });

  it("falls back to signed-out for anything else", () => {
    expect(
      categorizeSessionReason("You signed out from the session timeout warning.")
    ).toBe("signed-out");
    expect(categorizeSessionReason("Some other reason")).toBe("signed-out");
  });
});

describe("SessionEndNotice", () => {
  it("renders nothing without a reason", () => {
    const { container } = render(
      <SessionEndNotice reason={null} onDismiss={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the revoked variant with the raw reason", () => {
    const reason = "Your session was ended by an administrator. Please sign in again.";
    render(<SessionEndNotice reason={reason} onDismiss={vi.fn()} />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByTestId("session-end-notice")).toHaveAttribute(
      "data-reason-type",
      "revoked"
    );
    expect(screen.getByText("Session ended by an administrator")).toBeInTheDocument();
    expect(screen.getByText(reason)).toBeInTheDocument();
  });

  it("renders the locked variant", () => {
    render(
      <SessionEndNotice
        reason="Your session was locked after 15m 0s of inactivity. Please sign in again."
        onDismiss={vi.fn()}
      />
    );
    expect(screen.getByTestId("session-end-notice")).toHaveAttribute(
      "data-reason-type",
      "locked"
    );
    expect(screen.getByText("Session locked for inactivity")).toBeInTheDocument();
  });

  it("dismisses via the close button", () => {
    const onDismiss = vi.fn();
    render(
      <SessionEndNotice
        reason="Your session was locked after 15m 0s of inactivity."
        onDismiss={onDismiss}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Dismiss notice" }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});

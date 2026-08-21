import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import ErrorBoundary from "../../../components/common/ErrorBoundary";

function ThrowingComponent({ shouldThrow = true }) {
  if (shouldThrow) throw new Error("Test error");
  return <div>Child content</div>;
}

describe("ErrorBoundary", () => {
  const originalError = console.error;
  beforeEach(() => { console.error = vi.fn(); });
  afterEach(() => { console.error = originalError; });

  it("renders children when no error occurs", () => {
    render(<ErrorBoundary><ThrowingComponent shouldThrow={false} /></ErrorBoundary>);
    expect(screen.getByText("Child content")).toBeInTheDocument();
  });

  it("renders error UI when a child throws", () => {
    render(<ErrorBoundary><ThrowingComponent /></ErrorBoundary>);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText(/An unexpected error occurred/)).toBeInTheDocument();
  });

  it("renders the error emoji", () => {
    render(<ErrorBoundary><ThrowingComponent /></ErrorBoundary>);
    expect(screen.getByText("⚠️")).toBeInTheDocument();
  });

  it("renders a Go Home button", () => {
    render(<ErrorBoundary><ThrowingComponent /></ErrorBoundary>);
    expect(screen.getByRole("button", { name: /go home/i })).toBeInTheDocument();
  });

  it("does not render children when error occurs", () => {
    render(<ErrorBoundary><ThrowingComponent /></ErrorBoundary>);
    expect(screen.queryByText("Child content")).not.toBeInTheDocument();
  });

  it("logs the error to console.error", () => {
    render(<ErrorBoundary><ThrowingComponent /></ErrorBoundary>);
    expect(console.error).toHaveBeenCalledWith(
      "ErrorBoundary caught an error:",
      expect.any(Error),
      expect.any(Object),
    );
  });

  it("Go Home button has proper styling", () => {
    render(<ErrorBoundary><ThrowingComponent /></ErrorBoundary>);
    const btn = screen.getByRole("button", { name: /go home/i });
    expect(btn.className).toContain("bg-blue-600");
  });

  it("renders without crashing when children is null", () => {
    render(<ErrorBoundary>{null}</ErrorBoundary>);
    expect(document.body).toBeInTheDocument();
  });
});

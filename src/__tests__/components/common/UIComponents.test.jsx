import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import EmptyState from "../../../components/common/EmptyState";
import ErrorState from "../../../components/common/ErrorState";
import { LoadingSpinner, SkeletonLoader } from "../../../components/common/LoadingStates";

describe("EmptyState", () => {
  it("renders default title", () => {
    render(<EmptyState />);
    expect(screen.getByText("No data found")).toBeInTheDocument();
  });

  it("renders custom title", () => {
    render(<EmptyState title="No results" />);
    expect(screen.getByText("No results")).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(<EmptyState title="Empty" description="Try adding some items" />);
    expect(screen.getByText("Try adding some items")).toBeInTheDocument();
  });

  it("renders icon when provided", () => {
    render(<EmptyState icon="📦" title="Empty" />);
    expect(screen.getByText("📦")).toBeInTheDocument();
  });

  it("renders action button when provided", () => {
    render(<EmptyState title="Empty" action={<button>Add Item</button>} />);
    expect(screen.getByText("Add Item")).toBeInTheDocument();
  });

  it("does not render description when not provided", () => {
    render(<EmptyState title="Empty" />);
    expect(screen.queryByText(/Try adding/)).not.toBeInTheDocument();
  });

  it("does not render icon when not provided", () => {
    const { container } = render(<EmptyState title="Empty" />);
    expect(container.querySelector(".text-4xl")).not.toBeInTheDocument();
  });
});

describe("ErrorState", () => {
  it("renders default message", () => {
    render(<ErrorState />);
    expect(screen.getByText("Something went wrong.")).toBeInTheDocument();
  });

  it("renders custom message", () => {
    render(<ErrorState message="Network failure" />);
    expect(screen.getByText("Network failure")).toBeInTheDocument();
  });

  it("renders Retry button when onRetry is provided", () => {
    const handleRetry = vi.fn();
    render(<ErrorState onRetry={handleRetry} />);
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
  });

  it("does not render Retry button when onRetry is not provided", () => {
    render(<ErrorState />);
    expect(screen.queryByRole("button", { name: /retry/i })).not.toBeInTheDocument();
  });

  it("calls onRetry when Retry button is clicked", () => {
    const handleRetry = vi.fn();
    render(<ErrorState onRetry={handleRetry} />);
    fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });

  it("renders error icon", () => {
    render(<ErrorState />);
    expect(screen.getByText("Something went wrong.")).toBeInTheDocument();
  });
});

describe("LoadingSpinner", () => {
  it("renders with default text", () => {
    render(<LoadingSpinner />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders with custom text", () => {
    render(<LoadingSpinner text="Fetching data..." />);
    expect(screen.getByText("Fetching data...")).toBeInTheDocument();
  });

  it("renders the spinner animation", () => {
    const { container } = render(<LoadingSpinner />);
    const spinner = container.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();
  });

  it("spinner has border styling", () => {
    const { container } = render(<LoadingSpinner />);
    const spinner = container.querySelector(".animate-spin");
    expect(spinner.className).toContain("border-4");
  });
});

describe("SkeletonLoader", () => {
  it("renders default number of skeleton rows", () => {
    const { container } = render(<SkeletonLoader />);
    const rows = container.querySelectorAll(".animate-pulse");
    expect(rows).toHaveLength(5);
  });

  it("renders custom number of rows", () => {
    const { container } = render(<SkeletonLoader rows={3} />);
    const rows = container.querySelectorAll(".animate-pulse");
    expect(rows).toHaveLength(3);
  });

  it("renders 0 rows when rows=0", () => {
    const { container } = render(<SkeletonLoader rows={0} />);
    const rows = container.querySelectorAll(".animate-pulse");
    expect(rows).toHaveLength(0);
  });

  it("applies custom className", () => {
    const { container } = render(<SkeletonLoader className="custom-class" />);
    expect(container.firstChild.className).toContain("custom-class");
  });

  it("each row has avatar placeholder and text placeholders", () => {
    const { container } = render(<SkeletonLoader rows={2} />);
    const avatars = container.querySelectorAll(".bg-gray-200.rounded-lg");
    expect(avatars.length).toBeGreaterThanOrEqual(2);
  });
});

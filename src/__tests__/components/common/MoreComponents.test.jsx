import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import MedTrackLogo from "../../../components/common/MedTrackLogo";
import AnimatedSection from "../../../components/common/AnimatedSection";
import ScrollToTopButton from "../../../components/common/ScrollToTopButton";

describe("MedTrackLogo", () => {
  it("renders the medtrack text", () => {
    render(<MedTrackLogo />);
    expect(screen.getByText(/medtrack/)).toBeInTheDocument();
  });
  it("applies default size class", () => {
    render(<MedTrackLogo />);
    expect(screen.getByText(/medtrack/).className).toContain("text-3xl");
  });
  it("applies custom size", () => {
    render(<MedTrackLogo size="text-xl" />);
    expect(screen.getByText(/medtrack/).className).toContain("text-xl");
  });
  it("applies custom className", () => {
    render(<MedTrackLogo className="extra-class" />);
    expect(screen.getByText(/medtrack/).className).toContain("extra-class");
  });
  it("uses Plus Jakarta Sans font", () => {
    render(<MedTrackLogo />);
    expect(screen.getByText(/medtrack/).style.fontFamily).toContain("Plus Jakarta Sans");
  });
  it("has blue text color", () => {
    render(<MedTrackLogo />);
    expect(screen.getByText(/medtrack/).className).toContain("text-[#2563eb]");
  });
});

describe("AnimatedSection", () => {
  beforeEach(() => {
    global.IntersectionObserver = class {
      constructor(cb) { this.cb = cb; }
      observe(el) { this.cb([{ isIntersecting: true, target: el }], this); }
      unobserve() {}
      disconnect() {}
    };
  });
  it("renders children", () => {
    render(<AnimatedSection><div>Animated content</div></AnimatedSection>);
    expect(screen.getByText("Animated content")).toBeInTheDocument();
  });
  it("applies transition classes", () => {
    const { container } = render(<AnimatedSection><div>Content</div></AnimatedSection>);
    expect(container.firstChild.className).toContain("transition-opacity");
  });
  it("applies default animation", () => {
    render(<AnimatedSection><div>Content</div></AnimatedSection>);
    expect(screen.getByText("Content").parentElement.className).toContain("animate-fade-up");
  });
  it("applies custom animation prop", () => {
    const { container } = render(<AnimatedSection animation="animate-fade-left"><div>Content</div></AnimatedSection>);
    expect(container.firstChild.className).toContain("transition-opacity");
  });
  it("applies delay prop", () => {
    const { container } = render(<AnimatedSection delay="delay-200"><div>Content</div></AnimatedSection>);
    expect(container.firstChild.className).toContain("transition-opacity");
  });
  it("applies custom className", () => {
    render(<AnimatedSection className="my-class"><div>Content</div></AnimatedSection>);
    expect(screen.getByText("Content").parentElement.className).toContain("my-class");
  });
});

describe("ScrollToTopButton", () => {
  beforeEach(() => { window.scrollY = 0; });
  it("renders nothing when not scrolled", () => {
    const { container } = render(<ScrollToTopButton />);
    expect(container.querySelector("button")).not.toBeInTheDocument();
  });
  it("renders button when scrolled past threshold", () => {
    render(<ScrollToTopButton />);
    Object.defineProperty(window, "scrollY", { value: 500, writable: true, configurable: true });
    fireEvent.scroll(window);
    expect(screen.getByRole("button", { name: /scroll to top/i })).toBeInTheDocument();
  });
  it("has proper aria-label", () => {
    Object.defineProperty(window, "scrollY", { value: 500, writable: true, configurable: true });
    render(<ScrollToTopButton />);
    fireEvent.scroll(window);
    expect(screen.getByLabelText("Scroll to top")).toBeInTheDocument();
  });
  it("hides when scrolled back up", () => {
    const { container } = render(<ScrollToTopButton />);
    Object.defineProperty(window, "scrollY", { value: 500, writable: true, configurable: true });
    fireEvent.scroll(window);
    expect(container.querySelector("button")).toBeInTheDocument();
    Object.defineProperty(window, "scrollY", { value: 100, writable: true, configurable: true });
    fireEvent.scroll(window);
    expect(container.querySelector("button")).not.toBeInTheDocument();
  });
  it("calls window.scrollTo when clicked", () => {
    const spy = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    Object.defineProperty(window, "scrollY", { value: 500, writable: true, configurable: true });
    render(<ScrollToTopButton />);
    fireEvent.scroll(window);
    fireEvent.click(screen.getByRole("button", { name: /scroll to top/i }));
    expect(spy).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
    spy.mockRestore();
  });
});

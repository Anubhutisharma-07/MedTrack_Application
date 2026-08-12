import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { renderWithProviders } from "../utils/renderWithProviders";
import CareersPage from "../../pages/CareersPage";
import CookiePage from "../../pages/CookiePage";
import AnimatedSection from "../../components/common/AnimatedSection";

// jsdom does not implement IntersectionObserver. These tests lock in the
// behaviour that pages using AnimatedSection (CareersPage, JobApplicationPage)
// render without crashing when the API is missing, and that CookiePage's FAQ
// data (moved to DoNotSellPage) is still available.

describe("render crash regression (IntersectionObserver absent in jsdom)", () => {
  it("AnimatedSection shows its content instead of throwing", () => {
    render(<AnimatedSection animation="animate-fade-up">Hello section</AnimatedSection>);
    expect(screen.getByText("Hello section")).toBeInTheDocument();
  });

  it("CareersPage renders without a synchronous crash", () => {
    renderWithProviders(<CareersPage onNavigate={() => {}} />);
    expect(screen.getByText("health infrastructure")).toBeInTheDocument();
  });
});

describe("CookiePage renders despite the FAQ data moving to DoNotSellPage", () => {
  it("renders the Regulations FAQ section", () => {
    renderWithProviders(<CookiePage />);
    expect(screen.getByText("Cookie Policy FAQ")).toBeInTheDocument();
    expect(screen.getByText(/Selling.*under CCPA\/CPRA/)).toBeInTheDocument();
  });
});

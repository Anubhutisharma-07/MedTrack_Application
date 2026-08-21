import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import CareersPage from "../../pages/CareersPage";

describe("CareersPage", () => {
  it("renders job listings without crashing", () => {
    // AnimatedSection constructs an IntersectionObserver in a mount effect; the
    // jsdom environment provides a no-op mock via setupTests so this renders.
    render(<CareersPage onNavigate={() => {}} />);

    expect(screen.getByText("Senior Frontend Engineer")).toBeInTheDocument();
    expect(screen.getByText("How do I apply?")).toBeInTheDocument();
  });
});

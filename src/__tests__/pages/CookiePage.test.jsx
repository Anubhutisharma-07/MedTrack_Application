// Regression test for src/pages/CookiePage.jsx.
//
// The page referenced three identifiers that were never declared - `STATUTE_FAQS`,
// `expandedFaqIdx` and `setExpandedFaqIdx` - inside a rendered "Cookie Policy FAQ" section, so the
// first render threw `ReferenceError: STATUTE_FAQS is not defined`.
//
// Nothing caught it, and the reason is worth recording: the page is superseded by CookieConsentPage
// (which serves the "cookies" route), so it is unrouted and imported by nothing. webpack therefore
// never compiles it, and ESLint's no-undef never sees it. It was found by the static
// undefined-identifier scan, which reads the file rather than the bundle.
//
// Being unreachable is why the defect survived, so a render assertion is the thing that was missing:
// the static scan proves the names are declared, and this proves the section they belong to works.

import { screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { renderWithProviders } from "../utils/renderWithProviders";
import CookiePage from "../../pages/CookiePage";

describe("CookiePage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders without throwing", () => {
    expect(() => renderWithProviders(<CookiePage />)).not.toThrow();
  });

  it("renders the FAQ section and all three questions", () => {
    renderWithProviders(<CookiePage />);

    expect(screen.getByText("Cookie Policy FAQ")).toBeInTheDocument();
    expect(screen.getByText(/What counts as .*selling.* or .*sharing.* personal information/)).toBeInTheDocument();
    expect(screen.getByText(/How is sensitive geolocation handled/)).toBeInTheDocument();
    expect(screen.getByText(/My employer administers this account/)).toBeInTheDocument();
  });

  it("keeps every answer collapsed until a question is opened", () => {
    renderWithProviders(<CookiePage />);

    // expandedFaqIdx starts at null, so no answer body is mounted.
    expect(screen.queryByText(/Under the CPRA/)).not.toBeInTheDocument();
  });

  it("expands the answer for the question that was clicked", () => {
    renderWithProviders(<CookiePage />);

    fireEvent.click(screen.getByText(/How is sensitive geolocation handled/));

    expect(screen.getByText(/1,850 metres/)).toBeInTheDocument();
    expect(screen.queryByText(/Under the CPRA/)).not.toBeInTheDocument();
  });

  it("collapses the open answer when a second question is opened", () => {
    // The accordion is single-open, which is the reason expandedFaqIdx holds an index rather than a
    // per-row boolean.
    renderWithProviders(<CookiePage />);

    fireEvent.click(screen.getByText(/How is sensitive geolocation handled/));
    expect(screen.getByText(/1,850 metres/)).toBeInTheDocument();

    fireEvent.click(screen.getByText(/My employer administers this account/));

    expect(screen.queryByText(/1,850 metres/)).not.toBeInTheDocument();
    expect(screen.getByText(/audit data the hospital is required to retain/)).toBeInTheDocument();
  });

  it("collapses an open answer when its own question is clicked again", () => {
    renderWithProviders(<CookiePage />);

    const question = screen.getByText(/How is sensitive geolocation handled/);
    fireEvent.click(question);
    expect(screen.getByText(/1,850 metres/)).toBeInTheDocument();

    fireEvent.click(question);
    expect(screen.queryByText(/1,850 metres/)).not.toBeInTheDocument();
  });
});

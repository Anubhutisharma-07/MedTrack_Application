import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "../../__tests__/utils/renderWithProviders";
import Navbar, {
  PUBLIC_NAV_LINKS,
  HOSPITAL_NAV_LINKS,
  TECHNICIAN_NAV_LINKS,
  SUPPLIER_NAV_LINKS,
} from "./Navbar";
import { getRoute } from "../../routes/routeRegistry";

describe("Navbar navigation targets", () => {
  const assertAllRegistered = (links) => {
    for (const link of links) {
      if (link.section) continue;
      expect(getRoute(link.page), `${link.label} -> "${link.page}"`).toBeTruthy();
    }
  };

  it("every public link resolves to a registered route", () => {
    assertAllRegistered(PUBLIC_NAV_LINKS);
  });

  it("every hospital link resolves to a registered route", () => {
    assertAllRegistered(HOSPITAL_NAV_LINKS);
  });

  it("every technician link resolves to a registered route", () => {
    assertAllRegistered(TECHNICIAN_NAV_LINKS);
  });

  it("every supplier link resolves to a registered route", () => {
    assertAllRegistered(SUPPLIER_NAV_LINKS);
  });
});

describe("Navbar public section links", () => {
  const scrollIntoViewMock = vi.fn();

  beforeEach(() => {
    Element.prototype.scrollIntoView = scrollIntoViewMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("scrolls to the section when already on the landing page", () => {
    const section = document.createElement("section");
    section.id = "features";
    document.body.appendChild(section);

    const onNavigate = vi.fn();
    renderWithProviders(<Navbar onNavigate={onNavigate} currentPage="landing" />, {
      authValue: { user: null },
    });

    fireEvent.click(screen.getByRole("button", { name: "Features" }));

    expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
    expect(onNavigate).not.toHaveBeenCalled();

    document.body.removeChild(section);
  });

  it("navigates to the landing page when clicking a section link from another page", () => {
    const onNavigate = vi.fn();
    renderWithProviders(<Navbar onNavigate={onNavigate} currentPage="about" />, {
      authValue: { user: null },
    });

    fireEvent.click(screen.getByRole("button", { name: "Hospitals" }));

    expect(onNavigate).toHaveBeenCalledWith("landing");
  });
});

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Footer from "./Footer";
import CookieBanner from "./CookieBanner";
import { getRoute } from "../../routes/routeRegistry";

describe("Footer navigation targets", () => {
  it("every button target resolves to a registered page key (no 404s)", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(<Footer onNavigate={onNavigate} />);

    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);

    for (const button of buttons) {
      await user.click(button);
    }

    const calls = onNavigate.mock.calls;
    expect(calls.length).toBe(buttons.length);

    for (const [page] of calls) {
      expect(getRoute(page), `footer links to "${page}", which is not a registered page`).toBeTruthy();
    }
  });

  it("the legal and marketing links fixed in this change resolve", () => {
    for (const page of ["research", "supplier-centre", "privacy", "cookies", "do-not-sell"]) {
      expect(getRoute(page), `${page} should be registered`).toBeTruthy();
    }
  });
});

describe("CookieBanner navigation targets", () => {
  it('the "Preferences" button targets the registered "cookies" page', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(<CookieBanner onNavigate={onNavigate} />);

    await user.click(screen.getByRole("button", { name: "Preferences" }));

    expect(onNavigate).toHaveBeenCalledWith("cookies");
    expect(getRoute("cookies")).toBeTruthy();
  });
});

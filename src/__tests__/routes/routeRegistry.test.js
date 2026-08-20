import { describe, it, expect, afterEach } from "vitest";
import { buildHref, BASE_PATH } from "../../routes/routeRegistry";

describe("buildHref", () => {
  afterEach(() => {
    window.history.pushState({}, "", "/");
  });

  it("prefixes BASE_PATH when the app is served under it (GitHub Pages)", () => {
    window.history.pushState({}, "", `${BASE_PATH}/equipment`);
    expect(buildHref("login")).toBe(`${BASE_PATH}/login`);
    expect(buildHref("register")).toBe(`${BASE_PATH}/register`);
  });

  it("returns bare paths when not served under the base path (local dev)", () => {
    window.history.pushState({}, "", "/login");
    expect(buildHref("register")).toBe("/register");
    expect(buildHref("terms")).toBe("/terms");
  });

  it("builds paths from the registered slug for known pages", () => {
    window.history.pushState({}, "", "/");
    expect(buildHref("dashboard")).toBe("/dashboard");
    expect(buildHref("security")).toBe("/security");
  });
});

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { ThemeProvider, useTheme } from "../../context/ThemeContext";

function ThemeConsumer({ onReady }) {
  const ctx = useTheme();
  onReady?.(ctx);
  return (
    <div data-testid="theme-display">{ctx?.theme || "none"}</div>
  );
}

describe("ThemeContext", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("provides theme and toggleTheme", () => {
    let ctx;
    render(
      <ThemeProvider>
        <ThemeConsumer onReady={(c) => { ctx = c; }} />
      </ThemeProvider>
    );
    expect(ctx.theme).toBeDefined();
    expect(typeof ctx.toggleTheme).toBe("function");
  });

  it("defaults to light theme", () => {
    let ctx;
    render(
      <ThemeProvider>
        <ThemeConsumer onReady={(c) => { ctx = c; }} />
      </ThemeProvider>
    );
    expect(ctx.theme).toBe("light");
  });

  it("reads theme from localStorage", () => {
    localStorage.setItem("theme", "dark");
    let ctx;
    render(
      <ThemeProvider>
        <ThemeConsumer onReady={(c) => { ctx = c; }} />
      </ThemeProvider>
    );
    expect(ctx.theme).toBe("dark");
  });

  it("toggles theme from light to dark", () => {
    let ctx;
    render(
      <ThemeProvider>
        <ThemeConsumer onReady={(c) => { ctx = c; }} />
      </ThemeProvider>
    );
    expect(ctx.theme).toBe("light");
    act(() => { ctx.toggleTheme(); });
    expect(screen.getByTestId("theme-display").textContent).toBe("dark");
  });

  it("toggles theme from dark to light", () => {
    localStorage.setItem("theme", "dark");
    let ctx;
    render(
      <ThemeProvider>
        <ThemeConsumer onReady={(c) => { ctx = c; }} />
      </ThemeProvider>
    );
    act(() => { ctx.toggleTheme(); });
    expect(screen.getByTestId("theme-display").textContent).toBe("light");
  });

  it("persists theme to localStorage", () => {
    let ctx;
    render(
      <ThemeProvider>
        <ThemeConsumer onReady={(c) => { ctx = c; }} />
      </ThemeProvider>
    );
    act(() => { ctx.toggleTheme(); });
    expect(localStorage.getItem("theme")).toBe("dark");
  });

  it("adds dark class to document root", () => {
    let ctx;
    render(
      <ThemeProvider>
        <ThemeConsumer onReady={(c) => { ctx = c; }} />
      </ThemeProvider>
    );
    act(() => { ctx.toggleTheme(); });
    expect(window.document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("removes dark class when toggling back to light", () => {
    let ctx;
    render(
      <ThemeProvider>
        <ThemeConsumer onReady={(c) => { ctx = c; }} />
      </ThemeProvider>
    );
    act(() => { ctx.toggleTheme(); });
    act(() => { ctx.toggleTheme(); });
    expect(window.document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("useTheme returns undefined outside ThemeProvider", () => {
    let ctx;
    render(<ThemeConsumer onReady={(c) => { ctx = c; }} />);
    expect(ctx).toBeUndefined();
  });

  it("double toggle restores original theme", () => {
    let ctx;
    render(
      <ThemeProvider>
        <ThemeConsumer onReady={(c) => { ctx = c; }} />
      </ThemeProvider>
    );
    act(() => { ctx.toggleTheme(); });
    act(() => { ctx.toggleTheme(); });
    expect(screen.getByTestId("theme-display").textContent).toBe("light");
  });
});

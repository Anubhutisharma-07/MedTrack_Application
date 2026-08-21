import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import useKeyboardShortcuts, {
  matchesShortcut,
} from "../../hooks/useKeyboardShortcuts";

const keydown = (init) => new KeyboardEvent("keydown", { ...init, cancelable: true });

describe("matchesShortcut", () => {
  it("matches modifier combos exactly", () => {
    expect(matchesShortcut(keydown({ key: "k", ctrlKey: true }), "ctrl+k")).toBe(true);
    expect(matchesShortcut(keydown({ key: "K", ctrlKey: true }), "ctrl+k")).toBe(true);
    expect(matchesShortcut(keydown({ key: "k", metaKey: true }), "meta+k")).toBe(true);
    expect(matchesShortcut(keydown({ key: "k", ctrlKey: true, shiftKey: true }), "ctrl+shift+k")).toBe(true);
  });

  it("rejects events with the wrong modifiers", () => {
    expect(matchesShortcut(keydown({ key: "k" }), "ctrl+k")).toBe(false);
    expect(matchesShortcut(keydown({ key: "k", metaKey: true }), "ctrl+k")).toBe(false);
    expect(matchesShortcut(keydown({ key: "j", ctrlKey: true }), "ctrl+k")).toBe(false);
  });

  it("matches plain keys and special keys", () => {
    expect(matchesShortcut(keydown({ key: "?" }), "?")).toBe(true);
    expect(matchesShortcut(keydown({ key: "Escape" }), "escape")).toBe(true);
    expect(matchesShortcut(keydown({ key: "ArrowDown" }), "arrowdown")).toBe(true);
  });
});

describe("useKeyboardShortcuts", () => {
  const dispatch = (init) => act(() => window.dispatchEvent(keydown(init)));

  it("fires the handler for a registered shortcut and prevents default", () => {
    const handler = vi.fn();
    const { unmount } = renderHook(() => useKeyboardShortcuts({ "ctrl+k": handler }));
    dispatch({ key: "k", ctrlKey: true });
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].defaultPrevented).toBe(true);
    unmount();
  });

  it("does not fire for unregistered keys", () => {
    const handler = vi.fn();
    const { unmount } = renderHook(() => useKeyboardShortcuts({ "ctrl+k": handler }));
    dispatch({ key: "k" });
    dispatch({ key: "j", ctrlKey: true });
    expect(handler).not.toHaveBeenCalled();
    unmount();
  });

  it("uses the latest handler without re-subscribing", () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender, unmount } = renderHook(
      ({ cb }) => useKeyboardShortcuts({ "ctrl+k": cb }),
      { initialProps: { cb: first } }
    );
    rerender({ cb: second });
    dispatch({ key: "k", ctrlKey: true });
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
    unmount();
  });

  it("cleans up the listener on unmount", () => {
    const handler = vi.fn();
    const { unmount } = renderHook(() => useKeyboardShortcuts({ "ctrl+k": handler }));
    unmount();
    dispatch({ key: "k", ctrlKey: true });
    expect(handler).not.toHaveBeenCalled();
  });

  it("ignores plain-letter shortcuts while typing in an input", () => {
    const handler = vi.fn();
    const { unmount } = renderHook(() => useKeyboardShortcuts({ k: handler, "ctrl+k": handler }));
    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();
    act(() => {
      // Plain "k" while typing is skipped; the ctrl+k combo still fires.
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "k", bubbles: true, cancelable: true }));
      input.dispatchEvent(
        new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true, cancelable: true })
      );
    });
    document.body.removeChild(input);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].ctrlKey).toBe(true);
    unmount();
  });
});

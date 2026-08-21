import { useEffect, useRef } from "react";

/**
 * Parses a shortcut descriptor such as "ctrl+k", "meta+shift+?" or "escape"
 * and returns true when the given keydown event matches it.
 *
 * Supported modifiers: ctrl, meta, alt, shift (any combination, in any
 * order). The final segment is the key itself, matched case-insensitively
 * against `event.key` ("escape", "enter", "arrowdown", "?" ...).
 */
export function matchesShortcut(event, descriptor) {
  const parts = descriptor.toLowerCase().split("+");
  const key = parts.pop();
  const wantsCtrl = parts.includes("ctrl");
  const wantsMeta = parts.includes("meta");
  const wantsAlt = parts.includes("alt");
  const wantsShift = parts.includes("shift");

  return (
    event.ctrlKey === wantsCtrl &&
    event.metaKey === wantsMeta &&
    event.altKey === wantsAlt &&
    event.shiftKey === wantsShift &&
    event.key.toLowerCase() === key
  );
}

/**
 * Registers global keydown shortcuts. Pass a map of descriptor -> handler,
 * e.g. `{ "ctrl+k": openPalette }`.
 *
 * Handlers live in a ref so the latest closures are used without
 * re-subscribing the window listener on every render.
 *
 * Plain-letter shortcuts (no modifier) are ignored while the user is typing
 * in an input/textarea/contentEditable so they never hijack normal typing;
 * modifier combos (ctrl+k) always fire.
 */
export default function useKeyboardShortcuts(shortcuts) {
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  useEffect(() => {
    const handler = (event) => {
      const target = event.target;
      const typing =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      Object.entries(shortcutsRef.current).forEach(([descriptor, callback]) => {
        if (matchesShortcut(event, descriptor)) {
          if (typing && !descriptor.includes("+")) {
            return;
          }
          event.preventDefault();
          callback(event);
        }
      });
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return null;
}

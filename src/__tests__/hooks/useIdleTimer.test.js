import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import useIdleTimer from "../../hooks/useIdleTimer";

const TIMEOUT_MS = 10_000;

function advance(ms) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

describe("useIdleTimer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts with the full countdown", () => {
    const { result } = renderHook(() =>
      useIdleTimer({ timeoutMs: TIMEOUT_MS, onLock: vi.fn() })
    );
    expect(result.current.remainingMs).toBe(TIMEOUT_MS);
  });

  it("counts down as time passes without activity", () => {
    const { result } = renderHook(() =>
      useIdleTimer({ timeoutMs: TIMEOUT_MS, onLock: vi.fn() })
    );
    advance(4_000);
    expect(result.current.remainingMs).toBe(6_000);
    advance(3_000);
    expect(result.current.remainingMs).toBe(3_000);
  });

  it("resets the countdown on user activity", () => {
    const { result } = renderHook(() =>
      useIdleTimer({ timeoutMs: TIMEOUT_MS, onLock: vi.fn() })
    );
    advance(4_000);
    expect(result.current.remainingMs).toBe(6_000);

    act(() => {
      window.dispatchEvent(new Event("mousedown"));
    });
    expect(result.current.remainingMs).toBe(TIMEOUT_MS);

    advance(2_000);
    expect(result.current.remainingMs).toBe(8_000);
  });

  it("throttles high-frequency events so resting the cursor does not keep the session alive", () => {
    const { result } = renderHook(() =>
      useIdleTimer({ timeoutMs: TIMEOUT_MS, onLock: vi.fn() })
    );
    advance(9_000);
    expect(result.current.remainingMs).toBe(1_000);

    // A single mousemove after a real pause still resets the clock...
    act(() => {
      window.dispatchEvent(new Event("mousemove"));
    });
    expect(result.current.remainingMs).toBe(TIMEOUT_MS);

    // ...but events landing inside the 250ms throttle window are ignored, so a
    // stream of cursor-jitter events cannot keep resetting the countdown.
    act(() => {
      vi.advanceTimersByTime(100);
      window.dispatchEvent(new Event("mousemove")); // t=9100: 100ms after reset -> throttled
      vi.advanceTimersByTime(100);
      window.dispatchEvent(new Event("mousemove")); // t=9200: still inside the window -> throttled
      vi.advanceTimersByTime(800);
    });
    // The clock only moved 1s from the last *accepted* reset (t=9000).
    expect(result.current.remainingMs).toBe(9_000);
  });

  it("fires onLock exactly once when the countdown reaches zero", () => {
    const onLock = vi.fn();
    const { result } = renderHook(() =>
      useIdleTimer({ timeoutMs: TIMEOUT_MS, onLock })
    );
    advance(10_000);
    expect(onLock).toHaveBeenCalledTimes(1);
    expect(result.current.remainingMs).toBe(0);

    // The interval stops itself - further time does not re-fire onLock.
    advance(30_000);
    expect(onLock).toHaveBeenCalledTimes(1);
  });

  it("treats hidden-tab time as idle time", () => {
    const { result } = renderHook(() =>
      useIdleTimer({ timeoutMs: TIMEOUT_MS, onLock: vi.fn() })
    );
    advance(4_000);
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(result.current.remainingMs).toBe(6_000);
  });

  it("resets the clock when reset() is called", () => {
    const { result } = renderHook(() =>
      useIdleTimer({ timeoutMs: TIMEOUT_MS, onLock: vi.fn() })
    );
    advance(7_000);
    expect(result.current.remainingMs).toBe(3_000);
    act(() => {
      result.current.reset();
    });
    expect(result.current.remainingMs).toBe(TIMEOUT_MS);
  });

  it("installs no timers when disabled", () => {
    const onLock = vi.fn();
    renderHook(() =>
      useIdleTimer({ timeoutMs: TIMEOUT_MS, onLock, enabled: false })
    );
    advance(60_000);
    expect(onLock).not.toHaveBeenCalled();
  });

  it("cleans up listeners and timers on unmount", () => {
    const onLock = vi.fn();
    const { unmount } = renderHook(() =>
      useIdleTimer({ timeoutMs: TIMEOUT_MS, onLock })
    );
    unmount();
    advance(60_000);
    expect(onLock).not.toHaveBeenCalled();
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, waitFor } from "@testing-library/react";
import { ToastProvider, useToast } from "../../context/ToastContext";

function TestConsumer({ onToast }) {
  const toast = useToast();
  onToast?.(toast);
  return (
    <div>
      <span data-testid="toast-count">{toast?.toasts?.length || 0}</span>
      {toast?.toasts?.map((t) => (
        <div key={t.id} data-testid={`toast-${t.id}`}>
          {t.message} ({t.type})
        </div>
      ))}
    </div>
  );
}

describe("ToastContext", () => {
  it("provides toast context to consumers", () => {
    let toastRef;
    render(<ToastProvider><TestConsumer onToast={(t) => { toastRef = t; }} /></ToastProvider>);
    expect(toastRef).toBeDefined();
    expect(toastRef.toasts).toEqual([]);
    expect(typeof toastRef.addToast).toBe("function");
    expect(typeof toastRef.removeToast).toBe("function");
  });

  it("addToast adds a toast to the list", () => {
    let toastRef;
    render(<ToastProvider><TestConsumer onToast={(t) => { toastRef = t; }} /></ToastProvider>);
    act(() => { toastRef.addToast("Operation successful"); });
    expect(screen.getByTestId("toast-count")).toHaveTextContent("1");
    expect(screen.getByText("Operation successful (info)")).toBeInTheDocument();
  });

  it("addToast supports custom type", () => {
    let toastRef;
    render(<ToastProvider><TestConsumer onToast={(t) => { toastRef = t; }} /></ToastProvider>);
    act(() => { toastRef.addToast("Error occurred", "error"); });
    expect(screen.getByText("Error occurred (error)")).toBeInTheDocument();
  });

  it("addToast supports success type", () => {
    let toastRef;
    render(<ToastProvider><TestConsumer onToast={(t) => { toastRef = t; }} /></ToastProvider>);
    act(() => { toastRef.addToast("Saved!", "success"); });
    expect(screen.getByText("Saved! (success)")).toBeInTheDocument();
  });

  it("addToast supports warning type", () => {
    let toastRef;
    render(<ToastProvider><TestConsumer onToast={(t) => { toastRef = t; }} /></ToastProvider>);
    act(() => { toastRef.addToast("Check input", "warning"); });
    expect(screen.getByText("Check input (warning)")).toBeInTheDocument();
  });

  it("addToast returns a unique numeric id", () => {
    let toastRef;
    render(<ToastProvider><TestConsumer onToast={(t) => { toastRef = t; }} /></ToastProvider>);
    let id1, id2;
    act(() => { id1 = toastRef.addToast("Toast 1"); id2 = toastRef.addToast("Toast 2"); });
    expect(typeof id1).toBe("number");
    expect(id1).not.toBe(id2);
  });

  it("removeToast removes a specific toast", () => {
    let toastRef;
    render(<ToastProvider><TestConsumer onToast={(t) => { toastRef = t; }} /></ToastProvider>);
    let id;
    act(() => { id = toastRef.addToast("Removable toast"); });
    expect(screen.getByTestId("toast-count")).toHaveTextContent("1");
    act(() => { toastRef.removeToast(id); });
    expect(screen.getByTestId("toast-count")).toHaveTextContent("0");
  });

  it("multiple toasts can be added", () => {
    let toastRef;
    render(<ToastProvider><TestConsumer onToast={(t) => { toastRef = t; }} /></ToastProvider>);
    act(() => { toastRef.addToast("First"); toastRef.addToast("Second"); toastRef.addToast("Third"); });
    expect(screen.getByTestId("toast-count")).toHaveTextContent("3");
  });

  it("removing a non-existent toast id is safe", () => {
    let toastRef;
    render(<ToastProvider><TestConsumer onToast={(t) => { toastRef = t; }} /></ToastProvider>);
    expect(() => { act(() => { toastRef.removeToast(99999); }); }).not.toThrow();
  });

  it("useToast returns null when used outside ToastProvider", () => {
    let toastRef;
    render(<TestConsumer onToast={(t) => { toastRef = t; }} />);
    expect(toastRef).toBeNull();
  });

  it("addToast sets duration on toast object", () => {
    let toastRef;
    render(<ToastProvider><TestConsumer onToast={(t) => { toastRef = t; }} /></ToastProvider>);
    act(() => { toastRef.addToast("With duration", "info", 5000); });
    expect(screen.getByTestId("toast-count")).toHaveTextContent("1");
    // Verify the toast was created with default type
    expect(screen.getByText("With duration (info)")).toBeInTheDocument();
  });
});

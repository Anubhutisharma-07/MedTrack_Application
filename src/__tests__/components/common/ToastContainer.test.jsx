import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ToastProvider, useToast } from "../../../context/ToastContext";
import ToastContainer from "../../../components/common/ToastContainer";

function ToastHelper({ onReady }) {
  const toast = useToast();
  onReady(toast);
  return null;
}

function Wrapper({ children }) {
  return <ToastProvider>{children}</ToastProvider>;
}

describe("ToastContainer", () => {
  it("renders nothing when there are no toasts", () => {
    const { container } = render(<Wrapper><ToastContainer /></Wrapper>);
    expect(container.querySelector("[role='alert']")).not.toBeInTheDocument();
  });

  it("renders a toast message after addToast is called", () => {
    let toastApi;
    render(
      <Wrapper>
        <ToastHelper onReady={(t) => { toastApi = t; }} />
        <ToastContainer />
      </Wrapper>
    );
    act(() => { toastApi.addToast("Test message", "info"); });
    expect(screen.getByText("Test message")).toBeInTheDocument();
  });

  it("renders success toast with correct icon area", () => {
    let toastApi;
    render(
      <Wrapper>
        <ToastHelper onReady={(t) => { toastApi = t; }} />
        <ToastContainer />
      </Wrapper>
    );
    act(() => { toastApi.addToast("Saved!", "success"); });
    expect(screen.getByText("Saved!")).toBeInTheDocument();
  });

  it("renders error toast", () => {
    let toastApi;
    render(
      <Wrapper>
        <ToastHelper onReady={(t) => { toastApi = t; }} />
        <ToastContainer />
      </Wrapper>
    );
    act(() => { toastApi.addToast("Failed!", "error"); });
    expect(screen.getByText("Failed!")).toBeInTheDocument();
  });

  it("renders warning toast", () => {
    let toastApi;
    render(
      <Wrapper>
        <ToastHelper onReady={(t) => { toastApi = t; }} />
        <ToastContainer />
      </Wrapper>
    );
    act(() => { toastApi.addToast("Caution!", "warning"); });
    expect(screen.getByText("Caution!")).toBeInTheDocument();
  });

  it("dismiss button removes the toast", () => {
    let toastApi;
    render(
      <Wrapper>
        <ToastHelper onReady={(t) => { toastApi = t; }} />
        <ToastContainer />
      </Wrapper>
    );
    act(() => { toastApi.addToast("Dismissible", "info"); });
    const dismissBtn = screen.getByRole("button", { name: /dismiss/i });
    act(() => { fireEvent.click(dismissBtn); });
    expect(screen.queryByText("Dismissible")).not.toBeInTheDocument();
  });

  it("renders multiple toasts simultaneously", () => {
    let toastApi;
    render(
      <Wrapper>
        <ToastHelper onReady={(t) => { toastApi = t; }} />
        <ToastContainer />
      </Wrapper>
    );
    act(() => {
      toastApi.addToast("First toast");
      toastApi.addToast("Second toast");
    });
    expect(screen.getByText("First toast")).toBeInTheDocument();
    expect(screen.getByText("Second toast")).toBeInTheDocument();
  });

  it("toast has role=alert for accessibility", () => {
    let toastApi;
    render(
      <Wrapper>
        <ToastHelper onReady={(t) => { toastApi = t; }} />
        <ToastContainer />
      </Wrapper>
    );
    act(() => { toastApi.addToast("Alert toast"); });
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("container uses fixed positioning", () => {
    let toastApi;
    const { container } = render(
      <Wrapper>
        <ToastHelper onReady={(t) => { toastApi = t; }} />
        <ToastContainer />
      </Wrapper>
    );
    act(() => { toastApi.addToast("Positioned"); });
    const fixedEl = container.querySelector(".fixed");
    expect(fixedEl).toBeInTheDocument();
    expect(fixedEl.className).toContain("top-4");
    expect(fixedEl.className).toContain("right-4");
  });
});

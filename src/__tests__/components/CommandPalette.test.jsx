import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "../utils/renderWithProviders";
import CommandPalette from "../../components/common/CommandPalette";

const renderPalette = ({ onNavigate, onClose, authValue } = {}) =>
  renderWithProviders(
    <CommandPalette
      open
      onClose={onClose || vi.fn()}
      onNavigate={onNavigate || vi.fn()}
    />,
    { authValue }
  );

const hospitalAuth = {
  user: { id: "u1", role: "hospital", name: "Hospital Admin" },
};

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
  document.documentElement.classList.remove("dark");
});

describe("CommandPalette", () => {
  it("renders nothing when closed", () => {
    const { container } = renderWithProviders(
      <CommandPalette open={false} onClose={vi.fn()} onNavigate={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("lists pages a signed-out visitor can actually reach", () => {
    renderPalette();
    expect(screen.getByRole("dialog", { name: "Command palette" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Blog" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Help Center" })).toBeInTheDocument();
    // Protected pages stay hidden for signed-out visitors.
    expect(screen.queryByRole("option", { name: "Equipment" })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Dashboard" })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Analytics" })).not.toBeInTheDocument();
  });

  it("adds the authenticated and role-scoped pages for a hospital user", () => {
    renderPalette({ authValue: hospitalAuth });
    expect(screen.getByRole("option", { name: "Equipment" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Analytics" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Add Equipment" })).toBeInTheDocument();
  });

  it("filters pages as the query is typed", () => {
    renderPalette({ authValue: hospitalAuth });
    const input = screen.getByRole("textbox", { name: "Search pages and actions" });
    fireEvent.change(input, { target: { value: "equip" } });
    expect(screen.getByRole("option", { name: "Equipment" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Add Equipment" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Blog" })).not.toBeInTheDocument();
  });

  it("matches on search keywords, not just labels", () => {
    renderPalette({ authValue: hospitalAuth });
    const input = screen.getByRole("textbox", { name: "Search pages and actions" });
    fireEvent.change(input, { target: { value: "sla" } });
    expect(screen.getByRole("option", { name: "SLA Dashboard" })).toBeInTheDocument();
  });

  it("never offers parameterised routes that need a record id", () => {
    renderPalette({ authValue: hospitalAuth });
    const input = screen.getByRole("textbox", { name: "Search pages and actions" });
    fireEvent.change(input, { target: { value: "update" } });
    expect(screen.queryByRole("option", { name: "Update Task" })).not.toBeInTheDocument();
    expect(screen.getByText(/No results/)).toBeInTheDocument();
  });

  it("selects the highlighted page with Enter", () => {
    const onNavigate = vi.fn();
    const onClose = vi.fn();
    renderPalette({ onNavigate, onClose, authValue: hospitalAuth });
    const input = screen.getByRole("textbox", { name: "Search pages and actions" });
    fireEvent.change(input, { target: { value: "equip" } });
    fireEvent.keyDown(input, { key: "Enter" });
    // Best match first: "equipment" scores above "add-equipment".
    expect(onNavigate).toHaveBeenCalledWith("equipment");
    expect(onClose).toHaveBeenCalled();
  });

  it("moves the selection with arrow keys", () => {
    const onNavigate = vi.fn();
    renderPalette({ onNavigate, authValue: hospitalAuth });
    const input = screen.getByRole("textbox", { name: "Search pages and actions" });
    fireEvent.change(input, { target: { value: "equip" } });
    // "equip" ranks label-prefix matches first: "Equipment" then "Equipment Lifecycle"
    // (the equipment-lifecycle page's humanised label; ties break alphabetically), and only
    // then substring matches such as "Add Equipment". ArrowDown moves to the second result.
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onNavigate).toHaveBeenCalledWith("equipment-lifecycle");
  });

  it("navigates when an option is clicked", () => {
    const onNavigate = vi.fn();
    renderPalette({ onNavigate });
    fireEvent.click(screen.getByRole("option", { name: "Blog" }));
    expect(onNavigate).toHaveBeenCalledWith("blog");
  });

  it("closes on Escape", () => {
    const onClose = vi.fn();
    renderPalette({ onClose });
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("closes when clicking outside the dialog", () => {
    const onClose = vi.fn();
    renderPalette({ onClose });
    fireEvent.mouseDown(screen.getByTestId("command-palette-overlay"));
    expect(onClose).toHaveBeenCalled();
  });

  it("runs the sign-out action for a signed-in user", () => {
    const logout = vi.fn();
    const onClose = vi.fn();
    renderPalette({
      onClose,
      authValue: { ...hospitalAuth, logout },
    });
    const input = screen.getByRole("textbox", { name: "Search pages and actions" });
    fireEvent.change(input, { target: { value: "sign out" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(logout).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("does not offer sign-out to signed-out visitors", () => {
    renderPalette();
    const input = screen.getByRole("textbox", { name: "Search pages and actions" });
    fireEvent.change(input, { target: { value: "sign out" } });
    expect(screen.queryByRole("option", { name: "Sign out" })).not.toBeInTheDocument();
  });

  it("toggles the theme from the actions", () => {
    renderPalette();
    fireEvent.click(screen.getByRole("option", { name: "Switch to dark mode" }));
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });
});

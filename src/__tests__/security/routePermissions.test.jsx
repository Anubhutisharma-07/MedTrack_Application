import { screen } from "@testing-library/react";
import { it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders } from "../utils/renderWithProviders";
import AppRouter from "../../routes/AppRoutes";

vi.mock("../../services/AuthService", () => ({
  loginUser: vi.fn(),
  getAuthorityVersion: vi.fn(),
  forgotPassword: vi.fn(),
  verifyOtp: vi.fn(),
  resetPassword: vi.fn(),
  incrementAuthorityVersion: vi.fn(),
  bumpGlobalAuthorityVersion: vi.fn(),
  getAuthorityAuditLogs: vi.fn(),
}));

// TaskList fetches its assignments on mount; resolve to an empty list so the
// page settles on its rendered state instead of a loader or an error.
vi.mock("../../services/MaintenanceService", () => ({
  getAllTasks: vi.fn().mockResolvedValue([]),
}));

beforeEach(() => {
  sessionStorage.clear();
});

it("locks add-equipment for a hospital user whose WRITE_EQUIPMENT was revoked", async () => {
  renderWithProviders(
    <AppRouter currentPage="add-equipment" onNavigate={() => {}} />,
    {
      authValue: {
        user: { id: "u1", role: "hospital", name: "Hospital Admin" },
        permissions: ["READ_EQUIPMENT", "READ_MAINTENANCE", "READ_ORDERS"],
      },
    }
  );
  expect(await screen.findByText("Access Denied")).toBeInTheDocument();
  expect(screen.getByText(/WRITE_EQUIPMENT/)).toBeInTheDocument();
});

it("renders add-equipment for a hospital user holding WRITE_EQUIPMENT", async () => {
  renderWithProviders(
    <AppRouter currentPage="add-equipment" onNavigate={() => {}} />,
    {
      authValue: {
        user: { id: "u1", role: "hospital", name: "Hospital Admin" },
        permissions: ["READ_EQUIPMENT", "WRITE_EQUIPMENT", "READ_ORDERS"],
      },
    }
  );
  // Lazy page chunks load slowly under full-suite load; the deny assertions
  // above are synchronous (UnauthorizedPage is inline) but these grant
  // assertions wait on a lazily-imported page, so allow a generous timeout.
  expect(await screen.findByText("Register Asset", {}, { timeout: 8000 })).toBeInTheDocument();
});

it("grants a technician their task list via the matrix fallback", async () => {
  renderWithProviders(
    <AppRouter currentPage="tasks" onNavigate={() => {}} />,
    { authValue: { user: { id: "u1", role: "technician", name: "Tech" } } }
  );
  expect(await screen.findByText("My Assignments", {}, { timeout: 8000 })).toBeInTheDocument();
});

it("locks the technician task list for a supplier", async () => {
  renderWithProviders(
    <AppRouter currentPage="tasks" onNavigate={() => {}} />,
    { authValue: { user: { id: "u1", role: "supplier", name: "Supplier" } } }
  );
  expect(await screen.findByText("Access Denied")).toBeInTheDocument();
});

it("keeps the orders page open for a supplier via the matrix fallback", async () => {
  renderWithProviders(
    <AppRouter currentPage="orders" onNavigate={() => {}} />,
    { authValue: { user: { id: "u1", role: "supplier", name: "Supplier" } } }
  );
  expect(await screen.findByText("Supplier Logistics Portal", {}, { timeout: 8000 })).toBeInTheDocument();
});

it("locks the orders page when a supplier loses READ_ORDERS", async () => {
  renderWithProviders(
    <AppRouter currentPage="orders" onNavigate={() => {}} />,
    {
      authValue: {
        user: { id: "u1", role: "supplier", name: "Supplier" },
        permissions: ["READ_SHIPMENTS", "SEND_INVOICE"],
      },
    }
  );
  expect(await screen.findByText("Access Denied")).toBeInTheDocument();
  expect(screen.getByText(/READ_ORDERS/)).toBeInTheDocument();
});

it("does not redirect a permission denial to the login screen", async () => {
  renderWithProviders(
    <AppRouter currentPage="update-task" onNavigate={() => {}} />,
    {
      authValue: {
        user: { id: "u1", role: "supplier", name: "Supplier" },
        permissions: [],
      },
    }
  );
  expect(await screen.findByText("Access Denied")).toBeInTheDocument();
  expect(screen.queryByText("Welcome back!")).not.toBeInTheDocument();
});

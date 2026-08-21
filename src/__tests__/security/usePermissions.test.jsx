import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AuthContext } from "../../context/AuthContext";
import usePermissions from "../../hooks/usePermissions";

function Probe({ role, serverPermissions }) {
  const { effectivePermissions, hasPermission, hasAnyPermission } = usePermissions();
  return (
    <div>
      <span data-testid="effective">{effectivePermissions.join(",")}</span>
      <span data-testid="write">{String(hasPermission("WRITE_EQUIPMENT"))}</span>
      <span data-testid="orders">{String(hasPermission("READ_ORDERS"))}</span>
      <span data-testid="any">{String(hasAnyPermission(["SEND_INVOICE", "UPDATE_MAINTENANCE"]))}</span>
    </div>
  );
}

function renderWithAuth({ user = null, permissions = [] } = {}) {
  return render(
    <AuthContext.Provider value={{ user, permissions }}>
      <Probe role={user && user.role} serverPermissions={permissions} />
    </AuthContext.Provider>
  );
}

describe("usePermissions", () => {
  it("uses the server permission list when one is present (admin revocation honored)", () => {
    // Simulates a hospital role whose WRITE_EQUIPMENT was revoked via the RBAC console.
    renderWithAuth({
      user: { id: "u1", role: "hospital" },
      permissions: ["READ_EQUIPMENT", "READ_MAINTENANCE", "READ_ORDERS"],
    });
    expect(screen.getByTestId("effective").textContent).toBe(
      "READ_EQUIPMENT,READ_MAINTENANCE,READ_ORDERS"
    );
    expect(screen.getByTestId("write").textContent).toBe("false");
  });

  it("falls back to the role matrix before the authority fetch answers", () => {
    renderWithAuth({ user: { id: "u1", role: "hospital" }, permissions: [] });
    expect(screen.getByTestId("write").textContent).toBe("true");
    expect(screen.getByTestId("orders").textContent).toBe("true");
  });

  it("grants technicians their baseline matrix", () => {
    renderWithAuth({ user: { id: "u1", role: "technician" }, permissions: [] });
    expect(screen.getByTestId("any").textContent).toBe("true"); // UPDATE_MAINTENANCE held
  });

  it("does not grant supplier-only permissions to a technician", () => {
    renderWithAuth({ user: { id: "u1", role: "technician" }, permissions: [] });
    expect(screen.getByTestId("orders").textContent).toBe("false");
  });

  it("grants only READ_BASIC when there is no user", () => {
    renderWithAuth({ user: null, permissions: [] });
    expect(screen.getByTestId("effective").textContent).toBe("READ_BASIC");
  });
});

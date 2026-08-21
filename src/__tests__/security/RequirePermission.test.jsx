import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AuthContext } from "../../context/AuthContext";
import RequirePermission, { PermissionLocked } from "../../components/common/RequirePermission";

function renderWithPermissions(permissions, ui) {
  return render(
    <AuthContext.Provider value={{ user: { id: "u1", role: "hospital" }, permissions }}>
      {ui}
    </AuthContext.Provider>
  );
}

describe("RequirePermission", () => {
  it("renders children when the permission is held", () => {
    renderWithPermissions(
      ["WRITE_EQUIPMENT"],
      <RequirePermission permission="WRITE_EQUIPMENT">
        <button>Add Equipment</button>
      </RequirePermission>
    );
    expect(screen.getByText("Add Equipment")).toBeInTheDocument();
    expect(screen.queryByText("Permission required")).not.toBeInTheDocument();
  });

  it("renders the locked notice when the permission is missing", () => {
    renderWithPermissions(
      ["READ_EQUIPMENT"],
      <RequirePermission permission="WRITE_EQUIPMENT">
        <button>Add Equipment</button>
      </RequirePermission>
    );
    expect(screen.queryByText("Add Equipment")).not.toBeInTheDocument();
    expect(screen.getByText("Permission required")).toBeInTheDocument();
    expect(screen.getByText(/WRITE_EQUIPMENT/)).toBeInTheDocument();
  });

  it("grants access when anyOf matches at least one held permission", () => {
    renderWithPermissions(
      ["SEND_INVOICE"],
      <RequirePermission anyOf={["WRITE_EQUIPMENT", "SEND_INVOICE"]}>
        <button>Ship It</button>
      </RequirePermission>
    );
    expect(screen.getByText("Ship It")).toBeInTheDocument();
  });

  it("denies access when anyOf matches nothing", () => {
    renderWithPermissions(
      ["READ_EQUIPMENT"],
      <RequirePermission anyOf={["WRITE_EQUIPMENT", "SEND_INVOICE"]}>
        <button>Ship It</button>
      </RequirePermission>
    );
    expect(screen.queryByText("Ship It")).not.toBeInTheDocument();
    expect(screen.getByText("Permission required")).toBeInTheDocument();
  });

  it("passes the missing code to a function fallback", () => {
    let received = null;
    renderWithPermissions(
      ["READ_EQUIPMENT"],
      <RequirePermission
        permission="WRITE_EQUIPMENT"
        fallback={({ permission }) => {
          received = permission;
          return <p data-testid="custom">Custom fallback</p>;
        }}
      >
        <button>Add Equipment</button>
      </RequirePermission>
    );
    expect(received).toBe("WRITE_EQUIPMENT");
    expect(screen.getByTestId("custom")).toBeInTheDocument();
    expect(screen.queryByText("Add Equipment")).not.toBeInTheDocument();
  });

  it("renders nothing when fallback is null", () => {
    renderWithPermissions(
      ["READ_EQUIPMENT"],
      <RequirePermission permission="WRITE_EQUIPMENT" fallback={null}>
        <button>Add Equipment</button>
      </RequirePermission>
    );
    expect(screen.queryByText("Add Equipment")).not.toBeInTheDocument();
    expect(screen.queryByText("Permission required")).not.toBeInTheDocument();
  });

  it("disables rather than hides in disable mode", () => {
    const { container } = renderWithPermissions(
      ["READ_EQUIPMENT"],
      <RequirePermission permission="WRITE_EQUIPMENT" mode="disable">
        <button>Add Equipment</button>
      </RequirePermission>
    );
    expect(screen.getByText("Add Equipment")).toBeInTheDocument();
    const wrapper = container.querySelector("span.opacity-40");
    expect(wrapper).not.toBeNull();
    expect(wrapper.className).toContain("pointer-events-none");
    expect(wrapper.getAttribute("title")).toContain("WRITE_EQUIPMENT");
  });

  it("renders children in disable mode when allowed", () => {
    renderWithPermissions(
      ["WRITE_EQUIPMENT"],
      <RequirePermission permission="WRITE_EQUIPMENT" mode="disable">
        <button>Add Equipment</button>
      </RequirePermission>
    );
    expect(screen.getByText("Add Equipment")).toBeInTheDocument();
  });
});

describe("PermissionLocked", () => {
  it("renders a human-readable message from the metadata", () => {
    render(<PermissionLocked permission="WRITE_EQUIPMENT" />);
    expect(screen.getByText("Permission required")).toBeInTheDocument();
    expect(screen.getByText(/Manage equipment/)).toBeInTheDocument();
  });

  it("honours an explicit message override", () => {
    render(<PermissionLocked permission="WRITE_EQUIPMENT" message="Ask IT." />);
    expect(screen.getByText("Ask IT.")).toBeInTheDocument();
  });

  it("supports a compact inline variant", () => {
    const { container } = render(<PermissionLocked permission="WRITE_EQUIPMENT" compact />);
    expect(container.querySelector("span.inline-flex")).not.toBeNull();
  });
});

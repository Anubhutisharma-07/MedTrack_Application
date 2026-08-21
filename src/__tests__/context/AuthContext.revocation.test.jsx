import { render, screen, act, waitFor } from "@testing-library/react";
import { useEffect, useContext } from "react";
import { it, expect, vi, beforeEach } from "vitest";
import { AuthProvider, AuthContext } from "../../context/AuthContext";
import { getAuthorityVersion } from "../../services/AuthService";

vi.mock("../../services/AuthService", () => ({
  getAuthorityVersion: vi.fn(),
}));

function TestConsumer({ onMount }) {
  const ctx = useContext(AuthContext);
  useEffect(() => { onMount?.(ctx); }, [ctx, onMount]);
  return null;
}

function renderWithProvider(onMount) {
  return render(
    <AuthProvider>
      <TestConsumer onMount={onMount} />
    </AuthProvider>
  );
}

beforeEach(() => {
  sessionStorage.clear();
  vi.clearAllMocks();
});

it("logs out the user when the server bumps the authority version (admin revocation)", async () => {
  // A signed-in user whose stored authority version is 1.
  sessionStorage.setItem(
    "medtrack_user",
    JSON.stringify({ id: "u1", name: "Test", role: "hospital", token: "tok" })
  );
  sessionStorage.setItem(
    "medtrack_authority",
    JSON.stringify({ authorityVersion: 1, permissions: [] })
  );

  // The server reports a HIGHER authority version - an administrator revoked this session.
  getAuthorityVersion.mockResolvedValue({
    authorityVersion: 2,
    permissions: [],
    role: "hospital",
    active: true,
  });

  let ctx;
  renderWithProvider((c) => { ctx = c; });

  // The provider's mount effect polls immediately, so the bump must end the session.
  await waitFor(() => {
    expect(getAuthorityVersion).toHaveBeenCalled();
  });
  await waitFor(() => {
    expect(ctx.user).toBeNull();
  });

  // The session itself must be cleared, not just the in-memory state.
  expect(sessionStorage.getItem("medtrack_user")).toBeNull();
  expect(ctx.revokedReason).toContain("administrator");
});

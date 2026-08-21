import { describe, it, expect, vi, beforeEach } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

const BASE_URL = "http://localhost:8081";

const server = setupServer(
  http.post(`${BASE_URL}/api/auth/login`, () =>
    HttpResponse.json({ token: "real-token", user: { id: "u1", role: "hospital", name: "User" } })
  ),
  http.post(`${BASE_URL}/api/auth/register`, () =>
    HttpResponse.json({ message: "Registration successful" })
  ),
  http.post(`${BASE_URL}/api/auth/forgot-password`, () =>
    HttpResponse.json({ message: "OTP sent" })
  ),
  http.post(`${BASE_URL}/api/auth/verify-otp`, () =>
    HttpResponse.json({ message: "OTP verified" })
  ),
  http.post(`${BASE_URL}/api/auth/reset-password`, () =>
    HttpResponse.json({ message: "Password reset" })
  ),
  http.get(`${BASE_URL}/api/auth/authority/version/:userId`, ({ params }) =>
    HttpResponse.json({
      authorityVersion: 2,
      permissions: ["manage_equipment"],
      role: "hospital",
      active: true,
    })
  ),
  http.post(`${BASE_URL}/api/auth/authority/version/increment`, () =>
    HttpResponse.json({ message: "Authority incremented" })
  ),
  http.post(`${BASE_URL}/api/auth/authority/version/bump-global`, () =>
    HttpResponse.json({ message: "Global authority bumped" })
  ),
  http.get(`${BASE_URL}/api/auth/authority/audit-logs/:userId`, () =>
    HttpResponse.json({ logs: [] })
  ),
);

beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

beforeEach(() => {
  sessionStorage.clear();
});

// Dynamically import AuthService so mock session storage is clear before import
async function loadAuthService() {
  return import("../../services/AuthService");
}

describe("AuthService - Demo Credentials (dev-only)", () => {
  it("returns demo hospital user for correct credentials", async () => {
    const { loginUser } = await loadAuthService();
    const result = await loginUser({
      email: "hospital@medtrack.com",
      password: "admin123",
    });

    expect(result.token).toBeDefined();
    expect(result.user.role).toBe("HOSPITAL");
    expect(result.user.id).toBe("demo-hosp-1");
    expect(result.user.email).toBe("hospital@medtrack.com");
  });

  it("returns demo technician user for correct credentials", async () => {
    const { loginUser } = await loadAuthService();
    const result = await loginUser({
      email: "tech@medtrack.com",
      password: "tech123",
    });

    expect(result.token).toBeDefined();
    expect(result.user.role).toBe("TECHNICIAN");
    expect(result.user.id).toBe("demo-tech-1");
  });

  it("returns demo supplier user for correct credentials", async () => {
    const { loginUser } = await loadAuthService();
    const result = await loginUser({
      email: "supplier@medtrack.com",
      password: "supply123",
    });

    expect(result.token).toBeDefined();
    expect(result.user.role).toBe("SUPPLIER");
    expect(result.user.id).toBe("demo-supp-1");
  });

  it("rejects wrong password for demo email", async () => {
    const { loginUser } = await loadAuthService();
    const result = await loginUser({
      email: "hospital@medtrack.com",
      password: "wrong_password",
    });

    // Falls through to the real API handler
    expect(result.token).toBe("real-token");
  });
});

describe("AuthService - Login", () => {
  it("sends credentials to the backend API", async () => {
    const { loginUser } = await loadAuthService();
    const result = await loginUser({
      email: "user@example.com",
      password: "pass123",
    });

    expect(result.token).toBe("real-token");
    expect(result.user.id).toBe("u1");
  });

  it("rejects when server returns error", async () => {
    server.use(
      http.post(`${BASE_URL}/api/auth/login`, () =>
        HttpResponse.json({ message: "Invalid credentials" }, { status: 401 })
      )
    );

    const { loginUser } = await loadAuthService();
    await expect(
      loginUser({ email: "bad@example.com", password: "wrong" })
    ).rejects.toThrow();
  });
});

describe("AuthService - Registration", () => {
  it("sends registration data to the backend", async () => {
    const { registerUser } = await loadAuthService();
    const result = await registerUser({
      name: "New User",
      email: "new@example.com",
      password: "pass123",
      role: "hospital",
    });

    expect(result.message).toBe("Registration successful");
  });

  it("rejects when server returns error", async () => {
    server.use(
      http.post(`${BASE_URL}/api/auth/register`, () =>
        HttpResponse.json({ message: "Email already exists" }, { status: 409 })
      )
    );

    const { registerUser } = await loadAuthService();
    await expect(
      registerUser({ name: "User", email: "dup@example.com", password: "pass" })
    ).rejects.toThrow();
  });
});

describe("AuthService - Forgot Password", () => {
  it("sends email to trigger OTP", async () => {
    const { forgotPassword } = await loadAuthService();
    const result = await forgotPassword({ email: "user@example.com" });
    expect(result.message).toBe("OTP sent");
  });
});

describe("AuthService - Verify OTP", () => {
  it("sends OTP for verification", async () => {
    const { verifyOtp } = await loadAuthService();
    const result = await verifyOtp({ email: "user@example.com", otp: "123456" });
    expect(result.message).toBe("OTP verified");
  });
});

describe("AuthService - Reset Password", () => {
  it("sends reset password request", async () => {
    const { resetPassword } = await loadAuthService();
    const result = await resetPassword({
      email: "user@example.com",
      otp: "123456",
      newPassword: "newpass123",
    });
    expect(result.message).toBe("Password reset");
  });
});

describe("AuthService - Authority Version", () => {
  it("fetches authority version for a user", async () => {
    const { getAuthorityVersion } = await loadAuthService();
    const result = await getAuthorityVersion("u1");

    expect(result.authorityVersion).toBe(2);
    expect(result.permissions).toContain("manage_equipment");
    expect(result.role).toBe("hospital");
    expect(result.active).toBe(true);
  });

  it("rejects for non-existent user", async () => {
    server.use(
      http.get(`${BASE_URL}/api/auth/authority/version/:userId`, () =>
        HttpResponse.json({ message: "Not found" }, { status: 404 })
      )
    );

    const { getAuthorityVersion } = await loadAuthService();
    await expect(getAuthorityVersion("nonexistent")).rejects.toThrow();
  });
});

describe("AuthService - Increment Authority Version", () => {
  it("increments authority version for targeted user", async () => {
    const { incrementAuthorityVersion } = await loadAuthService();
    const result = await incrementAuthorityVersion({
      userId: "u1",
      reason: "Security audit",
    });
    expect(result.message).toBe("Authority incremented");
  });
});

describe("AuthService - Bump Global Authority Version", () => {
  it("bumps system-wide authority version", async () => {
    const { bumpGlobalAuthorityVersion } = await loadAuthService();
    const result = await bumpGlobalAuthorityVersion({
      reason: "System maintenance",
    });
    expect(result.message).toBe("Global authority bumped");
  });
});

describe("AuthService - Authority Audit Logs", () => {
  it("fetches audit logs for a user", async () => {
    const { getAuthorityAuditLogs } = await loadAuthService();
    const result = await getAuthorityAuditLogs("u1");
    expect(result.logs).toEqual([]);
  });

  it("rejects for unauthorized access", async () => {
    server.use(
      http.get(`${BASE_URL}/api/auth/authority/audit-logs/:userId`, () =>
        HttpResponse.json({ message: "Forbidden" }, { status: 403 })
      )
    );

    const { getAuthorityAuditLogs } = await loadAuthService();
    await expect(getAuthorityAuditLogs("u1")).rejects.toThrow();
  });
});

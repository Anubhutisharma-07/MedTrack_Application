import { describe, it, expect, vi, beforeEach } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

const BASE_URL = "http://localhost:8081";
const server = setupServer(
  http.post(`${BASE_URL}/api/auth/login`, () => HttpResponse.json({ token: "real-token", user: { id: "u1", role: "hospital" } })),
  http.post(`${BASE_URL}/api/auth/register`, () => HttpResponse.json({ message: "Registration successful" })),
  http.post(`${BASE_URL}/api/auth/forgot-password`, () => HttpResponse.json({ message: "OTP sent" })),
  http.post(`${BASE_URL}/api/auth/verify-otp`, () => HttpResponse.json({ message: "OTP verified" })),
  http.post(`${BASE_URL}/api/auth/reset-password`, () => HttpResponse.json({ message: "Password reset" })),
  http.get(`${BASE_URL}/api/auth/authority/version/:userId`, () => HttpResponse.json({ authorityVersion: 2, permissions: ["manage_equipment"], role: "hospital", active: true })),
  http.post(`${BASE_URL}/api/auth/authority/version/increment`, () => HttpResponse.json({ message: "Authority incremented" })),
  http.post(`${BASE_URL}/api/auth/authority/version/bump-global`, () => HttpResponse.json({ message: "Global authority bumped" })),
  http.get(`${BASE_URL}/api/auth/authority/audit-logs/:userId`, () => HttpResponse.json({ logs: [] })),
);
beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
beforeEach(() => { sessionStorage.clear(); });

async function loadAuth() { return import("../../services/AuthService"); }

describe("AuthService - Demo Credentials", () => {
  it("returns demo hospital user", async () => {
    const { loginUser } = await loadAuth();
    const result = await loginUser({ email: "hospital@medtrack.com", password: "admin123" });
    expect(result.token).toBeDefined();
    expect(result.user.role).toBe("HOSPITAL");
    expect(result.user.id).toBe("demo-hosp-1");
  });
  it("returns demo technician user", async () => {
    const { loginUser } = await loadAuth();
    const result = await loginUser({ email: "tech@medtrack.com", password: "tech123" });
    expect(result.user.role).toBe("TECHNICIAN");
    expect(result.user.id).toBe("demo-tech-1");
  });
  it("returns demo supplier user", async () => {
    const { loginUser } = await loadAuth();
    const result = await loginUser({ email: "supplier@medtrack.com", password: "supply123" });
    expect(result.user.role).toBe("SUPPLIER");
    expect(result.user.id).toBe("demo-supp-1");
  });
  it("rejects wrong password for demo email", async () => {
    const { loginUser } = await loadAuth();
    const result = await loginUser({ email: "hospital@medtrack.com", password: "wrong" });
    expect(result.token).toBe("real-token");
  });
});

describe("AuthService - Login", () => {
  it("sends credentials to the backend", async () => {
    const { loginUser } = await loadAuth();
    const result = await loginUser({ email: "user@example.com", password: "pass123" });
    expect(result.token).toBe("real-token");
  });
  it("rejects on server error", async () => {
    server.use(http.post(`${BASE_URL}/api/auth/login`, () => HttpResponse.json({ message: "Invalid" }, { status: 401 })));
    const { loginUser } = await loadAuth();
    await expect(loginUser({ email: "bad@example.com", password: "wrong" })).rejects.toThrow();
  });
});

describe("AuthService - Registration", () => {
  it("sends registration data", async () => {
    const { registerUser } = await loadAuth();
    const result = await registerUser({ name: "New User", email: "new@example.com", password: "pass", role: "hospital" });
    expect(result.message).toBe("Registration successful");
  });
});

describe("AuthService - Forgot/Reset Password", () => {
  it("sends forgot password request", async () => {
    const { forgotPassword } = await loadAuth();
    expect((await forgotPassword({ email: "u@x.com" })).message).toBe("OTP sent");
  });
  it("verifies OTP", async () => {
    const { verifyOtp } = await loadAuth();
    expect((await verifyOtp({ email: "u@x.com", otp: "123456" })).message).toBe("OTP verified");
  });
  it("resets password", async () => {
    const { resetPassword } = await loadAuth();
    expect((await resetPassword({ email: "u@x.com", otp: "123", newPassword: "new" })).message).toBe("Password reset");
  });
});

describe("AuthService - Authority", () => {
  it("fetches authority version", async () => {
    const { getAuthorityVersion } = await loadAuth();
    const result = await getAuthorityVersion("u1");
    expect(result.authorityVersion).toBe(2);
    expect(result.permissions).toContain("manage_equipment");
  });
  it("increments authority version", async () => {
    const { incrementAuthorityVersion } = await loadAuth();
    expect((await incrementAuthorityVersion({ userId: "u1" })).message).toBe("Authority incremented");
  });
  it("bumps global authority version", async () => {
    const { bumpGlobalAuthorityVersion } = await loadAuth();
    expect((await bumpGlobalAuthorityVersion({})).message).toBe("Global authority bumped");
  });
  it("fetches audit logs", async () => {
    const { getAuthorityAuditLogs } = await loadAuth();
    expect((await getAuthorityAuditLogs("u1")).logs).toEqual([]);
  });
});

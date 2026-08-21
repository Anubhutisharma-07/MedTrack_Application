import { describe, it, expect, beforeEach } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

const B = "http://localhost:8081";
const server = setupServer(
  http.post(`${B}/api/auth/mfa/setup/:userId`, () => HttpResponse.json({ secret: "JBSWY3DPEHPK3PXP", uri: "otpauth://totp/MedTrack" })),
  http.post(`${B}/api/auth/mfa/verify`, () => HttpResponse.json({ verified: true })),
  http.get(`${B}/api/auth/mfa/status/:userId`, () => HttpResponse.json({ enabled: true, lastVerified: "2026-01-01" })),
  http.post(`${B}/api/auth/mfa/disable/:userId`, () => HttpResponse.json({ message: "MFA disabled" })),
  http.get(`${B}/api/auth/devices/active/:userId`, () => HttpResponse.json([{ id: "d1", device: "Chrome" }])),
  http.post(`${B}/api/auth/devices/register/:userId`, () => HttpResponse.json({ id: "d-new" })),
  http.post(`${B}/api/auth/devices/revoke`, () => HttpResponse.json({ message: "Revoked" })),
  http.post(`${B}/api/auth/devices/revoke-others/:userId`, () => HttpResponse.json({ message: "Others revoked" })),
);
beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
beforeEach(() => { sessionStorage.clear(); });
async function load() { return import("../../services/MfaService"); }

describe("MfaService", () => {
  it("sets up MFA", async () => {
    const result = await (await load()).setupMfa("u1");
    expect(result.secret).toBeDefined();
    expect(result.uri).toContain("otpauth");
  });
  it("verifies MFA code", async () => {
    const result = await (await load()).verifyMfa({ userId: "u1", code: "123456" });
    expect(result.verified).toBe(true);
  });
  it("gets MFA status", async () => {
    const result = await (await load()).getMfaStatus("u1");
    expect(result.enabled).toBe(true);
  });
  it("disables MFA", async () => {
    const result = await (await load()).disableMfa("u1");
    expect(result.message).toBe("MFA disabled");
  });
  it("gets active devices", async () => {
    const result = await (await load()).getActiveDevices("u1");
    expect(result).toHaveLength(1);
    expect(result[0].device).toBe("Chrome");
  });
  it("registers device session", async () => {
    const result = await (await load()).registerDeviceSession("u1");
    expect(result.id).toBe("d-new");
  });
  it("revokes a device", async () => {
    const result = await (await load()).revokeDeviceSession({ deviceId: "d1" });
    expect(result.message).toBe("Revoked");
  });
  it("revokes all other devices", async () => {
    const result = await (await load()).revokeAllOtherDevices("u1", "d-current");
    expect(result.message).toBe("Others revoked");
  });
  it("rejects on server error", async () => {
    server.use(http.post(`${B}/api/auth/mfa/setup/:userId`, () => HttpResponse.json({}, { status: 500 })));
    await expect((await load()).setupMfa("u1")).rejects.toThrow();
  });
});

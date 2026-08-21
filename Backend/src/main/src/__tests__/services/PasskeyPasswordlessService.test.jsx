import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

const BASE = "http://localhost:8081";
const server = setupServer(
  http.get(`${BASE}/api/auth/passkeys`, () => HttpResponse.json([
    { id: "pk_001", deviceName: "YubiKey 5 NFC", credentialType: "WEBAUTHN", addedAt: "2026-07-01T00:00:00Z", lastUsed: "2026-07-28T10:00:00Z" },
  ])),
  http.get(`${BASE}/api/auth/passkeys/policy`, () => HttpResponse.json({ requirePasskey: false, allowedAuthenticators: ["WEBAUTHN", "FIDO2"], maxKeys: 5 })),
  http.post(`${BASE}/api/auth/passkeys/register/options`, () => HttpResponse.json({ challenge: "abc123challenge", rp: { name: "MedTrack" }, user: { id: "u1" } })),
  http.delete(`${BASE}/api/auth/passkeys/:id`, () => HttpResponse.json({ success: true, deletedAt: "2026-07-28T12:00:00Z" })),
  http.put(`${BASE}/api/auth/passkeys/policy`, () => HttpResponse.json({ success: true, requirePasskey: true })),
);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

let svc;
beforeEach(async () => { vi.resetModules(); svc = await import("../../services/PasskeyPasswordlessService"); });

describe("PasskeyPasswordlessService", () => {
  it("fetches all registered passkeys", async () => {
    const keys = await svc.getAllPasskeys();
    expect(Array.isArray(keys)).toBe(true);
    expect(keys[0].deviceName).toBe("YubiKey 5 NFC");
    expect(keys[0].credentialType).toBe("WEBAUTHN");
  });

  it("returns fallback passkeys on API failure", async () => {
    server.use(http.get(`${BASE}/api/auth/passkeys`, () => HttpResponse.json(null, { status: 500 })));
    const keys = await svc.getAllPasskeys();
    expect(keys[0]).toHaveProperty("id");
    expect(keys[0]).toHaveProperty("deviceName");
  });

  it("fetches passkey policy", async () => {
    const policy = await svc.getPasskeyPolicy();
    expect(policy).toHaveProperty("requirePasskey", false);
    expect(policy).toHaveProperty("maxKeys", 5);
  });

  it("returns fallback policy on API failure", async () => {
    server.use(http.get(`${BASE}/api/auth/passkeys/policy`, () => HttpResponse.json(null, { status: 503 })));
    const policy = await svc.getPasskeyPolicy();
    expect(policy).toHaveProperty("requirePasskey");
    expect(policy).toHaveProperty("allowedAuthenticators");
  });

  it("requests registration options for a new device", async () => {
    const opts = await svc.getRegistrationOptions("iPhone Pro");
    expect(opts).toHaveProperty("challenge", "abc123challenge");
    expect(opts).toHaveProperty("rp");
  });

  it("returns fallback options on API failure", async () => {
    server.use(http.post(`${BASE}/api/auth/passkeys/register/options`, () => HttpResponse.json(null, { status: 500 })));
    const opts = await svc.getRegistrationOptions("Test Device");
    expect(opts).toHaveProperty("challenge");
    expect(opts).toHaveProperty("rp");
  });

  it("deletes a passkey", async () => {
    const result = await svc.deletePasskey("pk_001");
    expect(result).toHaveProperty("success", true);
    expect(result).toHaveProperty("deletedAt");
  });

  it("returns fallback on delete failure", async () => {
    server.use(http.delete(`${BASE}/api/auth/passkeys/:id`, () => HttpResponse.json(null, { status: 500 })));
    const result = await svc.deletePasskey("pk_001");
    expect(result).toHaveProperty("success");
  });

  it("updates passkey policy", async () => {
    const result = await svc.updatePasskeyPolicy({ requirePasskey: true });
    expect(result).toHaveProperty("success", true);
    expect(result).toHaveProperty("requirePasskey", true);
  });

  it("returns fallback on policy update failure", async () => {
    server.use(http.put(`${BASE}/api/auth/passkeys/policy`, () => HttpResponse.json(null, { status: 500 })));
    const result = await svc.updatePasskeyPolicy({ maxKeys: 10 });
    expect(result).toHaveProperty("success");
  });
});

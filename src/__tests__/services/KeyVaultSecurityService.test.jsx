import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

const BASE_URL = "http://localhost:8081";

const server = setupServer(
  http.get(`${BASE_URL}/api/auth/keyvault/secrets`, () =>
    HttpResponse.json([
      { id: "sec_001", name: "db-password", type: "DATABASE", lastRotated: "2026-07-01T00:00:00Z", status: "ACTIVE" },
      { id: "sec_002", name: "api-key", type: "API_KEY", lastRotated: "2026-06-15T00:00:00Z", status: "ACTIVE" },
    ])
  ),
  http.get(`${BASE_URL}/api/auth/keyvault/hsm-status`, () =>
    HttpResponse.json({ hsmHealth: "OPERATIONAL", fipsLevel: "FIPS_140_2_L3", keyCount: 42, lastSelfTest: "2026-07-28T08:00:00Z" })
  ),
  http.post(`${BASE_URL}/api/auth/keyvault/secrets/:id/rotate`, () =>
    HttpResponse.json({ success: true, newKeyVersion: 3, rotatedAt: "2026-07-28T12:00:00Z" })
  ),
  http.post(`${BASE_URL}/api/auth/keyvault/secrets`, () =>
    HttpResponse.json({ id: "sec_new", name: "new-secret", status: "ACTIVE" })
  ),
  http.delete(`${BASE_URL}/api/auth/keyvault/secrets/:id`, () =>
    HttpResponse.json({ success: true, revokedAt: "2026-07-28T13:00:00Z" })
  )
);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

let svc;
beforeEach(async () => {
  vi.resetModules();
  svc = await import("../../services/KeyVaultSecurityService");
});

describe("KeyVaultSecurityService", () => {
  describe("getKeyVaultSecrets", () => {
    it("fetches all vault secrets", async () => {
      const secrets = await svc.getKeyVaultSecrets();
      expect(Array.isArray(secrets)).toBe(true);
      expect(secrets).toHaveLength(2);
      expect(secrets[0].name).toBe("db-password");
      expect(secrets[0].type).toBe("DATABASE");
    });

    it("returns fallback secrets on API failure", async () => {
      server.use(
        http.get(`${BASE_URL}/api/auth/keyvault/secrets`, () => HttpResponse.json(null, { status: 500 }))
      );
      const secrets = await svc.getKeyVaultSecrets();
      expect(Array.isArray(secrets)).toBe(true);
      expect(secrets.length).toBeGreaterThan(0);
      expect(secrets[0]).toHaveProperty("id");
      expect(secrets[0]).toHaveProperty("name");
    });
  });

  describe("getHsmHealthTelemetry", () => {
    it("fetches HSM health status", async () => {
      const status = await svc.getHsmHealthTelemetry();
      expect(status).toHaveProperty("hsmHealth", "OPERATIONAL");
      expect(status).toHaveProperty("fipsLevel", "FIPS_140_2_L3");
      expect(status).toHaveProperty("keyCount", 42);
    });

    it("returns fallback HSM status on API failure", async () => {
      server.use(
        http.get(`${BASE_URL}/api/auth/keyvault/hsm-status`, () => HttpResponse.json(null, { status: 503 }))
      );
      const status = await svc.getHsmHealthTelemetry();
      expect(status).toHaveProperty("hsmHealth");
      expect(status).toHaveProperty("keyCount");
    });
  });

  describe("rotateSecret", () => {
    it("rotates a vault secret and returns new version info", async () => {
      const result = await svc.rotateSecret("sec_001");
      expect(result).toHaveProperty("success", true);
      expect(result).toHaveProperty("newKeyVersion", 3);
      expect(result).toHaveProperty("rotatedAt");
    });

    it("returns fallback on API failure", async () => {
      server.use(
        http.post(`${BASE_URL}/api/auth/keyvault/secrets/:id/rotate`, () => HttpResponse.json(null, { status: 500 }))
      );
      const result = await svc.rotateSecret("sec_001");
      expect(result).toHaveProperty("success");
      expect(result).toHaveProperty("newKeyVersion");
    });
  });

  describe("createSecret", () => {
    it("creates a new vault secret", async () => {
      const result = await svc.createSecret({ name: "new-secret", type: "API_KEY" });
      expect(result).toHaveProperty("id", "sec_new");
      expect(result).toHaveProperty("name", "new-secret");
      expect(result).toHaveProperty("status", "ACTIVE");
    });

    it("returns fallback on API failure", async () => {
      server.use(
        http.post(`${BASE_URL}/api/auth/keyvault/secrets`, () => HttpResponse.json(null, { status: 500 }))
      );
      const result = await svc.createSecret({ name: "fallback" });
      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("status");
    });
  });

  describe("revokeSecret", () => {
    it("revokes a vault secret", async () => {
      const result = await svc.revokeSecret("sec_002");
      expect(result).toHaveProperty("success", true);
      expect(result).toHaveProperty("revokedAt");
    });

    it("returns fallback on API failure", async () => {
      server.use(
        http.delete(`${BASE_URL}/api/auth/keyvault/secrets/:id`, () => HttpResponse.json(null, { status: 500 }))
      );
      const result = await svc.revokeSecret("sec_002");
      expect(result).toHaveProperty("success");
      expect(result).toHaveProperty("revokedAt");
    });
  });
});

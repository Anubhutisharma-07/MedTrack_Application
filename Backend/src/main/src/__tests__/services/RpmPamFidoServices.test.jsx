import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

const BASE = "http://localhost:8081";
const server = setupServer(
  // RPM Telemetry
  http.get(`${BASE}/api/auth/rpm/streams`, () => HttpResponse.json([
    { id: "rpm_001", deviceName: "MRI Room Monitor", streamType: "VITALS", samplingRate: 1000, status: "STREAMING" },
  ])),
  http.post(`${BASE}/api/auth/rpm/streams`, () => HttpResponse.json({ id: "rpm_new", status: "CONFIGURED" })),
  http.post(`${BASE}/api/auth/rpm/streams/:id/scan`, () => HttpResponse.json({ scanId: "scan_001", vulnerabilitiesFound: 0, status: "CLEAN" })),
  // PAM Sessions
  http.get(`${BASE}/api/auth/pam/sessions`, () => HttpResponse.json([
    { id: "pam_001", user: "admin@medtrack.org", targetSystem: "DB-Primary", status: "ACTIVE", startTime: "2026-07-28T10:00:00Z" },
  ])),
  http.post(`${BASE}/api/auth/pam/request-jit`, () => HttpResponse.json({ sessionId: "jit_001", expiresAt: "2026-07-28T11:00:00Z", status: "GRANTED" })),
  http.post(`${BASE}/api/auth/pam/sessions/:id/terminate`, () => HttpResponse.json({ success: true, terminatedAt: "2026-07-28T10:30:00Z" })),
  // FIDO2 WebAuthn
  http.get(`${BASE}/api/auth/fido2/credentials`, () => HttpResponse.json([
    { id: "cred_001", keyName: "YubiKey Bio", keyType: "FIDO2", registeredAt: "2026-06-01T00:00:00Z" },
  ])),
  http.post(`${BASE}/api/auth/fido2/credentials`, () => HttpResponse.json({ id: "cred_new", keyName: "New Key", status: "REGISTERED" })),
  http.post(`${BASE}/api/auth/fido2/simulate-attestation`, () => HttpResponse.json({ attestationObject: "o2Nm...", keyType: "ES256" })),
);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

let rpmSvc, pamSvc, fidoSvc;
beforeEach(async () => {
  vi.resetModules();
  rpmSvc = await import("../../services/RpmTelemetryService");
  pamSvc = await import("../../services/PamSessionService");
  fidoSvc = await import("../../services/Fido2WebAuthnService");
});

describe("RpmTelemetryService", () => {
  it("fetches all RPM telemetry streams", async () => {
    const streams = await rpmSvc.getAllStreams();
    expect(Array.isArray(streams)).toBe(true);
    expect(streams[0].deviceName).toBe("MRI Room Monitor");
    expect(streams[0].samplingRate).toBe(1000);
  });

  it("returns fallback streams on API failure", async () => {
    server.use(http.get(`${BASE}/api/auth/rpm/streams`, () => HttpResponse.json(null, { status: 500 })));
    const streams = await rpmSvc.getAllStreams();
    expect(streams[0]).toHaveProperty("id");
    expect(streams[0]).toHaveProperty("streamType");
  });

  it("registers a new telemetry stream", async () => {
    const result = await rpmSvc.registerStream({ deviceName: "New Device", streamType: "ECG" });
    expect(result).toHaveProperty("id", "rpm_new");
    expect(result).toHaveProperty("status", "CONFIGURED");
  });

  it("returns fallback on register failure", async () => {
    server.use(http.post(`${BASE}/api/auth/rpm/streams`, () => HttpResponse.json(null, { status: 500 })));
    const result = await rpmSvc.registerStream({ deviceName: "Fallback" });
    expect(result).toHaveProperty("id");
  });

  it("runs a security scan on a stream", async () => {
    const result = await rpmSvc.scanStream("rpm_001");
    expect(result).toHaveProperty("scanId", "scan_001");
    expect(result).toHaveProperty("vulnerabilitiesFound", 0);
    expect(result).toHaveProperty("status", "CLEAN");
  });

  it("returns fallback on scan failure", async () => {
    server.use(http.post(`${BASE}/api/auth/rpm/streams/:id/scan`, () => HttpResponse.json(null, { status: 500 })));
    const result = await rpmSvc.scanStream("rpm_001");
    expect(result).toHaveProperty("scanId");
    expect(result).toHaveProperty("status");
  });
});

describe("PamSessionService", () => {
  it("fetches all PAM sessions", async () => {
    const sessions = await pamSvc.getAllSessions();
    expect(Array.isArray(sessions)).toBe(true);
    expect(sessions[0].user).toBe("admin@medtrack.org");
    expect(sessions[0].status).toBe("ACTIVE");
  });

  it("returns fallback sessions on API failure", async () => {
    server.use(http.get(`${BASE}/api/auth/pam/sessions`, () => HttpResponse.json(null, { status: 500 })));
    const sessions = await pamSvc.getAllSessions();
    expect(sessions[0]).toHaveProperty("id");
    expect(sessions[0]).toHaveProperty("status");
  });

  it("requests JIT access", async () => {
    const result = await pamSvc.requestJitAccess({ targetSystem: "DB-Primary", duration: 3600 });
    expect(result).toHaveProperty("sessionId", "jit_001");
    expect(result).toHaveProperty("status", "GRANTED");
    expect(result).toHaveProperty("expiresAt");
  });

  it("returns fallback on JIT request failure", async () => {
    server.use(http.post(`${BASE}/api/auth/pam/request-jit`, () => HttpResponse.json(null, { status: 500 })));
    const result = await pamSvc.requestJitAccess({ targetSystem: "DB-Primary" });
    expect(result).toHaveProperty("sessionId");
    expect(result).toHaveProperty("status");
  });

  it("terminates a PAM session", async () => {
    const result = await pamSvc.terminateSession("pam_001");
    expect(result).toHaveProperty("success", true);
    expect(result).toHaveProperty("terminatedAt");
  });

  it("returns fallback on terminate failure", async () => {
    server.use(http.post(`${BASE}/api/auth/pam/sessions/:id/terminate`, () => HttpResponse.json(null, { status: 500 })));
    const result = await pamSvc.terminateSession("pam_001");
    expect(result).toHaveProperty("success");
    expect(result).toHaveProperty("terminatedAt");
  });
});

describe("Fido2WebAuthnService", () => {
  it("fetches all FIDO2 credentials", async () => {
    const creds = await fidoSvc.getAllCredentials();
    expect(Array.isArray(creds)).toBe(true);
    expect(creds[0].keyName).toBe("YubiKey Bio");
    expect(creds[0].keyType).toBe("FIDO2");
  });

  it("returns fallback credentials on API failure", async () => {
    server.use(http.get(`${BASE}/api/auth/fido2/credentials`, () => HttpResponse.json(null, { status: 500 })));
    const creds = await fidoSvc.getAllCredentials();
    expect(creds[0]).toHaveProperty("id");
    expect(creds[0]).toHaveProperty("keyName");
  });

  it("registers a new FIDO2 credential", async () => {
    const result = await fidoSvc.registerCredential({ keyName: "New Key", keyType: "FIDO2" });
    expect(result).toHaveProperty("id", "cred_new");
    expect(result).toHaveProperty("status", "REGISTERED");
  });

  it("returns fallback on register failure", async () => {
    server.use(http.post(`${BASE}/api/auth/fido2/credentials`, () => HttpResponse.json(null, { status: 500 })));
    const result = await fidoSvc.registerCredential({ keyName: "Fallback" });
    expect(result).toHaveProperty("id");
  });

  it("simulates attestation for a key type", async () => {
    const result = await fidoSvc.simulateAttestation("ES256");
    expect(result).toHaveProperty("attestationObject");
    expect(result).toHaveProperty("keyType", "ES256");
  });

  it("returns fallback on attestation failure", async () => {
    server.use(http.post(`${BASE}/api/auth/fido2/simulate-attestation`, () => HttpResponse.json(null, { status: 500 })));
    const result = await fidoSvc.simulateAttestation("RSA");
    expect(result).toHaveProperty("attestationObject");
    expect(result).toHaveProperty("keyType");
  });
});

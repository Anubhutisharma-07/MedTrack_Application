import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

const BASE_URL = "http://localhost:8081";

const server = setupServer(
  http.get(`${BASE_URL}/api/auth/ztna/tunnels`, () =>
    HttpResponse.json([
      { id: "sdp_tun_9901", peerIp: "192.168.10.45", status: "ESTABLISHED", postureScore: 98 },
    ])
  ),
  http.get(`${BASE_URL}/api/auth/ztna/policies`, () =>
    HttpResponse.json([
      { id: "zt_pol_101", name: "ICU Subnet Isolation", action: "ALLOW_ENCRYPTED_MTLS", status: "ACTIVE" },
    ])
  ),
  http.post(`${BASE_URL}/api/auth/ztna/evaluate-posture`, () =>
    HttpResponse.json({ postureScore: 85, verdict: "PASSED_COMPLIANT" })
  ),
  http.post(`${BASE_URL}/api/auth/ztna/tunnels/:id/terminate`, () =>
    HttpResponse.json({ success: true, message: "Tunnel terminated" })
  ),
  http.get(`${BASE_URL}/api/auth/ztna/governance/policies`, () =>
    HttpResponse.json([
      { id: "gov_001", name: "Data Access Policy", enforcementLevel: "STRICT", enabled: true },
    ])
  ),
  http.post(`${BASE_URL}/api/auth/ztna/governance/policies`, () =>
    HttpResponse.json({ id: "gov_new", name: "New Policy", status: "ACTIVE" })
  ),
  http.get(`${BASE_URL}/api/auth/ztna/governance/evaluations`, () =>
    HttpResponse.json([
      { id: "eval_001", score: 92, verdict: "COMPLIANT", evaluatedAt: "2026-07-28T10:00:00Z" },
    ])
  ),
  http.post(`${BASE_URL}/api/auth/ztna/governance/simulate`, () =>
    HttpResponse.json({ score: 78, verdict: "NEEDS_IMPROVEMENT", recommendations: ["Enable MFA"] })
  )
);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

let networkSvc, governanceSvc;
beforeEach(async () => {
  vi.resetModules();
  networkSvc = await import("../../services/ZeroTrustNetworkService");
  governanceSvc = await import("../../services/ZeroTrustGovernanceService");
});

describe("ZeroTrustNetworkService", () => {
  it("fetches active SDP tunnels", async () => {
    const tunnels = await networkSvc.getActiveSdpTunnels();
    expect(Array.isArray(tunnels)).toBe(true);
    expect(tunnels[0]).toHaveProperty("id", "sdp_tun_9901");
    expect(tunnels[0]).toHaveProperty("status", "ESTABLISHED");
  });

  it("returns fallback tunnels on API failure", async () => {
    server.use(
      http.get(`${BASE_URL}/api/auth/ztna/tunnels`, () => HttpResponse.json(null, { status: 500 }))
    );
    const tunnels = await networkSvc.getActiveSdpTunnels();
    expect(Array.isArray(tunnels)).toBe(true);
    expect(tunnels[0]).toHaveProperty("postureScore");
  });

  it("fetches microsegmentation policies", async () => {
    const policies = await networkSvc.getMicrosegmentPolicies();
    expect(Array.isArray(policies)).toBe(true);
    expect(policies[0].action).toBe("ALLOW_ENCRYPTED_MTLS");
  });

  it("returns fallback policies on API failure", async () => {
    server.use(
      http.get(`${BASE_URL}/api/auth/ztna/policies`, () => HttpResponse.json(null, { status: 503 }))
    );
    const policies = await networkSvc.getMicrosegmentPolicies();
    expect(policies[0]).toHaveProperty("action");
  });

  it("evaluates device posture via API", async () => {
    const result = await networkSvc.evaluateDevicePosture({
      edrRunning: true, diskEncrypted: true, osPatchOutdated: false, firewallEnabled: true
    });
    expect(result).toHaveProperty("postureScore", 85);
    expect(result).toHaveProperty("verdict", "PASSED_COMPLIANT");
  });

  it("returns local evaluation on API failure", async () => {
    server.use(
      http.post(`${BASE_URL}/api/auth/ztna/evaluate-posture`, () => HttpResponse.json(null, { status: 500 }))
    );
    const result = await networkSvc.evaluateDevicePosture({
      edrRunning: true, diskEncrypted: false, osPatchOutdated: true, firewallEnabled: true
    });
    expect(result).toHaveProperty("postureScore");
    expect(result).toHaveProperty("verdict");
    expect(result.checksPassed.length).toBe(3);
  });

  it("calculates fallback score for compliant device", async () => {
    server.use(
      http.post(`${BASE_URL}/api/auth/ztna/evaluate-posture`, () => HttpResponse.json(null, { status: 500 }))
    );
    const result = await networkSvc.evaluateDevicePosture({
      edrRunning: true, diskEncrypted: true, osPatchOutdated: false, firewallEnabled: true
    });
    expect(result.postureScore).toBe(100);
    expect(result.verdict).toBe("PASSED_COMPLIANT");
  });

  it("calculates fallback score for non-compliant device", async () => {
    server.use(
      http.post(`${BASE_URL}/api/auth/ztna/evaluate-posture`, () => HttpResponse.json(null, { status: 500 }))
    );
    const result = await networkSvc.evaluateDevicePosture({
      edrRunning: false, diskEncrypted: false, osPatchOutdated: true, firewallEnabled: false
    });
    expect(result.postureScore).toBe(10);
    expect(result.verdict).toBe("QUARANTINE_REQUIRED");
  });

  it("terminates an SDP tunnel", async () => {
    const result = await networkSvc.terminateSdpTunnel("sdp_tun_9901");
    expect(result).toHaveProperty("success", true);
  });

  it("returns fallback on terminate API failure", async () => {
    server.use(
      http.post(`${BASE_URL}/api/auth/ztna/tunnels/:id/terminate`, () => HttpResponse.json(null, { status: 500 }))
    );
    const result = await networkSvc.terminateSdpTunnel("sdp_tun_9901");
    expect(result).toHaveProperty("success", true);
    expect(result).toHaveProperty("tunnelId", "sdp_tun_9901");
  });
});

describe("ZeroTrustGovernanceService", () => {
  it("fetches governance policies", async () => {
    const policies = await governanceSvc.getGovernancePolicies();
    expect(Array.isArray(policies)).toBe(true);
    expect(policies[0].name).toBe("Data Access Policy");
  });

  it("returns fallback governance policies on API failure", async () => {
    server.use(
      http.get(`${BASE_URL}/api/auth/ztna/governance/policies`, () => HttpResponse.json(null, { status: 500 }))
    );
    const policies = await governanceSvc.getGovernancePolicies();
    expect(policies[0]).toHaveProperty("name");
  });

  it("creates a governance policy", async () => {
    const result = await governanceSvc.createGovernancePolicy({ name: "New" });
    expect(result).toHaveProperty("id", "gov_new");
    expect(result).toHaveProperty("status", "ACTIVE");
  });

  it("returns fallback on create policy API failure", async () => {
    server.use(
      http.post(`${BASE_URL}/api/auth/ztna/governance/policies`, () => HttpResponse.json(null, { status: 500 }))
    );
    const result = await governanceSvc.createGovernancePolicy({ name: "Fallback" });
    expect(result).toHaveProperty("id");
  });

  it("fetches trust evaluations", async () => {
    const evals = await governanceSvc.getActiveTrustEvaluations();
    expect(Array.isArray(evals)).toBe(true);
    expect(evals[0]).toHaveProperty("score", 92);
    expect(evals[0]).toHaveProperty("verdict", "COMPLIANT");
  });

  it("returns fallback evaluations on API failure", async () => {
    server.use(
      http.get(`${BASE_URL}/api/auth/ztna/governance/evaluations`, () => HttpResponse.json(null, { status: 503 }))
    );
    const evals = await governanceSvc.getActiveTrustEvaluations();
    expect(evals[0]).toHaveProperty("score");
  });

  it("runs trust simulation", async () => {
    const result = await governanceSvc.evaluateTrustSimulation({ devicePosture: 85 });
    expect(result).toHaveProperty("score");
    expect(result).toHaveProperty("verdict");
    expect(result).toHaveProperty("recommendations");
  });

  it("returns fallback on simulation API failure", async () => {
    server.use(
      http.post(`${BASE_URL}/api/auth/ztna/governance/simulate`, () => HttpResponse.json(null, { status: 500 }))
    );
    const result = await governanceSvc.evaluateTrustSimulation({ devicePosture: 50 });
    expect(result).toHaveProperty("recommendations");
  });
});

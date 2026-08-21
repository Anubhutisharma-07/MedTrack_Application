import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

const BASE_URL = "http://localhost:8081";

const server = setupServer(
  // DlpPrivacyGuardService handlers
  http.get(`${BASE_URL}/api/auth/dlp/rules`, () =>
    HttpResponse.json([
      { id: "dlp_r1", name: "PHI Blocking", status: "ACTIVE", pattern: "\\b[A-Z]{3}-\\d{4}\\b", action: "BLOCK" },
      { id: "dlp_r2", name: "PII Redaction", status: "DISABLED", pattern: "\\d{3}-\\d{2}-\\d{4}", action: "REDACT" },
    ])
  ),
  http.get(`${BASE_URL}/api/auth/dlp/incidents`, () =>
    HttpResponse.json([
      { id: "dlp_i1", timestamp: "2026-07-28T09:00:00Z", ruleId: "dlp_r1", severity: "HIGH", sourceUser: "jane@medtrack.org", destination: "external_email" },
    ])
  ),
  http.put(`${BASE_URL}/api/auth/dlp/rules/:id`, () =>
    HttpResponse.json({ success: true, status: "ACTIVE" })
  ),
  http.post(`${BASE_URL}/api/auth/dlp/simulate-masking`, () =>
    HttpResponse.json({ masked: "SSN-***-**-1234", original_length: 11, algorithm: "PARTIAL_REDACT" })
  ),
  // GrcAuditComplianceService handlers
  http.get(`${BASE_URL}/api/auth/grc/frameworks`, () =>
    HttpResponse.json([
      { id: "fw_001", name: "HIPAA Security Rule", score: 87, controlCount: 42, compliantCount: 37 },
      { id: "fw_002", name: "NIST CSF 2.0", score: 72, controlCount: 108, compliantCount: 78 },
    ])
  ),
  http.get(`${BASE_URL}/api/auth/grc/evidence`, () =>
    HttpResponse.json([
      { id: "ev_001", controlId: "ctrl_01", framework: "HIPAA", evidenceType: "POLICY_DOCUMENT", status: "APPROVED", uploadedBy: "admin" },
    ])
  ),
  http.post(`${BASE_URL}/api/auth/grc/evaluate/:id`, () =>
    HttpResponse.json({ controlId: "ctrl_01", evaluationResult: "PASSING", score: 95 })
  ),
  http.post(`${BASE_URL}/api/auth/grc/reports/generate`, () =>
    HttpResponse.json({ reportId: "rpt_001", downloadUrl: "https://cdn.example.com/grc-report.pdf" })
  )
);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

let dlpSvc, grcSvc;
beforeEach(async () => {
  vi.resetModules();
  dlpSvc = await import("../../services/DlpPrivacyGuardService");
  grcSvc = await import("../../services/GrcAuditComplianceService");
});

describe("DlpPrivacyGuardService", () => {
  it("fetches all DLP rules", async () => {
    const rules = await dlpSvc.getDlpRules();
    expect(Array.isArray(rules)).toBe(true);
    expect(rules).toHaveLength(2);
    expect(rules[0].name).toBe("PHI Blocking");
    expect(rules[0].status).toBe("ACTIVE");
    expect(rules[0].action).toBe("BLOCK");
  });

  it("returns fallback DLP rules on API failure", async () => {
    server.use(
      http.get(`${BASE_URL}/api/auth/dlp/rules`, () => HttpResponse.json(null, { status: 500 }))
    );
    const rules = await dlpSvc.getDlpRules();
    expect(Array.isArray(rules)).toBe(true);
    expect(rules.length).toBeGreaterThan(0);
    expect(rules[0]).toHaveProperty("id");
    expect(rules[0]).toHaveProperty("name");
    expect(rules[0]).toHaveProperty("status");
  });

  it("fetches all DLP incidents", async () => {
    const incidents = await dlpSvc.getDlpIncidents();
    expect(Array.isArray(incidents)).toBe(true);
    expect(incidents[0]).toHaveProperty("id", "dlp_i1");
    expect(incidents[0]).toHaveProperty("severity", "HIGH");
    expect(incidents[0]).toHaveProperty("sourceUser");
  });

  it("returns fallback DLP incidents on API failure", async () => {
    server.use(
      http.get(`${BASE_URL}/api/auth/dlp/incidents`, () => HttpResponse.json(null, { status: 503 }))
    );
    const incidents = await dlpSvc.getDlpIncidents();
    expect(Array.isArray(incidents)).toBe(true);
    expect(incidents.length).toBeGreaterThan(0);
    expect(incidents[0]).toHaveProperty("id");
    expect(incidents[0]).toHaveProperty("severity");
  });

  it("toggles a DLP rule status", async () => {
    const result = await dlpSvc.toggleDlpRule("dlp_r1", "ACTIVE");
    expect(result).toHaveProperty("success", true);
    expect(result).toHaveProperty("status", "ACTIVE");
  });

  it("returns fallback when toggling DLP rule fails", async () => {
    server.use(
      http.put(`${BASE_URL}/api/auth/dlp/rules/:id`, () => HttpResponse.json(null, { status: 500 }))
    );
    const result = await dlpSvc.toggleDlpRule("dlp_r2", "ENABLED");
    expect(result).toHaveProperty("success");
    expect(result).toHaveProperty("status");
  });

  it("simulates text masking via DLP engine", async () => {
    const result = await dlpSvc.simulateTextMasking("My SSN is 123-45-6789");
    expect(result).toHaveProperty("masked");
    expect(result).toHaveProperty("original_length");
    expect(result).toHaveProperty("algorithm", "PARTIAL_REDACT");
  });

  it("returns fallback masking on API failure", async () => {
    server.use(
      http.post(`${BASE_URL}/api/auth/dlp/simulate-masking`, () => HttpResponse.json(null, { status: 500 }))
    );
    const result = await dlpSvc.simulateTextMasking("Test data");
    expect(result).toHaveProperty("masked");
    expect(result).toHaveProperty("algorithm");
  });
});

describe("GrcAuditComplianceService", () => {
  it("fetches framework compliance scores", async () => {
    const frameworks = await grcSvc.getGrcFrameworkScores();
    expect(Array.isArray(frameworks)).toBe(true);
    expect(frameworks).toHaveLength(2);
    expect(frameworks[0].name).toBe("HIPAA Security Rule");
    expect(frameworks[0].score).toBe(87);
    expect(frameworks[0].controlCount).toBe(42);
  });

  it("returns fallback frameworks on API failure", async () => {
    server.use(
      http.get(`${BASE_URL}/api/auth/grc/frameworks`, () => HttpResponse.json(null, { status: 500 }))
    );
    const frameworks = await grcSvc.getGrcFrameworkScores();
    expect(Array.isArray(frameworks)).toBe(true);
    expect(frameworks.length).toBeGreaterThan(0);
    expect(frameworks[0]).toHaveProperty("name");
    expect(frameworks[0]).toHaveProperty("score");
  });

  it("fetches audit evidence ledger", async () => {
    const evidence = await grcSvc.getAuditEvidenceLedger();
    expect(Array.isArray(evidence)).toBe(true);
    expect(evidence[0]).toHaveProperty("id", "ev_001");
    expect(evidence[0]).toHaveProperty("controlId");
    expect(evidence[0]).toHaveProperty("framework", "HIPAA");
    expect(evidence[0]).toHaveProperty("status", "APPROVED");
  });

  it("returns fallback evidence on API failure", async () => {
    server.use(
      http.get(`${BASE_URL}/api/auth/grc/evidence`, () => HttpResponse.json(null, { status: 503 }))
    );
    const evidence = await grcSvc.getAuditEvidenceLedger();
    expect(Array.isArray(evidence)).toBe(true);
    expect(evidence.length).toBeGreaterThan(0);
    expect(evidence[0]).toHaveProperty("id");
    expect(evidence[0]).toHaveProperty("controlId");
  });

  it("evaluates control evidence for a given control", async () => {
    const result = await grcSvc.evaluateControlEvidence("ctrl_01");
    expect(result).toHaveProperty("controlId", "ctrl_01");
    expect(result).toHaveProperty("evaluationResult", "PASSING");
    expect(result).toHaveProperty("score", 95);
  });

  it("returns fallback evaluation on API failure", async () => {
    server.use(
      http.post(`${BASE_URL}/api/auth/grc/evaluate/:id`, () => HttpResponse.json(null, { status: 500 }))
    );
    const result = await grcSvc.evaluateControlEvidence("ctrl_02");
    expect(result).toHaveProperty("controlId");
    expect(result).toHaveProperty("evaluationResult");
    expect(result).toHaveProperty("score");
  });

  it("generates a compliance report", async () => {
    const result = await grcSvc.generateComplianceReport("fw_001");
    expect(result).toHaveProperty("reportId", "rpt_001");
    expect(result).toHaveProperty("downloadUrl");
  });

  it("returns fallback report generation on API failure", async () => {
    server.use(
      http.post(`${BASE_URL}/api/auth/grc/reports/generate`, () => HttpResponse.json(null, { status: 500 }))
    );
    const result = await grcSvc.generateComplianceReport("fw_002");
    expect(result).toHaveProperty("reportId");
    expect(result).toHaveProperty("downloadUrl");
  });
});

import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

const BASE = "http://localhost:8081";

const server = setupServer(
  http.get(`${BASE}/api/auth/dlp/rules`, () => HttpResponse.json([
    { id: "dlp_r1", name: "PHI Blocking", status: "ACTIVE", pattern: "test", action: "BLOCK" },
    { id: "dlp_r2", name: "PII Redaction", status: "DISABLED", pattern: "ssn", action: "REDACT" },
  ])),
  http.get(`${BASE}/api/auth/dlp/incidents`, () => HttpResponse.json([
    { id: "dlp_i1", severity: "HIGH", sourceUser: "jane@medtrack.org", ruleId: "dlp_r1" },
  ])),
  http.put(`${BASE}/api/auth/dlp/rules/:id`, () => HttpResponse.json({ success: true, status: "ACTIVE" })),
  http.post(`${BASE}/api/auth/dlp/simulate-masking`, () => HttpResponse.json({ masked: "SSN-***-1234", original_length: 11, algorithm: "PARTIAL_REDACT" })),
  http.get(`${BASE}/api/auth/grc/frameworks`, () => HttpResponse.json([
    { id: "fw_001", name: "HIPAA", score: 87, controlCount: 42, compliantCount: 37 },
    { id: "fw_002", name: "NIST CSF", score: 72, controlCount: 108, compliantCount: 78 },
  ])),
  http.get(`${BASE}/api/auth/grc/evidence`, () => HttpResponse.json([
    { id: "ev_001", controlId: "ctrl_01", framework: "HIPAA", status: "APPROVED" },
  ])),
  http.post(`${BASE}/api/auth/grc/evaluate/:id`, () => HttpResponse.json({ controlId: "ctrl_01", evaluationResult: "PASSING", score: 95 })),
  http.post(`${BASE}/api/auth/grc/reports/generate`, () => HttpResponse.json({ reportId: "rpt_001", downloadUrl: "https://cdn.example.com/report.pdf" }))
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
  });

  it("returns fallback rules on API failure", async () => {
    server.use(http.get(`${BASE}/api/auth/dlp/rules`, () => HttpResponse.json(null, { status: 500 })));
    const rules = await dlpSvc.getDlpRules();
    expect(Array.isArray(rules)).toBe(true);
    expect(rules[0]).toHaveProperty("id");
    expect(rules[0]).toHaveProperty("name");
  });

  it("fetches DLP incidents", async () => {
    const incidents = await dlpSvc.getDlpIncidents();
    expect(Array.isArray(incidents)).toBe(true);
    expect(incidents[0]).toHaveProperty("id", "dlp_i1");
    expect(incidents[0]).toHaveProperty("severity", "HIGH");
  });

  it("returns fallback incidents on API failure", async () => {
    server.use(http.get(`${BASE}/api/auth/dlp/incidents`, () => HttpResponse.json(null, { status: 503 })));
    const incidents = await dlpSvc.getDlpIncidents();
    expect(incidents[0]).toHaveProperty("id");
    expect(incidents[0]).toHaveProperty("severity");
  });

  it("toggles a DLP rule status", async () => {
    const result = await dlpSvc.toggleDlpRule("dlp_r1", "ACTIVE");
    expect(result).toHaveProperty("success", true);
    expect(result).toHaveProperty("status", "ACTIVE");
  });

  it("returns fallback when toggle fails", async () => {
    server.use(http.put(`${BASE}/api/auth/dlp/rules/:id`, () => HttpResponse.json(null, { status: 500 })));
    const result = await dlpSvc.toggleDlpRule("dlp_r2", "ENABLED");
    expect(result).toHaveProperty("success");
    expect(result).toHaveProperty("status");
  });

  it("simulates text masking", async () => {
    const result = await dlpSvc.simulateTextMasking("My SSN is 123-45-6789");
    expect(result).toHaveProperty("masked");
    expect(result).toHaveProperty("algorithm", "PARTIAL_REDACT");
  });

  it("returns fallback masking on API failure", async () => {
    server.use(http.post(`${BASE}/api/auth/dlp/simulate-masking`, () => HttpResponse.json(null, { status: 500 })));
    const result = await dlpSvc.simulateTextMasking("Test");
    expect(result).toHaveProperty("masked");
    expect(result).toHaveProperty("algorithm");
  });
});

describe("GrcAuditComplianceService", () => {
  it("fetches framework compliance scores", async () => {
    const fw = await grcSvc.getGrcFrameworkScores();
    expect(Array.isArray(fw)).toBe(true);
    expect(fw).toHaveLength(2);
    expect(fw[0].name).toBe("HIPAA");
    expect(fw[0].score).toBe(87);
  });

  it("returns fallback frameworks on API failure", async () => {
    server.use(http.get(`${BASE}/api/auth/grc/frameworks`, () => HttpResponse.json(null, { status: 500 })));
    const fw = await grcSvc.getGrcFrameworkScores();
    expect(fw[0]).toHaveProperty("name");
    expect(fw[0]).toHaveProperty("score");
  });

  it("fetches audit evidence ledger", async () => {
    const ev = await grcSvc.getAuditEvidenceLedger();
    expect(Array.isArray(ev)).toBe(true);
    expect(ev[0]).toHaveProperty("id", "ev_001");
    expect(ev[0]).toHaveProperty("status", "APPROVED");
  });

  it("returns fallback evidence on API failure", async () => {
    server.use(http.get(`${BASE}/api/auth/grc/evidence`, () => HttpResponse.json(null, { status: 503 })));
    const ev = await grcSvc.getAuditEvidenceLedger();
    expect(ev[0]).toHaveProperty("id");
    expect(ev[0]).toHaveProperty("controlId");
  });

  it("evaluates control evidence", async () => {
    const result = await grcSvc.evaluateControlEvidence("ctrl_01");
    expect(result).toHaveProperty("evaluationResult", "PASSING");
    expect(result).toHaveProperty("score", 95);
  });

  it("returns fallback evaluation on API failure", async () => {
    server.use(http.post(`${BASE}/api/auth/grc/evaluate/:id`, () => HttpResponse.json(null, { status: 500 })));
    const result = await grcSvc.evaluateControlEvidence("ctrl_02");
    expect(result).toHaveProperty("evaluationResult");
    expect(result).toHaveProperty("score");
  });

  it("generates a compliance report", async () => {
    const result = await grcSvc.generateComplianceReport("fw_001");
    expect(result).toHaveProperty("reportId", "rpt_001");
    expect(result).toHaveProperty("downloadUrl");
  });

  it("returns fallback report on API failure", async () => {
    server.use(http.post(`${BASE}/api/auth/grc/reports/generate`, () => HttpResponse.json(null, { status: 500 })));
    const result = await grcSvc.generateComplianceReport("fw_002");
    expect(result).toHaveProperty("reportId");
    expect(result).toHaveProperty("downloadUrl");
  });
});

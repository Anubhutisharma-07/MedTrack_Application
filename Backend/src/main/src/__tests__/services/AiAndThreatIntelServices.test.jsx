import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

const BASE = "http://localhost:8081";
const server = setupServer(
  http.get(`${BASE}/api/auth/ai/models`, () => HttpResponse.json([
    { id: "ai_001", modelName: "DiagnosisAssist-v2", modelType: "CLASSIFIER", accuracy: 0.94, fairnessStatus: "PENDING_AUDIT" },
  ])),
  http.post(`${BASE}/api/auth/ai/models`, () => HttpResponse.json({ id: "ai_new", modelName: "NewModel", status: "REGISTERED" })),
  http.post(`${BASE}/api/auth/ai/models/:id/fairness-audit`, () => HttpResponse.json({ auditId: "audit_001", status: "PASSING", biasScore: 0.02 })),
  http.get(`${BASE}/api/auth/threat-intel/feeds`, () => HttpResponse.json([
    { id: "feed_001", feedName: "NVD CVE", feedType: "VULNERABILITY", lastSync: "2026-07-28T06:00:00Z", indicatorCount: 4521 },
  ])),
  http.post(`${BASE}/api/auth/threat-intel/feeds`, () => HttpResponse.json({ id: "feed_new", feedName: "Custom Feed", status: "ACTIVE" })),
  http.post(`${BASE}/api/auth/threat-intel/taxii-sync`, () => HttpResponse.json({ success: true, syncedIndicators: 142, syncTime: "2026-07-28T12:00:00Z" })),
);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

let aiSvc, tiSvc;
beforeEach(async () => {
  vi.resetModules();
  aiSvc = await import("../../services/AiModelGovernanceService");
  tiSvc = await import("../../services/ThreatIntelService");
});

describe("AiModelGovernanceService", () => {
  it("fetches all registered AI models", async () => {
    const models = await aiSvc.getAllModels();
    expect(Array.isArray(models)).toBe(true);
    expect(models[0].modelName).toBe("DiagnosisAssist-v2");
    expect(models[0].accuracy).toBe(0.94);
  });

  it("returns fallback models on API failure", async () => {
    server.use(http.get(`${BASE}/api/auth/ai/models`, () => HttpResponse.json(null, { status: 500 })));
    const models = await aiSvc.getAllModels();
    expect(models[0]).toHaveProperty("id");
    expect(models[0]).toHaveProperty("modelName");
  });

  it("registers a new AI model", async () => {
    const result = await aiSvc.registerModel({ modelName: "NewModel", modelType: "REGRESSOR" });
    expect(result).toHaveProperty("id", "ai_new");
    expect(result).toHaveProperty("status", "REGISTERED");
  });

  it("returns fallback on register failure", async () => {
    server.use(http.post(`${BASE}/api/auth/ai/models`, () => HttpResponse.json(null, { status: 500 })));
    const result = await aiSvc.registerModel({ modelName: "Fallback" });
    expect(result).toHaveProperty("id");
  });

  it("runs fairness audit on a model", async () => {
    const result = await aiSvc.runFairnessAudit("ai_001", "gender");
    expect(result).toHaveProperty("auditId", "audit_001");
    expect(result).toHaveProperty("status", "PASSING");
    expect(result).toHaveProperty("biasScore", 0.02);
  });

  it("returns fallback on audit failure", async () => {
    server.use(http.post(`${BASE}/api/auth/ai/models/:id/fairness-audit`, () => HttpResponse.json(null, { status: 500 })));
    const result = await aiSvc.runFairnessAudit("ai_001", "age");
    expect(result).toHaveProperty("auditId");
    expect(result).toHaveProperty("biasScore");
  });
});

describe("ThreatIntelService", () => {
  it("fetches all threat intelligence feeds", async () => {
    const feeds = await tiSvc.getAllFeeds();
    expect(Array.isArray(feeds)).toBe(true);
    expect(feeds[0].feedName).toBe("NVD CVE");
    expect(feeds[0].indicatorCount).toBe(4521);
  });

  it("returns fallback feeds on API failure", async () => {
    server.use(http.get(`${BASE}/api/auth/threat-intel/feeds`, () => HttpResponse.json(null, { status: 500 })));
    const feeds = await tiSvc.getAllFeeds();
    expect(feeds[0]).toHaveProperty("id");
    expect(feeds[0]).toHaveProperty("feedName");
  });

  it("creates a new threat intel feed", async () => {
    const result = await tiSvc.createFeed({ feedName: "Custom Feed", feedType: "IOC" });
    expect(result).toHaveProperty("id", "feed_new");
    expect(result).toHaveProperty("status", "ACTIVE");
  });

  it("returns fallback on feed creation failure", async () => {
    server.use(http.post(`${BASE}/api/auth/threat-intel/feeds`, () => HttpResponse.json(null, { status: 500 })));
    const result = await tiSvc.createFeed({ feedName: "Fallback" });
    expect(result).toHaveProperty("id");
  });

  it("triggers TAXII sync", async () => {
    const result = await tiSvc.triggerTaxiiSync();
    expect(result).toHaveProperty("success", true);
    expect(result).toHaveProperty("syncedIndicators", 142);
  });

  it("returns fallback on TAXII sync failure", async () => {
    server.use(http.post(`${BASE}/api/auth/threat-intel/taxii-sync`, () => HttpResponse.json(null, { status: 500 })));
    const result = await tiSvc.triggerTaxiiSync();
    expect(result).toHaveProperty("success");
    expect(result).toHaveProperty("syncedIndicators");
  });
});

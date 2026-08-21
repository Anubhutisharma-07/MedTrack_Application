import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

const BASE = "http://localhost:8081";
const server = setupServer(
  http.get(`${BASE}/api/auth/ir/playbooks`, () => HttpResponse.json([
    { id: "pb_01", name: "Ransomware Containment", triggerCondition: "severity == CRITICAL", steps: ["isolate", "notify", "restore"] },
  ])),
  http.get(`${BASE}/api/auth/ir/incidents`, () => HttpResponse.json([
    { id: "inc_001", title: "Data Breach Detected", severity: "CRITICAL", status: "OPEN", assignedTeam: "SOC" },
  ])),
  http.post(`${BASE}/api/auth/ir/playbooks/:id/execute`, () => HttpResponse.json({ success: true, executionId: "exec_001", status: "RUNNING" })),
  http.get(`${BASE}/api/auth/ir/incidents/:id/export`, () => HttpResponse.json({ downloadUrl: "https://cdn.example.com/inc-export.pdf", format: "PDF" })),
);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

let svc;
beforeEach(async () => { vi.resetModules(); svc = await import("../../services/IncidentResponsePlaybookService"); });

describe("IncidentResponsePlaybookService", () => {
  it("fetches all incident response playbooks", async () => {
    const pbs = await svc.getAllPlaybooks();
    expect(Array.isArray(pbs)).toBe(true);
    expect(pbs[0].name).toBe("Ransomware Containment");
    expect(pbs[0].steps).toHaveLength(3);
  });

  it("returns fallback playbooks on API failure", async () => {
    server.use(http.get(`${BASE}/api/auth/ir/playbooks`, () => HttpResponse.json(null, { status: 500 })));
    const pbs = await svc.getAllPlaybooks();
    expect(Array.isArray(pbs)).toBe(true);
    expect(pbs[0]).toHaveProperty("id");
    expect(pbs[0]).toHaveProperty("name");
  });

  it("fetches all incidents", async () => {
    const incs = await svc.getAllIncidents();
    expect(Array.isArray(incs)).toBe(true);
    expect(incs[0]).toHaveProperty("id", "inc_001");
    expect(incs[0]).toHaveProperty("severity", "CRITICAL");
  });

  it("returns fallback incidents on API failure", async () => {
    server.use(http.get(`${BASE}/api/auth/ir/incidents`, () => HttpResponse.json(null, { status: 503 })));
    const incs = await svc.getAllIncidents();
    expect(incs[0]).toHaveProperty("id");
    expect(incs[0]).toHaveProperty("status");
  });

  it("executes a playbook against a target entity", async () => {
    const result = await svc.executePlaybook("pb_01", "inc_001");
    expect(result).toHaveProperty("success", true);
    expect(result).toHaveProperty("executionId", "exec_001");
  });

  it("returns fallback on execute failure", async () => {
    server.use(http.post(`${BASE}/api/auth/ir/playbooks/:id/execute`, () => HttpResponse.json(null, { status: 500 })));
    const result = await svc.executePlaybook("pb_01", "inc_001");
    expect(result).toHaveProperty("success");
    expect(result).toHaveProperty("executionId");
  });

  it("exports an incident report", async () => {
    const result = await svc.exportIncident("inc_001");
    expect(result).toHaveProperty("downloadUrl");
    expect(result).toHaveProperty("format", "PDF");
  });

  it("returns fallback on export failure", async () => {
    server.use(http.get(`${BASE}/api/auth/ir/incidents/:id/export`, () => HttpResponse.json(null, { status: 500 })));
    const result = await svc.exportIncident("inc_001");
    expect(result).toHaveProperty("downloadUrl");
    expect(result).toHaveProperty("format");
  });
});

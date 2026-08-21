import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

const BASE_URL = "http://localhost:8081";

const server = setupServer(
  http.get(`${BASE_URL}/api/auth/threats/events`, () =>
    HttpResponse.json([
      { id: "evt_101", threatType: "BRUTE_FORCE", severity: "CRITICAL", status: "ACTIVE" },
      { id: "evt_102", threatType: "IMPOSSIBLE_TRAVEL", severity: "HIGH", status: "INVESTIGATING" },
    ])
  ),
  http.get(`${BASE_URL}/api/auth/threats/playbooks`, () =>
    HttpResponse.json([
      { id: "pb_01", name: "Brute Force Response", enabled: true },
      { id: "pb_02", name: "Token Invalidation", enabled: false },
    ])
  ),
  http.post(`${BASE_URL}/api/auth/threats/playbooks/:id/execute`, () =>
    HttpResponse.json({ success: true, executionId: "exec_001" })
  ),
  http.patch(`${BASE_URL}/api/auth/threats/playbooks/:id/toggle`, () =>
    HttpResponse.json({ success: true, enabled: true })
  ),
  http.post(`${BASE_URL}/api/auth/threats/simulate`, () =>
    HttpResponse.json({ incidentId: "sim_001", severity: "HIGH" })
  ),
  http.patch(`${BASE_URL}/api/auth/threats/events/:id/status`, () =>
    HttpResponse.json({ success: true, newStatus: "RESOLVED" })
  )
);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

let svc;
beforeEach(async () => {
  vi.resetModules();
  svc = await import("../../services/ThreatDetectionService");
});

describe("ThreatDetectionService", () => {
  describe("getActiveThreatEvents", () => {
    it("fetches live threat events from the API", async () => {
      const events = await svc.getActiveThreatEvents();
      expect(Array.isArray(events)).toBe(true);
      expect(events).toHaveLength(2);
      expect(events[0].id).toBe("evt_101");
      expect(events[0].threatType).toBe("BRUTE_FORCE");
      expect(events[0].severity).toBe("CRITICAL");
    });

    it("returns fallback data when API is unavailable", async () => {
      server.use(
        http.get(`${BASE_URL}/api/auth/threats/events`, () =>
          HttpResponse.json(null, { status: 500 })
        )
      );
      const events = await svc.getActiveThreatEvents();
      expect(Array.isArray(events)).toBe(true);
      expect(events.length).toBeGreaterThan(0);
      expect(events[0]).toHaveProperty("id");
      expect(events[0]).toHaveProperty("threatType");
      expect(events[0]).toHaveProperty("severity");
      expect(events[0]).toHaveProperty("sourceIp");
      expect(events[0]).toHaveProperty("riskScore");
    });
  });

  describe("getSoarPlaybooks", () => {
    it("fetches SOAR playbooks from the API", async () => {
      const playbooks = await svc.getSoarPlaybooks();
      expect(Array.isArray(playbooks)).toBe(true);
      expect(playbooks).toHaveLength(2);
      expect(playbooks[0].name).toBe("Brute Force Response");
      expect(playbooks[0].enabled).toBe(true);
    });

    it("returns fallback playbooks when API fails", async () => {
      server.use(
        http.get(`${BASE_URL}/api/auth/threats/playbooks`, () =>
          HttpResponse.json(null, { status: 503 })
        )
      );
      const playbooks = await svc.getSoarPlaybooks();
      expect(Array.isArray(playbooks)).toBe(true);
      expect(playbooks.length).toBeGreaterThan(0);
      expect(playbooks[0]).toHaveProperty("id");
      expect(playbooks[0]).toHaveProperty("name");
      expect(playbooks[0]).toHaveProperty("enabled");
    });
  });

  describe("triggerPlaybookExecution", () => {
    it("triggers a playbook execution for a given event", async () => {
      const result = await svc.triggerPlaybookExecution("pb_01", "evt_101");
      expect(result).toHaveProperty("success", true);
      expect(result).toHaveProperty("executionId");
    });

    it("returns fallback response when API fails", async () => {
      server.use(
        http.post(`${BASE_URL}/api/auth/threats/playbooks/:id/execute`, () =>
          HttpResponse.json(null, { status: 500 })
        )
      );
      const result = await svc.triggerPlaybookExecution("pb_01", "evt_101");
      expect(result).toHaveProperty("success");
      expect(result).toHaveProperty("executionId");
    });
  });

  describe("togglePlaybookStatus", () => {
    it("toggles a playbook enabled/disabled status", async () => {
      const result = await svc.togglePlaybookStatus("pb_01", true);
      expect(result).toHaveProperty("success", true);
      expect(result).toHaveProperty("enabled", true);
    });

    it("returns fallback when API fails", async () => {
      server.use(
        http.patch(`${BASE_URL}/api/auth/threats/playbooks/:id/toggle`, () =>
          HttpResponse.json(null, { status: 500 })
        )
      );
      const result = await svc.togglePlaybookStatus("pb_02", false);
      expect(result).toHaveProperty("success");
      expect(result).toHaveProperty("enabled");
    });
  });

  describe("simulateThreatIncident", () => {
    it("simulates a threat incident with provided parameters", async () => {
      const result = await svc.simulateThreatIncident("RANSOMWARE", "10.0.0.1", "/api/data");
      expect(result).toHaveProperty("incidentId");
      expect(result).toHaveProperty("severity");
    });

    it("returns fallback when API fails", async () => {
      server.use(
        http.post(`${BASE_URL}/api/auth/threats/simulate`, () =>
          HttpResponse.json(null, { status: 500 })
        )
      );
      const result = await svc.simulateThreatIncident("DDOS", "1.2.3.4", "/api/health");
      expect(result).toHaveProperty("incidentId");
      expect(result).toHaveProperty("severity");
    });
  });

  describe("updateThreatStatus", () => {
    it("updates the status of a threat event", async () => {
      const result = await svc.updateThreatStatus("evt_101", "RESOLVED");
      expect(result).toHaveProperty("success", true);
      expect(result).toHaveProperty("newStatus", "RESOLVED");
    });

    it("returns fallback when API fails", async () => {
      server.use(
        http.patch(`${BASE_URL}/api/auth/threats/events/:id/status`, () =>
          HttpResponse.json(null, { status: 500 })
        )
      );
      const result = await svc.updateThreatStatus("evt_102", "CONTAINED");
      expect(result).toHaveProperty("success");
      expect(result).toHaveProperty("newStatus");
    });
  });
});

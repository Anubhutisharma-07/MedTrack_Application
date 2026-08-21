import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

const BASE_URL = "http://localhost:8081";

const server = setupServer(
  http.get(`${BASE_URL}/api/auth/siem/events`, () =>
    HttpResponse.json([
      { id: "log_001", timestamp: "2026-07-28T10:00:00Z", eventType: "LOGIN_FAILURE", sourceIp: "10.0.0.1", severity: "HIGH" },
    ])
  ),
  http.get(`${BASE_URL}/api/auth/siem/metrics`, () =>
    HttpResponse.json({ eventsPerMinute: 142, alertsOpen: 3, meanTimeToDetectMinutes: 2.1 })
  ),
  http.get(`${BASE_URL}/api/auth/siem/rules`, () =>
    HttpResponse.json([
      { id: "rule_001", name: "Brute Force Detection", enabled: true, condition: "count(LOGIN_FAILURE) > 5 in 60s" },
      { id: "rule_002", name: "Exfiltration Alert", enabled: false, condition: "bytes_out > 1GB in 300s" },
    ])
  ),
  http.put(`${BASE_URL}/api/auth/siem/rules/:id`, () =>
    HttpResponse.json({ success: true, enabled: true })
  ),
  http.get(`${BASE_URL}/api/auth/siem/export`, () =>
    HttpResponse.json({ downloadUrl: "https://cdn.example.com/siem-export.json", format: "json" })
  )
);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

let svc;
beforeEach(async () => {
  vi.resetModules();
  svc = await import("../../services/SiemSecurityAnalyticsService");
});

describe("SiemSecurityAnalyticsService", () => {
  describe("getSiemEventLogs", () => {
    it("fetches SIEM event logs with default params", async () => {
      const events = await svc.getSiemEventLogs();
      expect(Array.isArray(events)).toBe(true);
      expect(events[0]).toHaveProperty("id", "log_001");
      expect(events[0]).toHaveProperty("eventType");
      expect(events[0]).toHaveProperty("sourceIp");
    });

    it("returns fallback event logs on API failure", async () => {
      server.use(
        http.get(`${BASE_URL}/api/auth/siem/events`, () => HttpResponse.json(null, { status: 500 }))
      );
      const events = await svc.getSiemEventLogs();
      expect(Array.isArray(events)).toBe(true);
      expect(events.length).toBeGreaterThan(0);
      expect(events[0]).toHaveProperty("id");
      expect(events[0]).toHaveProperty("eventType");
    });
  });

  describe("getSiemMetrics", () => {
    it("fetches SIEM dashboard metrics", async () => {
      const metrics = await svc.getSiemMetrics();
      expect(metrics).toHaveProperty("eventsPerMinute", 142);
      expect(metrics).toHaveProperty("alertsOpen", 3);
      expect(metrics).toHaveProperty("meanTimeToDetectMinutes");
    });

    it("returns fallback metrics on API failure", async () => {
      server.use(
        http.get(`${BASE_URL}/api/auth/siem/metrics`, () => HttpResponse.json(null, { status: 503 }))
      );
      const metrics = await svc.getSiemMetrics();
      expect(metrics).toHaveProperty("eventsPerMinute");
      expect(metrics).toHaveProperty("alertsOpen");
    });
  });

  describe("getSiemCorrelationRules", () => {
    it("fetches correlation rules", async () => {
      const rules = await svc.getSiemCorrelationRules();
      expect(Array.isArray(rules)).toBe(true);
      expect(rules).toHaveLength(2);
      expect(rules[0].name).toBe("Brute Force Detection");
      expect(rules[0].enabled).toBe(true);
    });

    it("returns fallback rules on API failure", async () => {
      server.use(
        http.get(`${BASE_URL}/api/auth/siem/rules`, () => HttpResponse.json(null, { status: 500 }))
      );
      const rules = await svc.getSiemCorrelationRules();
      expect(Array.isArray(rules)).toBe(true);
      expect(rules.length).toBeGreaterThan(0);
      expect(rules[0]).toHaveProperty("name");
    });
  });

  describe("toggleCorrelationRule", () => {
    it("toggles a correlation rule on/off", async () => {
      const result = await svc.toggleCorrelationRule("rule_001", false);
      expect(result).toHaveProperty("success", true);
      expect(result).toHaveProperty("enabled", true);
    });

    it("returns fallback on API failure", async () => {
      server.use(
        http.put(`${BASE_URL}/api/auth/siem/rules/:id`, () => HttpResponse.json(null, { status: 500 }))
      );
      const result = await svc.toggleCorrelationRule("rule_002", true);
      expect(result).toHaveProperty("success");
      expect(result).toHaveProperty("enabled");
    });
  });

  describe("exportSiemLogs", () => {
    it("exports SIEM logs in specified format", async () => {
      const result = await svc.exportSiemLogs("json");
      expect(result).toHaveProperty("downloadUrl");
      expect(result).toHaveProperty("format", "json");
    });

    it("returns fallback export on API failure", async () => {
      server.use(
        http.get(`${BASE_URL}/api/auth/siem/export`, () => HttpResponse.json(null, { status: 500 }))
      );
      const result = await svc.exportSiemLogs("csv");
      expect(result).toHaveProperty("downloadUrl");
      expect(result).toHaveProperty("format");
    });
  });
});

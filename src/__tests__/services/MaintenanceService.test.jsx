import { describe, it, expect, vi, beforeEach } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

const BASE_URL = "http://localhost:8081";
const AUTO = "/api/maintenance/automation";
const server = setupServer(
  http.get(`${BASE_URL}/api/maintenance`, () => HttpResponse.json([{ id: "MNT-1", description: "Oil change" }])),
  http.get(`${BASE_URL}/api/maintenance/:id`, ({ params }) => HttpResponse.json({ id: params.id, description: "Task" })),
  http.post(`${BASE_URL}/api/maintenance`, () => HttpResponse.json({ id: "MNT-NEW", description: "New" })),
  http.put(`${BASE_URL}/api/maintenance/:id`, ({ params }) => HttpResponse.json({ id: params.id, description: "Updated" })),
  http.delete(`${BASE_URL}/api/maintenance/:id`, () => HttpResponse.json({ message: "Deleted" })),
  http.get(`${BASE_URL}/api/maintenance/export/calendar.ics`, () => HttpResponse.text("BEGIN:VCALENDAR\nEND:VCALENDAR")),
  http.get(`${BASE_URL}${AUTO}/rules`, () => HttpResponse.json([{ id: "R-1", name: "Monthly" }])),
  http.get(`${BASE_URL}${AUTO}/rules/:id`, ({ params }) => HttpResponse.json({ id: params.id, name: "Detail" })),
  http.post(`${BASE_URL}${AUTO}/rules`, () => HttpResponse.json({ id: "R-NEW", name: "New" })),
  http.put(`${BASE_URL}${AUTO}/rules/:id`, ({ params }) => HttpResponse.json({ id: params.id, name: "Updated" })),
  http.delete(`${BASE_URL}${AUTO}/rules/:id`, () => HttpResponse.json({ message: "Deleted" })),
  http.get(`${BASE_URL}${AUTO}/rules/:id/preview`, () => HttpResponse.json({ generatedTasks: [] })),
  http.post(`${BASE_URL}${AUTO}/rules/:id/generate`, () => HttpResponse.json({ created: 3 })),
  http.get(`${BASE_URL}${AUTO}/sla`, () => HttpResponse.json({ totalTasks: 10, onTime: 8, breached: 2 })),
  http.post(`${BASE_URL}${AUTO}/sla/refresh`, () => HttpResponse.json({ message: "Refreshed" })),
  http.get(`${BASE_URL}${AUTO}/workload`, () => HttpResponse.json([{ technician: "John", count: 5 }])),
);
beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
beforeEach(() => { sessionStorage.clear(); });

async function loadService() { return import("../../services/MaintenanceService"); }

describe("MaintenanceService", () => {
  it("fetches all tasks", async () => { expect((await (await loadService()).getAllTasks())).toHaveLength(1); });
  it("fetches tasks with params", async () => { expect(await (await loadService()).getAllTasks({ technicianId: "t1", page: 1, size: 10 })).toBeDefined(); });
  it("rejects on error", async () => {
    server.use(http.get(`${BASE_URL}/api/maintenance`, () => HttpResponse.json({}, { status: 500 })));
    await expect((await loadService()).getAllTasks()).rejects.toThrow();
  });
  it("fetches a single task", async () => { expect((await (await loadService()).getTaskById("MNT-1")).id).toBe("MNT-1"); });
  it("creates a task", async () => { expect((await (await loadService()).scheduleTask({})).id).toBe("MNT-NEW"); });
  it("updates a task", async () => { expect((await (await loadService()).updateTask("MNT-1", {})).id).toBe("MNT-1"); });
  it("deletes a task", async () => { expect((await (await loadService()).deleteTask("MNT-1")).message).toBe("Deleted"); });
  it("exports iCal", async () => { expect(await (await loadService()).exportTasksToICal()).toContain("VCALENDAR"); });
  it("lists rules", async () => { expect((await (await loadService()).listRules())).toHaveLength(1); });
  it("gets a rule", async () => { expect((await (await loadService()).getRule("R-1")).name).toBe("Detail"); });
  it("creates a rule", async () => { expect((await (await loadService()).createRule({})).id).toBe("R-NEW"); });
  it("updates a rule", async () => { expect((await (await loadService()).updateRule("R-1", {})).id).toBe("R-1"); });
  it("deletes a rule", async () => { expect((await (await loadService()).deleteRule("R-1")).message).toBe("Deleted"); });
  it("previews rule without dates", async () => { expect((await (await loadService()).previewRule("R-1")).generatedTasks).toEqual([]); });
  it("previews rule with dates", async () => { expect(await (await loadService()).previewRule("R-1", "2026-01-01", "2026-06-30")).toBeDefined(); });
  it("generates tasks", async () => { expect((await (await loadService()).generateTasks("R-1")).created).toBe(3); });
  it("generates tasks with dates", async () => { expect((await (await loadService()).generateTasks("R-1", "2026-01-01", "2026-12-31")).created).toBe(3); });
  it("gets SLA summary", async () => { const r = await (await loadService()).getSlaSummary(); expect(r.totalTasks).toBe(10); });
  it("refreshes SLA", async () => { expect((await (await loadService()).refreshSla()).message).toBe("Refreshed"); });
  it("gets technician workload", async () => { expect((await (await loadService()).getTechnicianWorkload())).toHaveLength(1); });
});

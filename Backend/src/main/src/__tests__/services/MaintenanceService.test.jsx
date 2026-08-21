import { describe, it, expect, vi, beforeEach } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

const BASE_URL = "http://localhost:8081";
const AUTOMATION = "/api/maintenance/automation";

const server = setupServer(
  http.get(`${BASE_URL}/api/maintenance`, () =>
    HttpResponse.json([{ id: "MNT-1", description: "Oil change" }])
  ),
  http.get(`${BASE_URL}/api/maintenance/:id`, ({ params }) =>
    HttpResponse.json({ id: params.id, description: "Task detail" })
  ),
  http.post(`${BASE_URL}/api/maintenance`, () =>
    HttpResponse.json({ id: "MNT-NEW", description: "New task" })
  ),
  http.put(`${BASE_URL}/api/maintenance/:id`, ({ params }) =>
    HttpResponse.json({ id: params.id, description: "Updated task" })
  ),
  http.delete(`${BASE_URL}/api/maintenance/:id`, () =>
    HttpResponse.json({ message: "Deleted" })
  ),
  http.get(`${BASE_URL}/api/maintenance/export/calendar.ics`, () =>
    HttpResponse.text("BEGIN:VCALENDAR\nEND:VCALENDAR")
  ),
  http.get(`${BASE_URL}${AUTOMATION}/rules`, () =>
    HttpResponse.json([{ id: "R-1", name: "Monthly oil change" }])
  ),
  http.get(`${BASE_URL}${AUTOMATION}/rules/:id`, ({ params }) =>
    HttpResponse.json({ id: params.id, name: "Rule detail" })
  ),
  http.post(`${BASE_URL}${AUTOMATION}/rules`, () =>
    HttpResponse.json({ id: "R-NEW", name: "New rule" })
  ),
  http.put(`${BASE_URL}${AUTOMATION}/rules/:id`, ({ params }) =>
    HttpResponse.json({ id: params.id, name: "Updated rule" })
  ),
  http.delete(`${BASE_URL}${AUTOMATION}/rules/:id`, () =>
    HttpResponse.json({ message: "Rule deleted" })
  ),
  http.get(`${BASE_URL}${AUTOMATION}/rules/:id/preview`, () =>
    HttpResponse.json({ generatedTasks: [] })
  ),
  http.post(`${BASE_URL}${AUTOMATION}/rules/:id/generate`, () =>
    HttpResponse.json({ created: 3 })
  ),
  http.get(`${BASE_URL}${AUTOMATION}/sla`, () =>
    HttpResponse.json({ totalTasks: 10, onTime: 8, breached: 2 })
  ),
  http.post(`${BASE_URL}${AUTOMATION}/sla/refresh`, () =>
    HttpResponse.json({ message: "SLA refreshed" })
  ),
  http.get(`${BASE_URL}${AUTOMATION}/workload`, () =>
    HttpResponse.json([{ technician: "John", count: 5 }])
  ),
);

beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

beforeEach(() => {
  sessionStorage.clear();
});

async function loadService() {
  return import("../../services/MaintenanceService");
}

describe("MaintenanceService - getAllTasks", () => {
  it("fetches all tasks with default params", async () => {
    const { getAllTasks } = await loadService();
    const result = await getAllTasks();
    expect(result).toHaveLength(1);
  });

  it("fetches tasks with filter params", async () => {
    const { getAllTasks } = await loadService();
    const result = await getAllTasks({
      technicianId: "t1",
      page: 1,
      size: 10,
      status: "In Progress",
      equipmentId: "EQ-001",
    });
    expect(result).toBeDefined();
  });

  it("rejects on server error", async () => {
    server.use(
      http.get(`${BASE_URL}/api/maintenance`, () =>
        HttpResponse.json({ message: "Error" }, { status: 500 })
      )
    );

    const { getAllTasks } = await loadService();
    await expect(getAllTasks()).rejects.toThrow();
  });
});

describe("MaintenanceService - getTaskById", () => {
  it("fetches a single task", async () => {
    const { getTaskById } = await loadService();
    const result = await getTaskById("MNT-1");
    expect(result.id).toBe("MNT-1");
  });

  it("rejects for non-existent task", async () => {
    server.use(
      http.get(`${BASE_URL}/api/maintenance/:id`, () =>
        HttpResponse.json({ message: "Not found" }, { status: 404 })
      )
    );

    const { getTaskById } = await loadService();
    await expect(getTaskById("MNT-999")).rejects.toThrow();
  });
});

describe("MaintenanceService - scheduleTask", () => {
  it("creates a new maintenance task", async () => {
    const { scheduleTask } = await loadService();
    const result = await scheduleTask({ description: "New task" });
    expect(result.id).toBe("MNT-NEW");
  });
});

describe("MaintenanceService - updateTask", () => {
  it("updates an existing task", async () => {
    const { updateTask } = await loadService();
    const result = await updateTask("MNT-1", { description: "Updated" });
    expect(result.id).toBe("MNT-1");
  });
});

describe("MaintenanceService - deleteTask", () => {
  it("deletes a task", async () => {
    const { deleteTask } = await loadService();
    const result = await deleteTask("MNT-1");
    expect(result.message).toBe("Deleted");
  });
});

describe("MaintenanceService - exportTasksToICal", () => {
  it("downloads tasks as iCal file", async () => {
    const { exportTasksToICal } = await loadService();
    const result = await exportTasksToICal();
    expect(result).toContain("VCALENDAR");
  });
});

describe("MaintenanceService - listRules", () => {
  it("fetches all automation rules", async () => {
    const { listRules } = await loadService();
    const result = await listRules();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Monthly oil change");
  });
});

describe("MaintenanceService - getRule", () => {
  it("fetches a single rule", async () => {
    const { getRule } = await loadService();
    const result = await getRule("R-1");
    expect(result.name).toBe("Rule detail");
  });
});

describe("MaintenanceService - createRule", () => {
  it("creates a new rule", async () => {
    const { createRule } = await loadService();
    const result = await createRule({ name: "New rule" });
    expect(result.id).toBe("R-NEW");
  });
});

describe("MaintenanceService - updateRule", () => {
  it("updates an existing rule", async () => {
    const { updateRule } = await loadService();
    const result = await updateRule("R-1", { name: "Updated" });
    expect(result.id).toBe("R-1");
  });
});

describe("MaintenanceService - deleteRule", () => {
  it("deletes a rule", async () => {
    const { deleteRule } = await loadService();
    const result = await deleteRule("R-1");
    expect(result.message).toBe("Rule deleted");
  });
});

describe("MaintenanceService - previewRule", () => {
  it("previews rule generation without dates", async () => {
    const { previewRule } = await loadService();
    const result = await previewRule("R-1");
    expect(result.generatedTasks).toEqual([]);
  });

  it("previews rule generation with date window", async () => {
    const { previewRule } = await loadService();
    const result = await previewRule("R-1", "2026-01-01", "2026-06-30");
    expect(result).toBeDefined();
  });
});

describe("MaintenanceService - generateTasks", () => {
  it("generates tasks from a rule", async () => {
    const { generateTasks } = await loadService();
    const result = await generateTasks("R-1");
    expect(result.created).toBe(3);
  });

  it("generates tasks with a date window", async () => {
    const { generateTasks } = await loadService();
    const result = await generateTasks("R-1", "2026-01-01", "2026-12-31");
    expect(result.created).toBe(3);
  });
});

describe("MaintenanceService - getSlaSummary", () => {
  it("fetches SLA summary", async () => {
    const { getSlaSummary } = await loadService();
    const result = await getSlaSummary();
    expect(result.totalTasks).toBe(10);
    expect(result.onTime).toBe(8);
    expect(result.breached).toBe(2);
  });
});

describe("MaintenanceService - refreshSla", () => {
  it("triggers SLA refresh", async () => {
    const { refreshSla } = await loadService();
    const result = await refreshSla();
    expect(result.message).toBe("SLA refreshed");
  });
});

describe("MaintenanceService - getTechnicianWorkload", () => {
  it("fetches technician workload", async () => {
    const { getTechnicianWorkload } = await loadService();
    const result = await getTechnicianWorkload();
    expect(result).toHaveLength(1);
    expect(result[0].technician).toBe("John");
  });
});

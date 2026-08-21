import { describe, it, expect, vi, beforeEach } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

const BASE_URL = "http://localhost:8081";

const server = setupServer(
  http.get(`${BASE_URL}/api/equipment`, () =>
    HttpResponse.json({
      content: [{ id: "EQ-001", name: "MRI Scanner" }],
      totalElements: 1,
      totalPages: 1,
    })
  ),
  http.get(`${BASE_URL}/api/equipment/:id`, ({ params }) =>
    HttpResponse.json({ id: params.id, name: "Test Equipment" })
  ),
  http.post(`${BASE_URL}/api/equipment`, () =>
    HttpResponse.json({ id: "EQ-NEW", name: "New Equipment" })
  ),
  http.put(`${BASE_URL}/api/equipment/:id`, ({ params }) =>
    HttpResponse.json({ id: params.id, name: "Updated" })
  ),
  http.delete(`${BASE_URL}/api/equipment/:id`, () =>
    HttpResponse.json({ message: "Deleted" })
  ),
  http.post(`${BASE_URL}/api/equipment/import`, () =>
    HttpResponse.json({ imported: 5, errors: 0 })
  ),
  http.post(`${BASE_URL}/api/equipment/import/preview`, () =>
    HttpResponse.json({ rows: [{ Name: "MRI" }], errors: [] })
  ),
  http.get(`${BASE_URL}/api/equipment/imports/audit`, () =>
    HttpResponse.json({ batches: [] })
  ),
  http.get(`${BASE_URL}/api/equipment/:id/qr-code`, () =>
    HttpResponse.json({ qrCode: "data:image/png;base64,abc123" })
  ),
  http.get(`${BASE_URL}/api/equipment/:id/lifecycle`, () =>
    HttpResponse.json({ actions: [] })
  ),
  http.get(`${BASE_URL}/api/equipment/:id/timeline`, () =>
    HttpResponse.json({ entries: [] })
  ),
  http.post(`${BASE_URL}/api/equipment/:id/lifecycle`, () =>
    HttpResponse.json({ id: "LA-1", actionType: "TRANSFER" })
  ),
  http.post(`${BASE_URL}/api/equipment/lifecycle/:actionId/approve`, () =>
    HttpResponse.json({ message: "Approved" })
  ),
  http.post(`${BASE_URL}/api/equipment/lifecycle/:actionId/reject`, () =>
    HttpResponse.json({ message: "Rejected" })
  ),
  http.post(`${BASE_URL}/api/equipment/lifecycle/:actionId/complete`, () =>
    HttpResponse.json({ message: "Completed" })
  ),
);

beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

beforeEach(() => {
  sessionStorage.clear();
});

async function loadService() {
  return import("../../services/EquipmentService");
}

describe("EquipmentService - getAllEquipment", () => {
  it("fetches equipment with default pagination", async () => {
    const { getAllEquipment } = await loadService();
    const result = await getAllEquipment();
    expect(result.content).toHaveLength(1);
    expect(result.totalElements).toBe(1);
  });

  it("fetches equipment with custom page and size", async () => {
    const { getAllEquipment } = await loadService();
    const result = await getAllEquipment(2, 10);
    expect(result.content).toBeDefined();
  });

  it("rejects on server error", async () => {
    server.use(
      http.get(`${BASE_URL}/api/equipment`, () =>
        HttpResponse.json({ message: "Server error" }, { status: 500 })
      )
    );

    const { getAllEquipment } = await loadService();
    await expect(getAllEquipment()).rejects.toThrow();
  });
});

describe("EquipmentService - getEquipmentById", () => {
  it("fetches a single equipment by ID", async () => {
    const { getEquipmentById } = await loadService();
    const result = await getEquipmentById("EQ-001");
    expect(result.id).toBe("EQ-001");
    expect(result.name).toBe("Test Equipment");
  });

  it("rejects for non-existent ID", async () => {
    server.use(
      http.get(`${BASE_URL}/api/equipment/:id`, () =>
        HttpResponse.json({ message: "Not found" }, { status: 404 })
      )
    );

    const { getEquipmentById } = await loadService();
    await expect(getEquipmentById("EQ-999")).rejects.toThrow();
  });
});

describe("EquipmentService - addEquipment", () => {
  it("creates new equipment", async () => {
    const { addEquipment } = await loadService();
    const result = await addEquipment({ name: "New Equipment", model: "M1" });
    expect(result.id).toBe("EQ-NEW");
  });
});

describe("EquipmentService - updateEquipment", () => {
  it("updates existing equipment by ID", async () => {
    const { updateEquipment } = await loadService();
    const result = await updateEquipment("EQ-001", { name: "Updated" });
    expect(result.id).toBe("EQ-001");
  });
});

describe("EquipmentService - deleteEquipment", () => {
  it("deletes equipment by ID", async () => {
    const { deleteEquipment } = await loadService();
    const result = await deleteEquipment("EQ-001");
    expect(result.message).toBe("Deleted");
  });
});

describe("EquipmentService - importEquipmentCsv", () => {
  it("imports a CSV file", async () => {
    const { importEquipmentCsv } = await loadService();
    const file = new File(["data"], "equipment.csv", { type: "text/csv" });
    const result = await importEquipmentCsv(file);
    expect(result.imported).toBe(5);
  });
});

describe("EquipmentService - previewEquipmentImport", () => {
  it("returns a dry-run preview of import", async () => {
    const { previewEquipmentImport } = await loadService();
    const file = new File(["data"], "preview.csv", { type: "text/csv" });
    const result = await previewEquipmentImport(file);
    expect(result.rows).toHaveLength(1);
  });
});

describe("EquipmentService - getEquipmentImportHistory", () => {
  it("fetches import audit history", async () => {
    const { getEquipmentImportHistory } = await loadService();
    const result = await getEquipmentImportHistory();
    expect(result.batches).toEqual([]);
  });
});

describe("EquipmentService - getEquipmentQrCode", () => {
  it("fetches QR code for equipment", async () => {
    const { getEquipmentQrCode } = await loadService();
    const result = await getEquipmentQrCode("EQ-001");
    expect(result.qrCode).toContain("base64");
  });
});

describe("EquipmentService - getEquipmentLifecycle", () => {
  it("fetches lifecycle actions for equipment", async () => {
    const { getEquipmentLifecycle } = await loadService();
    const result = await getEquipmentLifecycle("EQ-001");
    expect(result.actions).toEqual([]);
  });
});

describe("EquipmentService - getEquipmentTimeline", () => {
  it("fetches timeline entries for equipment", async () => {
    const { getEquipmentTimeline } = await loadService();
    const result = await getEquipmentTimeline("EQ-001");
    expect(result.entries).toEqual([]);
  });
});

describe("EquipmentService - createEquipmentLifecycleAction", () => {
  it("creates a lifecycle action", async () => {
    const { createEquipmentLifecycleAction } = await loadService();
    const result = await createEquipmentLifecycleAction("EQ-001", {
      actionType: "TRANSFER",
    });
    expect(result.actionType).toBe("TRANSFER");
  });
});

describe("EquipmentService - approveEquipmentLifecycleAction", () => {
  it("approves a lifecycle action", async () => {
    const { approveEquipmentLifecycleAction } = await loadService();
    const result = await approveEquipmentLifecycleAction("LA-1");
    expect(result.message).toBe("Approved");
  });
});

describe("EquipmentService - rejectEquipmentLifecycleAction", () => {
  it("rejects a lifecycle action with reason", async () => {
    const { rejectEquipmentLifecycleAction } = await loadService();
    const result = await rejectEquipmentLifecycleAction("LA-1", "Not needed");
    expect(result.message).toBe("Rejected");
  });

  it("rejects a lifecycle action without reason", async () => {
    const { rejectEquipmentLifecycleAction } = await loadService();
    const result = await rejectEquipmentLifecycleAction("LA-1");
    expect(result.message).toBe("Rejected");
  });
});

describe("EquipmentService - completeEquipmentLifecycleAction", () => {
  it("completes a lifecycle action", async () => {
    const { completeEquipmentLifecycleAction } = await loadService();
    const result = await completeEquipmentLifecycleAction("LA-1");
    expect(result.message).toBe("Completed");
  });
});

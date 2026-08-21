import { describe, it, expect, vi, beforeEach } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

const BASE_URL = "http://localhost:8081";
const server = setupServer(
  http.get(`${BASE_URL}/api/orders`, () => HttpResponse.json([{ id: "ORD-1", equipmentName: "MRI" }])),
  http.get(`${BASE_URL}/api/orders/:id`, ({ params }) => HttpResponse.json({ id: params.id, status: "Processing" })),
  http.post(`${BASE_URL}/api/orders`, () => HttpResponse.json({ id: "ORD-NEW" })),
  http.put(`${BASE_URL}/api/orders/:id/status`, () => HttpResponse.json({ message: "Updated" })),
  http.get(`${BASE_URL}/api/orders/supplier/metrics`, () => HttpResponse.json({ totalOrders: 10 })),
  http.post(`${BASE_URL}/api/orders/:id/invoice/email`, () => HttpResponse.json({ message: "Emailed" })),
);
beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
beforeEach(() => { sessionStorage.clear(); });

async function load() { return import("../../services/OrderService"); }

describe("OrderService", () => {
  it("fetches all orders", async () => { expect((await (await load()).getAllOrders())).toHaveLength(1); });
  it("fetches orders with pagination", async () => { expect(await (await load()).getAllOrders(1, 10)).toBeDefined(); });
  it("fetches a single order", async () => { expect((await (await load()).getOrderById("ORD-1")).id).toBe("ORD-1"); });
  it("places a new order", async () => { expect((await (await load()).placeOrder({})).id).toBe("ORD-NEW"); });
  it("updates order status", async () => { expect((await (await load()).updateOrderStatus("ORD-1", "Shipped")).message).toBe("Updated"); });
  it("updates order status with notes", async () => { expect((await (await load()).updateOrderStatus("ORD-1", "Shipped", "via API")).message).toBe("Updated"); });
  it("fetches supplier metrics", async () => { expect((await (await load()).getSupplierMetrics()).totalOrders).toBe(10); });
  it("emails invoice", async () => { expect((await (await load()).emailInvoice("ORD-1")).message).toBe("Emailed"); });
  it("rejects on server error", async () => {
    server.use(http.get(`${BASE_URL}/api/orders`, () => HttpResponse.json({}, { status: 500 })));
    await expect((await load()).getAllOrders()).rejects.toThrow();
  });
});

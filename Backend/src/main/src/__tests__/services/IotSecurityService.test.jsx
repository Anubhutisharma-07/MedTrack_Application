import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

const BASE = "http://localhost:8081";
const server = setupServer(
  http.get(`${BASE}/api/auth/iot/devices`, () => HttpResponse.json([
    { id: "iot_001", deviceName: "Pulse Oximeter Alpha", deviceType: "WEARABLE", firmware: "3.2.1", postureScore: 95, status: "ACTIVE" },
  ])),
  http.post(`${BASE}/api/auth/iot/devices`, () => HttpResponse.json({ id: "iot_new", deviceName: "New Sensor", status: "REGISTERED" })),
  http.post(`${BASE}/api/auth/iot/devices/:id/quarantine`, () => HttpResponse.json({ success: true, quarantinedAt: "2026-07-28T14:00:00Z" })),
);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

let svc;
beforeEach(async () => { vi.resetModules(); svc = await import("../../services/IotSecurityService"); });

describe("IotSecurityService", () => {
  it("fetches all IoT devices", async () => {
    const devices = await svc.getAllDevices();
    expect(Array.isArray(devices)).toBe(true);
    expect(devices[0]).toHaveProperty("id", "iot_001");
    expect(devices[0]).toHaveProperty("deviceType", "WEARABLE");
    expect(devices[0]).toHaveProperty("postureScore", 95);
  });

  it("returns fallback devices on API failure", async () => {
    server.use(http.get(`${BASE}/api/auth/iot/devices`, () => HttpResponse.json(null, { status: 500 })));
    const devices = await svc.getAllDevices();
    expect(devices[0]).toHaveProperty("id");
    expect(devices[0]).toHaveProperty("deviceType");
  });

  it("registers a new IoT device", async () => {
    const result = await svc.registerDevice({ deviceName: "New Sensor", deviceType: "IMPLANTABLE" });
    expect(result).toHaveProperty("id", "iot_new");
    expect(result).toHaveProperty("status", "REGISTERED");
  });

  it("returns fallback on register failure", async () => {
    server.use(http.post(`${BASE}/api/auth/iot/devices`, () => HttpResponse.json(null, { status: 500 })));
    const result = await svc.registerDevice({ deviceName: "Fallback" });
    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("status");
  });

  it("quarantines a compromised device", async () => {
    const result = await svc.quarantineDevice("iot_001");
    expect(result).toHaveProperty("success", true);
    expect(result).toHaveProperty("quarantinedAt");
  });

  it("returns fallback on quarantine failure", async () => {
    server.use(http.post(`${BASE}/api/auth/iot/devices/:id/quarantine`, () => HttpResponse.json(null, { status: 500 })));
    const result = await svc.quarantineDevice("iot_001");
    expect(result).toHaveProperty("success");
    expect(result).toHaveProperty("quarantinedAt");
  });
});

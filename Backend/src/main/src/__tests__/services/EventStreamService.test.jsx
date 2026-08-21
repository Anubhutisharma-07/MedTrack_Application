import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { getEvents, getUnreadCounts, getRecentEvents, markEventsAsRead, markAllEventsAsRead, eventStream } from "../../services/EventStreamService";

const BASE_URL = "http://localhost:8081";
const BASE = "/api/events";

const server = setupServer(
  http.get(`${BASE_URL}${BASE}`, ({ request }) => {
    const url = new URL(request.url);
    const page = url.searchParams.get("page");
    const size = url.searchParams.get("size");
    return HttpResponse.json({
      content: [{ id: "evt-1", title: "SLA Breach", category: "SLA" }],
      totalElements: 1,
    });
  }),
  http.get(`${BASE_URL}${BASE}/unread-counts`, () =>
    HttpResponse.json({ SLA: 3, MAINTENANCE: 1 })
  ),
  http.get(`${BASE_URL}${BASE}/recent`, () =>
    HttpResponse.json([{ id: "evt-recent", title: "New event" }])
  ),
  http.post(`${BASE_URL}${BASE}/read`, () =>
    HttpResponse.json({ message: "Marked as read" })
  ),
  http.post(`${BASE_URL}${BASE}/read-all`, () =>
    HttpResponse.json({ message: "All marked as read" })
  ),
);

beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterEach(() => {
  server.resetHandlers();
  sessionStorage.clear();
});
afterAll(() => server.close());

beforeEach(() => {
  sessionStorage.clear();
});

describe("EventStreamService - getEvents", () => {
  it("fetches events with default params", async () => {
    const result = await getEvents();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].category).toBe("SLA");
  });

  it("fetches events with filter params", async () => {
    const result = await getEvents({
      category: "SLA",
      unreadOnly: true,
      page: 1,
      size: 5,
    });
    expect(result).toBeDefined();
  });

  it("rejects on server error", async () => {
    server.use(
      http.get(`${BASE_URL}${BASE}`, () =>
        HttpResponse.json({ message: "Error" }, { status: 500 })
      )
    );

    await expect(getEvents()).rejects.toThrow();
  });
});

describe("EventStreamService - getUnreadCounts", () => {
  it("fetches unread counts by category", async () => {
    const result = await getUnreadCounts();
    expect(result.SLA).toBe(3);
    expect(result.MAINTENANCE).toBe(1);
  });
});

describe("EventStreamService - getRecentEvents", () => {
  it("fetches recent events since a timestamp", async () => {
    const result = await getRecentEvents("2026-01-01T00:00:00Z");
    expect(result).toHaveLength(1);
  });
});

describe("EventStreamService - markEventsAsRead", () => {
  it("marks specific events as read", async () => {
    const result = await markEventsAsRead(["evt-1", "evt-2"]);
    expect(result.message).toBe("Marked as read");
  });
});

describe("EventStreamService - markAllEventsAsRead", () => {
  it("marks all events as read with default limit", async () => {
    const result = await markAllEventsAsRead();
    expect(result.message).toBe("All marked as read");
  });

  it("marks all events as read with custom limit", async () => {
    const result = await markAllEventsAsRead(50);
    expect(result.message).toBe("All marked as read");
  });
});

describe("EventStreamClient", () => {
  it("is a singleton instance", () => {
    expect(eventStream).toBeDefined();
    expect(eventStream).toBeInstanceOf(Object);
  });

  it("starts in disconnected state", () => {
    // Disconnect any existing connection
    eventStream.disconnect();
    expect(eventStream.isConnected()).toBe(false);
  });

  it("has onEvent registration method", () => {
    expect(typeof eventStream.onEvent).toBe("function");
  });

  it("has onConnectionChange registration method", () => {
    expect(typeof eventStream.onConnectionChange).toBe("function");
  });

  it("onEvent returns an unsubscribe function", () => {
    const unsubscribe = eventStream.onEvent(() => {});
    expect(typeof unsubscribe).toBe("function");
  });

  it("onConnectionChange returns an unsubscribe function", () => {
    const unsubscribe = eventStream.onConnectionChange(() => {});
    expect(typeof unsubscribe).toBe("function");
  });

  it("disconnect is safe to call when not connected", () => {
    expect(() => eventStream.disconnect()).not.toThrow();
    expect(eventStream.isConnected()).toBe(false);
  });

  it("send is safe to call when not connected", () => {
    expect(() => eventStream.send({ action: "test" })).not.toThrow();
  });

  it("removes event handler on unsubscribe", () => {
    const handler = vi.fn();
    const unsubscribe = eventStream.onEvent(handler);
    unsubscribe();
    // Calling disconnect won't trigger handler
    expect(eventStream.eventHandlers.has(handler)).toBe(false);
  });

  it("removes connection handler on unsubscribe", () => {
    const handler = vi.fn();
    const unsubscribe = eventStream.onConnectionChange(handler);
    unsubscribe();
    expect(eventStream.connectionHandlers.has(handler)).toBe(false);
  });

  it("notifyEvent calls all registered handlers", () => {
    const h1 = vi.fn();
    const h2 = vi.fn();
    eventStream.onEvent(h1);
    eventStream.onEvent(h2);

    const testEvent = { id: "test", title: "Test Event" };
    eventStream.notifyEvent(testEvent);

    expect(h1).toHaveBeenCalledWith(testEvent);
    expect(h2).toHaveBeenCalledWith(testEvent);

    eventStream.eventHandlers.delete(h1);
    eventStream.eventHandlers.delete(h2);
  });

  it("notifyConnection calls all registered handlers", () => {
    const h1 = vi.fn();
    eventStream.onConnectionChange(h1);

    eventStream.notifyConnection(true);
    expect(h1).toHaveBeenCalledWith(true);

    eventStream.notifyConnection(false);
    expect(h1).toHaveBeenCalledWith(false);

    eventStream.connectionHandlers.delete(h1);
  });

  it("scheduleReconnect increments reconnect attempts", () => {
    eventStream.disconnect();
    eventStream.hospitalId = "test-hospital";
    eventStream.reconnectAttempts = 0;
    eventStream.manuallyClosed = false;

    eventStream.scheduleReconnect();
    expect(eventStream.reconnectAttempts).toBe(1);

    // Cleanup
    clearTimeout(eventStream.reconnectTimer);
    eventStream.hospitalId = null;
  });

  it("maxReconnectAttempts stops reconnection", () => {
    eventStream.reconnectAttempts = eventStream.maxReconnectAttempts;
    eventStream.hospitalId = "test-hospital";
    eventStream.manuallyClosed = false;

    eventStream.scheduleReconnect();
    expect(eventStream.reconnectAttempts).toBe(eventStream.maxReconnectAttempts);

    // Cleanup
    eventStream.reconnectAttempts = 0;
    eventStream.hospitalId = null;
  });

  it("reconnectDelay caps at maxReconnectDelay", () => {
    eventStream.reconnectDelay = 50000; // Above max
    eventStream.reconnectAttempts = 0;
    eventStream.hospitalId = "test";
    eventStream.manuallyClosed = false;

    eventStream.scheduleReconnect();
    expect(eventStream.reconnectDelay).toBeLessThanOrEqual(eventStream.maxReconnectDelay);

    // Cleanup
    clearTimeout(eventStream.reconnectTimer);
    eventStream.reconnectAttempts = 0;
    eventStream.hospitalId = null;
  });
});

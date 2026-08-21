/**
 * EventStreamService — REST helpers for the event-streaming API and a
 * singleton `EventStreamClient` that manages a persistent connection
 * (Server-Sent Events / WebSocket) with automatic reconnection.
 */

import { readJson } from "../utils/safeSessionStorage";

const BASE_URL = "http://localhost:8081";
const API = `${BASE_URL}/api/events`;

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function authHeaders() {
  const user = readJson("medtrack_user");
  const headers = { "Content-Type": "application/json" };
  if (user?.token) headers.Authorization = `Bearer ${user.token}`;
  return headers;
}

async function request(path, options = {}) {
  const url = path.startsWith("http") ? path : `${API}${path}`;
  const res = await fetch(url, {
    headers: authHeaders(),
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Request failed (${res.status})`);
  }

  if (res.status === 204) return null;
  return res.json();
}

/* ------------------------------------------------------------------ */
/*  REST helpers                                                      */
/* ------------------------------------------------------------------ */

export async function getEvents(filters = {}) {
  const params = new URLSearchParams();

  if (filters.category) params.set("category", filters.category);
  if (filters.unreadOnly !== undefined) params.set("unreadOnly", String(filters.unreadOnly));
  if (filters.page !== undefined) params.set("page", String(filters.page));
  if (filters.size !== undefined) params.set("size", String(filters.size));

  const qs = params.toString();
  return request(qs ? `?${qs}` : "");
}

export async function getUnreadCounts() {
  return request("/unread-counts");
}

export async function getRecentEvents(since) {
  const params = new URLSearchParams();
  if (since) params.set("since", since);
  return request(`/recent?${params}`);
}

export async function markEventsAsRead(eventIds) {
  return request("/read", {
    method: "POST",
    body: JSON.stringify({ eventIds }),
  });
}

export async function markAllEventsAsRead(limit) {
  return request("/read-all", {
    method: "POST",
    body: JSON.stringify({ limit }),
  });
}

/* ------------------------------------------------------------------ */
/*  EventStreamClient — singleton                                     */
/* ------------------------------------------------------------------ */

class EventStreamClient {
  constructor() {
    this.eventHandlers = new Set();
    this.connectionHandlers = new Set();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.maxReconnectDelay = 30000;
    this.reconnectTimer = null;
    this.hospitalId = null;
    this.manuallyClosed = false;
    this.source = null;
  }

  /**
   * Open an SSE connection for `hospitalId`.
   */
  connect(hospitalId) {
    this.hospitalId = hospitalId;
    this.manuallyClosed = false;
    this._open();
  }

  _open() {
    if (!this.hospitalId || this.manuallyClosed) return;

    try {
      const url = `${BASE_URL}/api/events/stream/${this.hospitalId}`;
      this.source = new EventSource(url);

      this.source.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.notifyEvent(data);
        } catch {
          // malformed event — ignore
        }
      };

      this.source.onopen = () => {
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        this.notifyConnection(true);
      };

      this.source.onerror = () => {
        this.notifyConnection(false);
        this.source?.close();
        this.source = null;
        if (!this.manuallyClosed) {
          this.scheduleReconnect();
        }
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  disconnect() {
    this.manuallyClosed = true;
    this.source?.close();
    this.source = null;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.notifyConnection(false);
  }

  isConnected() {
    return this.source?.readyState === EventSource.OPEN;
  }

  send(data) {
    // SSE is unidirectional; send is a no-op for GET-based streams.
    // If the server exposes a POST endpoint, this could be extended.
  }

  /* ----- handler registration ---- */

  onEvent(handler) {
    this.eventHandlers.add(handler);
    return () => this.eventHandlers.delete(handler);
  }

  onConnectionChange(handler) {
    this.connectionHandlers.add(handler);
    return () => this.connectionHandlers.delete(handler);
  }

  /* ----- internal notify helpers ---- */

  notifyEvent(event) {
    this.eventHandlers.forEach((h) => {
      try { h(event); } catch { /* swallow */ }
    });
  }

  notifyConnection(connected) {
    this.connectionHandlers.forEach((h) => {
      try { h(connected); } catch { /* swallow */ }
    });
  }

  /* ----- reconnection ---- */

  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;

    this.reconnectAttempts += 1;

    // Exponential back-off with jitter, capped at maxReconnectDelay
    const base = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    const jitter = Math.random() * 1000;
    this.reconnectDelay = Math.min(base + jitter, this.maxReconnectDelay);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this._open();
    }, this.reconnectDelay);
  }
}

/** Singleton instance shared across the application. */
export const eventStream = new EventStreamClient();

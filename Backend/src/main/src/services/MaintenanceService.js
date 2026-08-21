/**
 * MaintenanceService — CRUD for maintenance tasks, iCal export,
 * automation rules (CRUD + preview/generate), SLA summary, and
 * technician workload queries.
 */

import { readJson } from "../utils/safeSessionStorage";

const BASE_URL = "http://localhost:8081";
const API = `${BASE_URL}/api/maintenance`;
const AUTOMATION = `${API}/automation`;

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
  const res = await fetch(path.startsWith("http") ? path : path, {
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
/*  Tasks CRUD                                                        */
/* ------------------------------------------------------------------ */

export async function getAllTasks(filters = {}) {
  const params = new URLSearchParams();

  if (filters.technicianId) params.set("technicianId", filters.technicianId);
  if (filters.equipmentId) params.set("equipmentId", filters.equipmentId);
  if (filters.status) params.set("status", filters.status);
  if (filters.page !== undefined) params.set("page", String(filters.page));
  if (filters.size !== undefined) params.set("size", String(filters.size));

  const qs = params.toString();
  return request(qs ? `${API}?${qs}` : API);
}

export async function getTaskById(id) {
  return request(`${API}/${id}`);
}

export async function scheduleTask(data) {
  return request(API, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateTask(id, data) {
  return request(`${API}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteTask(id) {
  return request(`${API}/${id}`, { method: "DELETE" });
}

/* ------------------------------------------------------------------ */
/*  iCal Export                                                       */
/* ------------------------------------------------------------------ */

export async function exportTasksToICal() {
  const res = await fetch(`${API}/export/calendar.ics`, {
    headers: authHeaders(),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Export failed (${res.status})`);
  }
  return res.text();
}

/* ------------------------------------------------------------------ */
/*  Automation Rules                                                  */
/* ------------------------------------------------------------------ */

export async function listRules() {
  return request(`${AUTOMATION}/rules`);
}

export async function getRule(id) {
  return request(`${AUTOMATION}/rules/${id}`);
}

export async function createRule(data) {
  return request(`${AUTOMATION}/rules`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateRule(id, data) {
  return request(`${AUTOMATION}/rules/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteRule(id) {
  return request(`${AUTOMATION}/rules/${id}`, { method: "DELETE" });
}

export async function previewRule(id, startDate, endDate) {
  const params = new URLSearchParams();
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  const qs = params.toString();
  return request(`${AUTOMATION}/rules/${id}/preview${qs ? `?${qs}` : ""}`);
}

export async function generateTasks(id, startDate, endDate) {
  const params = new URLSearchParams();
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  const qs = params.toString();
  return request(`${AUTOMATION}/rules/${id}/generate${qs ? `?${qs}` : ""}`, {
    method: "POST",
  });
}

/* ------------------------------------------------------------------ */
/*  SLA                                                               */
/* ------------------------------------------------------------------ */

export async function getSlaSummary() {
  return request(`${AUTOMATION}/sla`);
}

export async function refreshSla() {
  return request(`${AUTOMATION}/sla/refresh`, { method: "POST" });
}

/* ------------------------------------------------------------------ */
/*  Workload                                                          */
/* ------------------------------------------------------------------ */

export async function getTechnicianWorkload() {
  return request(`${AUTOMATION}/workload`);
}

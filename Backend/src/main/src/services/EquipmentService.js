/**
 * EquipmentService — CRUD, CSV import/export, QR-code generation,
 * lifecycle actions, and timeline queries for equipment entities.
 */

import { readJson } from "../utils/safeSessionStorage";

const BASE_URL = "http://localhost:8081";
const API = `${BASE_URL}/api/equipment`;

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
  const res = await fetch(`${API}${path}`, {
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
/*  CRUD                                                              */
/* ------------------------------------------------------------------ */

export async function getAllEquipment(page = 0, size = 20) {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  return request(`?${params}`);
}

export async function getEquipmentById(id) {
  return request(`/${id}`);
}

export async function addEquipment(data) {
  return request("", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateEquipment(id, data) {
  return request(`/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteEquipment(id) {
  return request(`/${id}`, { method: "DELETE" });
}

/* ------------------------------------------------------------------ */
/*  CSV Import                                                        */
/* ------------------------------------------------------------------ */

export async function importEquipmentCsv(file) {
  const user = readJson("medtrack_user");
  const headers = {};
  if (user?.token) headers.Authorization = `Bearer ${user.token}`;

  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API}/import`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Import failed (${res.status})`);
  }
  return res.json();
}

export async function previewEquipmentImport(file) {
  const user = readJson("medtrack_user");
  const headers = {};
  if (user?.token) headers.Authorization = `Bearer ${user.token}`;

  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API}/import/preview`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Preview failed (${res.status})`);
  }
  return res.json();
}

/* ------------------------------------------------------------------ */
/*  Import Audit                                                      */
/* ------------------------------------------------------------------ */

export async function getEquipmentImportHistory() {
  return request("/imports/audit");
}

/* ------------------------------------------------------------------ */
/*  QR Code                                                           */
/* ------------------------------------------------------------------ */

export async function getEquipmentQrCode(id) {
  return request(`/${id}/qr-code`);
}

/* ------------------------------------------------------------------ */
/*  Lifecycle                                                         */
/* ------------------------------------------------------------------ */

export async function getEquipmentLifecycle(id) {
  return request(`/${id}/lifecycle`);
}

export async function createEquipmentLifecycleAction(equipmentId, data) {
  return request(`/${equipmentId}/lifecycle`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function approveEquipmentLifecycleAction(actionId) {
  return request(`/lifecycle/${actionId}/approve`, { method: "POST" });
}

export async function rejectEquipmentLifecycleAction(actionId, reason) {
  return request(`/lifecycle/${actionId}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export async function completeEquipmentLifecycleAction(actionId) {
  return request(`/lifecycle/${actionId}/complete`, { method: "POST" });
}

/* ------------------------------------------------------------------ */
/*  Timeline                                                          */
/* ------------------------------------------------------------------ */

export async function getEquipmentTimeline(id) {
  return request(`/${id}/timeline`);
}

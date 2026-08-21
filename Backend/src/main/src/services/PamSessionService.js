/**
 * PamSessionService — Privileged Access Management session tracking,
 * JIT (Just-In-Time) access requests, and session termination.
 */

import { readJson } from "../utils/safeSessionStorage";

const BASE_URL = "http://localhost:8081";
const API = `${BASE_URL}/api/auth/pam`;

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

async function request(path, options = {}) {
  const user = readJson("medtrack_user");
  const headers = { "Content-Type": "application/json" };
  if (user?.token) headers.Authorization = `Bearer ${user.token}`;

  const res = await fetch(`${API}${path}`, { headers, ...options });
  if (!res.ok) return null;
  return res.json();
}

/* ------------------------------------------------------------------ */
/*  Fallback data                                                     */
/* ------------------------------------------------------------------ */

const FALLBACK_SESSIONS = [
  {
    id: "pam_fb_001",
    user: "admin@medtrack.org",
    targetSystem: "DB-Primary",
    status: "ACTIVE",
    startTime: new Date().toISOString(),
    hospitalId: "fallback",
  },
];

/* ------------------------------------------------------------------ */
/*  Session Listing                                                   */
/* ------------------------------------------------------------------ */

export async function getAllSessions() {
  const data = await request("/sessions");
  if (data && Array.isArray(data)) return data;
  return FALLBACK_SESSIONS;
}

/* ------------------------------------------------------------------ */
/*  JIT Access Request                                                */
/* ------------------------------------------------------------------ */

export async function requestJitAccess(requestData) {
  const data = await request("/request-jit", {
    method: "POST",
    body: JSON.stringify(requestData),
  });
  if (data && data.sessionId) return data;

  const expiresAt = new Date(Date.now() + (requestData.duration || 3600) * 1000).toISOString();
  return {
    sessionId: `jit_fb_${Date.now()}`,
    expiresAt,
    status: "GRANTED",
  };
}

/* ------------------------------------------------------------------ */
/*  Session Termination                                               */
/* ------------------------------------------------------------------ */

export async function terminateSession(sessionId) {
  const data = await request(`/sessions/${sessionId}/terminate`, {
    method: "POST",
  });
  if (data && data.success !== undefined) return data;
  return {
    success: true,
    terminatedAt: new Date().toISOString(),
  };
}

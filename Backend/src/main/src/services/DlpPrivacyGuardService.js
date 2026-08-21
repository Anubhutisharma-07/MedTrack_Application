/**
 * DlpPrivacyGuardService — Data Loss Prevention rule management,
 * incident queries, rule toggling, and text-masking simulation.
 */

import { readJson } from "../utils/safeSessionStorage";

const BASE_URL = "http://localhost:8081";
const API = `${BASE_URL}/api/auth/dlp`;

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

const FALLBACK_RULES = [
  {
    id: "dlp_fb_r1",
    name: "Fallback PHI Block",
    status: "ACTIVE",
    pattern: ".*",
    action: "BLOCK",
    hospitalId: "fallback",
  },
];

const FALLBACK_INCIDENTS = [
  {
    id: "dlp_fb_i1",
    timestamp: new Date().toISOString(),
    ruleId: "dlp_fb_r1",
    severity: "MEDIUM",
    sourceUser: "system@medtrack.org",
    destination: "internal",
    hospitalId: "fallback",
  },
];

/* ------------------------------------------------------------------ */
/*  DLP Rules                                                         */
/* ------------------------------------------------------------------ */

export async function getDlpRules() {
  const data = await request("/rules");
  if (data && Array.isArray(data)) return data;
  return FALLBACK_RULES;
}

export async function toggleDlpRule(ruleId, newStatus) {
  const data = await request(`/rules/${ruleId}`, {
    method: "PUT",
    body: JSON.stringify({ status: newStatus }),
  });
  if (data && data.success !== undefined) return data;
  return { success: true, status: newStatus };
}

/* ------------------------------------------------------------------ */
/*  DLP Incidents                                                     */
/* ------------------------------------------------------------------ */

export async function getDlpIncidents() {
  const data = await request("/incidents");
  if (data && Array.isArray(data)) return data;
  return FALLBACK_INCIDENTS;
}

/* ------------------------------------------------------------------ */
/*  Text Masking Simulation                                           */
/* ------------------------------------------------------------------ */

export async function simulateTextMasking(text) {
  const data = await request("/simulate-masking", {
    method: "POST",
    body: JSON.stringify({ text }),
  });
  if (data && data.masked !== undefined) return data;

  // Simple client-side fallback: mask digits
  const masked = text.replace(/\d{3}-\d{2}-\d{4}/g, "SSN-***-**-XXXX");
  return {
    masked,
    original_length: text.length,
    algorithm: "PARTIAL_REDACT",
  };
}

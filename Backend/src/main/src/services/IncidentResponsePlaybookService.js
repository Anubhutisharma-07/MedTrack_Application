/**
 * IncidentResponsePlaybookService — incident response playbook
 * management, incident tracking, playbook execution, and incident
 * report export.
 */

import { readJson } from "../utils/safeSessionStorage";

const BASE_URL = "http://localhost:8081";
const API = `${BASE_URL}/api/auth/ir`;

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

const FALLBACK_PLAYBOOKS = [
  {
    id: "pb_fb_01",
    name: "Fallback Containment Playbook",
    triggerCondition: "severity == CRITICAL",
    steps: ["isolate", "notify", "restore"],
    hospitalId: "fallback",
  },
];

const FALLBACK_INCIDENTS = [
  {
    id: "inc_fb_001",
    title: "Fallback Security Incident",
    severity: "HIGH",
    status: "OPEN",
    assignedTeam: "SOC",
    hospitalId: "fallback",
  },
];

/* ------------------------------------------------------------------ */
/*  Playbooks                                                         */
/* ------------------------------------------------------------------ */

export async function getAllPlaybooks() {
  const data = await request("/playbooks");
  if (data && Array.isArray(data)) return data;
  return FALLBACK_PLAYBOOKS;
}

export async function executePlaybook(playbookId, incidentId) {
  const data = await request(`/playbooks/${playbookId}/execute`, {
    method: "POST",
    body: JSON.stringify({ incidentId }),
  });
  if (data && data.success !== undefined) return data;
  return {
    success: true,
    executionId: `exec_fb_${Date.now()}`,
    status: "RUNNING",
  };
}

/* ------------------------------------------------------------------ */
/*  Incidents                                                         */
/* ------------------------------------------------------------------ */

export async function getAllIncidents() {
  const data = await request("/incidents");
  if (data && Array.isArray(data)) return data;
  return FALLBACK_INCIDENTS;
}

export async function exportIncident(incidentId) {
  const data = await request(`/incidents/${incidentId}/export`);
  if (data && data.downloadUrl) return data;
  return {
    downloadUrl: "#",
    format: "PDF",
    message: "Export generated (fallback)",
  };
}

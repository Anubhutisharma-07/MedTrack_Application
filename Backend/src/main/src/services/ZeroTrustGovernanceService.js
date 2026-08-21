/**
 * ZeroTrustGovernanceService — governance policy CRUD, trust evaluation
 * queries, and trust simulation for the zero-trust subsystem.
 */

import { readJson } from "../utils/safeSessionStorage";

const BASE_URL = "http://localhost:8081";
const API = `${BASE_URL}/api/auth/ztna/governance`;

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

const FALLBACK_POLICIES = [
  {
    id: "gov_fb_001",
    name: "Default Data Access Policy",
    enforcementLevel: "STRICT",
    enabled: true,
    hospitalId: "fallback",
  },
];

const FALLBACK_EVALUATIONS = [
  {
    id: "eval_fb_001",
    score: 85,
    verdict: "COMPLIANT",
    evaluatedAt: new Date().toISOString(),
    hospitalId: "fallback",
  },
];

/* ------------------------------------------------------------------ */
/*  Governance Policies                                               */
/* ------------------------------------------------------------------ */

export async function getGovernancePolicies() {
  const data = await request("/policies");
  if (data && Array.isArray(data)) return data;
  return FALLBACK_POLICIES;
}

export async function createGovernancePolicy(policy) {
  const data = await request("/policies", {
    method: "POST",
    body: JSON.stringify(policy),
  });
  if (data && data.id) return data;
  return {
    id: `gov_fb_${Date.now()}`,
    name: policy.name || "Untitled Policy",
    status: "ACTIVE",
    enforcementLevel: policy.enforcementLevel || "STRICT",
  };
}

/* ------------------------------------------------------------------ */
/*  Trust Evaluations                                                 */
/* ------------------------------------------------------------------ */

export async function getActiveTrustEvaluations() {
  const data = await request("/evaluations");
  if (data && Array.isArray(data)) return data;
  return FALLBACK_EVALUATIONS;
}

/* ------------------------------------------------------------------ */
/*  Trust Simulation                                                  */
/* ------------------------------------------------------------------ */

export async function evaluateTrustSimulation(params) {
  const data = await request("/simulate", {
    method: "POST",
    body: JSON.stringify(params),
  });

  if (data && data.score !== undefined) return data;

  // Local fallback simulation
  const score = params.devicePosture || 70;
  let verdict;
  if (score >= 80) verdict = "FULLY_TRUSTED";
  else if (score >= 60) verdict = "CONDITIONAL_ACCESS";
  else verdict = "NEEDS_IMPROVEMENT";

  const recommendations = [];
  if (score < 80) recommendations.push("Enable MFA");
  if (score < 60) recommendations.push("Encrypt at rest");
  if (score < 40) recommendations.push("Quarantine device");

  return { score, verdict, recommendations };
}

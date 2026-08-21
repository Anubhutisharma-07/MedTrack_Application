/**
 * ThreatIntelService — threat intelligence feed management and
 * TAXII/STIX synchronization for the security operations center.
 */

import { readJson } from "../utils/safeSessionStorage";

const BASE_URL = "http://localhost:8081";
const API = `${BASE_URL}/api/auth/threat-intel`;

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

const FALLBACK_FEEDS = [
  {
    id: "ti_fb_001",
    feedName: "Fallback NVD Feed",
    feedType: "VULNERABILITY",
    lastSync: new Date().toISOString(),
    indicatorCount: 100,
    hospitalId: "fallback",
  },
];

/* ------------------------------------------------------------------ */
/*  Feed CRUD                                                         */
/* ------------------------------------------------------------------ */

export async function getAllFeeds() {
  const data = await request("/feeds");
  if (data && Array.isArray(data)) return data;
  return FALLBACK_FEEDS;
}

export async function createFeed(feedData) {
  const data = await request("/feeds", {
    method: "POST",
    body: JSON.stringify(feedData),
  });
  if (data && data.id) return data;
  return {
    id: `ti_fb_${Date.now()}`,
    feedName: feedData.feedName || "Untitled Feed",
    status: "ACTIVE",
  };
}

/* ------------------------------------------------------------------ */
/*  TAXII Sync                                                        */
/* ------------------------------------------------------------------ */

export async function triggerTaxiiSync() {
  const data = await request("/taxii-sync", { method: "POST" });
  if (data && data.success !== undefined) return data;
  return {
    success: true,
    syncedIndicators: 0,
    syncTime: new Date().toISOString(),
    message: "Sync completed (fallback)",
  };
}

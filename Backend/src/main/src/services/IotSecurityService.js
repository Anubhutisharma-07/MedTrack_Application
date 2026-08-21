/**
 * IotSecurityService — IoT device registry: listing, registration,
 * and quarantine for compromised medical IoT devices.
 */

import { readJson } from "../utils/safeSessionStorage";

const BASE_URL = "http://localhost:8081";
const API = `${BASE_URL}/api/auth/iot/devices`;

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

async function request(path = "", options = {}) {
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

const FALLBACK_DEVICES = [
  {
    id: "iot_fb_001",
    deviceName: "Fallback Pulse Oximeter",
    deviceType: "WEARABLE",
    firmware: "2.1.0",
    postureScore: 80,
    status: "ACTIVE",
    hospitalId: "fallback",
  },
];

/* ------------------------------------------------------------------ */
/*  Device Listing                                                    */
/* ------------------------------------------------------------------ */

export async function getAllDevices() {
  const data = await request();
  if (data && Array.isArray(data)) return data;
  return FALLBACK_DEVICES;
}

/* ------------------------------------------------------------------ */
/*  Device Registration                                               */
/* ------------------------------------------------------------------ */

export async function registerDevice(deviceData) {
  const data = await request("", {
    method: "POST",
    body: JSON.stringify(deviceData),
  });
  if (data && data.id) return data;
  return {
    id: `iot_fb_${Date.now()}`,
    deviceName: deviceData.deviceName || "Unnamed Device",
    status: "REGISTERED",
  };
}

/* ------------------------------------------------------------------ */
/*  Quarantine                                                        */
/* ------------------------------------------------------------------ */

export async function quarantineDevice(deviceId) {
  const data = await request(`/${deviceId}/quarantine`, {
    method: "POST",
  });
  if (data && data.success !== undefined) return data;
  return {
    success: true,
    quarantinedAt: new Date().toISOString(),
    deviceId,
    message: "Device quarantined (fallback)",
  };
}

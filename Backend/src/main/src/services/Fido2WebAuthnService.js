/**
 * Fido2WebAuthnService — FIDO2/WebAuthn credential management:
 * listing, registration, and attestation simulation.
 */

import { readJson } from "../utils/safeSessionStorage";

const BASE_URL = "http://localhost:8081";
const API = `${BASE_URL}/api/auth/fido2`;

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

const FALLBACK_CREDENTIALS = [
  {
    id: "cred_fb_001",
    keyName: "Fallback Security Key",
    keyType: "FIDO2",
    registeredAt: new Date().toISOString(),
    hospitalId: "fallback",
  },
];

/* ------------------------------------------------------------------ */
/*  Credential Listing                                                */
/* ------------------------------------------------------------------ */

export async function getAllCredentials() {
  const data = await request("/credentials");
  if (data && Array.isArray(data)) return data;
  return FALLBACK_CREDENTIALS;
}

/* ------------------------------------------------------------------ */
/*  Credential Registration                                           */
/* ------------------------------------------------------------------ */

export async function registerCredential(credData) {
  const data = await request("/credentials", {
    method: "POST",
    body: JSON.stringify(credData),
  });
  if (data && data.id) return data;
  return {
    id: `cred_fb_${Date.now()}`,
    keyName: credData.keyName || "Unnamed Key",
    status: "REGISTERED",
  };
}

/* ------------------------------------------------------------------ */
/*  Attestation Simulation                                            */
/* ------------------------------------------------------------------ */

export async function simulateAttestation(keyType) {
  const data = await request("/simulate-attestation", {
    method: "POST",
    body: JSON.stringify({ keyType }),
  });
  if (data && data.attestationObject) return data;
  return {
    attestationObject: `o2Nm_fb_${Date.now()}`,
    keyType: keyType || "ES256",
  };
}

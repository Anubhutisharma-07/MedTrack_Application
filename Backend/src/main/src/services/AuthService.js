/**
 * AuthService — authentication, registration, and authority-version
 * management for the MedTrack application.
 *
 * Dev-mode demo credentials short-circuit before hitting the real API
 * so the UI can be exercised without a running backend.
 */

import { writeJson, readJson, remove } from "../utils/safeSessionStorage";

const BASE_URL = "http://localhost:8081";
const API = `${BASE_URL}/api/auth`;

/* ------------------------------------------------------------------ */
/*  Demo credentials (dev-only)                                       */
/* ------------------------------------------------------------------ */

const DEMO_USERS = {
  "hospital@medtrack.com": {
    password: "admin123",
    token: "demo-token-hospital",
    user: {
      id: "demo-hosp-1",
      name: "Hospital Admin",
      email: "hospital@medtrack.com",
      phone: "555-0101",
      organization: "MedTrack General",
      role: "HOSPITAL",
    },
  },
  "tech@medtrack.com": {
    password: "tech123",
    token: "demo-token-technician",
    user: {
      id: "demo-tech-1",
      name: "Field Technician",
      email: "tech@medtrack.com",
      phone: "555-0102",
      organization: "MedTrack General",
      role: "TECHNICIAN",
    },
  },
  "supplier@medtrack.com": {
    password: "supply123",
    token: "demo-token-supplier",
    user: {
      id: "demo-supp-1",
      name: "Supplier Admin",
      email: "supplier@medtrack.com",
      phone: "555-0103",
      organization: "MedTrack Supplies Co.",
      role: "SUPPLIER",
    },
  },
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

async function request(path, options = {}) {
  const token = readJson("medtrack_user")?.token;
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API}${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Request failed (${res.status})`);
  }

  // Some endpoints return 204 No Content
  if (res.status === 204) return null;
  return res.json();
}

/* ------------------------------------------------------------------ */
/*  Login                                                             */
/* ------------------------------------------------------------------ */

export async function loginUser({ email, password }) {
  // Dev-mode demo shortcut
  const demo = DEMO_USERS[email];
  if (demo && demo.password === password) {
    writeJson("medtrack_user", { ...demo.user, token: demo.token });
    return { token: demo.token, user: demo.user };
  }

  // Real API
  const result = await request("/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  writeJson("medtrack_user", result.user ? { ...result.user, token: result.token } : result);
  return result;
}

/* ------------------------------------------------------------------ */
/*  Registration                                                      */
/* ------------------------------------------------------------------ */

export async function registerUser({ name, email, password, role }) {
  return request("/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password, role }),
  });
}

/* ------------------------------------------------------------------ */
/*  Forgot / Reset Password                                           */
/* ------------------------------------------------------------------ */

export async function forgotPassword({ email }) {
  return request("/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function verifyOtp({ email, otp }) {
  return request("/verify-otp", {
    method: "POST",
    body: JSON.stringify({ email, otp }),
  });
}

export async function resetPassword({ email, otp, newPassword }) {
  return request("/reset-password", {
    method: "POST",
    body: JSON.stringify({ email, otp, newPassword }),
  });
}

/* ------------------------------------------------------------------ */
/*  Authority Version                                                 */
/* ------------------------------------------------------------------ */

export async function getAuthorityVersion(userId) {
  return request(`/authority/version/${userId}`);
}

export async function incrementAuthorityVersion({ userId, reason }) {
  return request("/authority/version/increment", {
    method: "POST",
    body: JSON.stringify({ userId, reason }),
  });
}

export async function bumpGlobalAuthorityVersion({ reason }) {
  return request("/authority/version/bump-global", {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export async function getAuthorityAuditLogs(userId) {
  return request(`/authority/audit-logs/${userId}`);
}

/* ------------------------------------------------------------------ */
/*  Logout                                                            */
/* ------------------------------------------------------------------ */

export function logout() {
  remove("medtrack_user");
  remove("medtrack_authority");
}

import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

const BASE = "http://localhost:8081";
const server = setupServer(
  http.get(`${BASE}/api/auth/deidentification/jobs`, () => HttpResponse.json([
    { id: "job_001", patientCount: 120, method: "HIPAA_SAFE_HARBOR", status: "COMPLETED", createdAt: "2026-07-20T08:00:00Z" },
  ])),
  http.post(`${BASE}/api/auth/deidentification/jobs`, () => HttpResponse.json({ id: "job_new", status: "QUEUED", method: "K_ANONYMITY" })),
  http.post(`${BASE}/api/auth/deidentification/redact`, () => HttpResponse.json({ redacted: "Patient [REDACTED] was admitted to [REDACTED]", method: "HIPAA_SAFE_HARBOR", entitiesRemoved: 2 })),
);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

let svc;
beforeEach(async () => { vi.resetModules(); svc = await import("../../services/HipaaDeidentificationService"); });

describe("HipaaDeidentificationService", () => {
  it("fetches all deidentification jobs", async () => {
    const jobs = await svc.getAllJobs();
    expect(Array.isArray(jobs)).toBe(true);
    expect(jobs[0]).toHaveProperty("id", "job_001");
    expect(jobs[0]).toHaveProperty("method", "HIPAA_SAFE_HARBOR");
    expect(jobs[0]).toHaveProperty("patientCount", 120);
  });

  it("returns fallback jobs on API failure", async () => {
    server.use(http.get(`${BASE}/api/auth/deidentification/jobs`, () => HttpResponse.json(null, { status: 500 })));
    const jobs = await svc.getAllJobs();
    expect(jobs[0]).toHaveProperty("id");
    expect(jobs[0]).toHaveProperty("method");
  });

  it("creates a new deidentification job", async () => {
    const result = await svc.createJob({ method: "K_ANONYMITY", dataSource: "patients.csv" });
    expect(result).toHaveProperty("id", "job_new");
    expect(result).toHaveProperty("status", "QUEUED");
  });

  it("returns fallback on create job failure", async () => {
    server.use(http.post(`${BASE}/api/auth/deidentification/jobs`, () => HttpResponse.json(null, { status: 500 })));
    const result = await svc.createJob({ method: "L_DIVERSITY" });
    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("status");
  });

  it("redacts PHI from raw text", async () => {
    const result = await svc.redactText("John Smith SSN 123-45-6789", "HIPAA_SAFE_HARBOR");
    expect(result).toHaveProperty("redacted");
    expect(result).toHaveProperty("method", "HIPAA_SAFE_HARBOR");
    expect(result).toHaveProperty("entitiesRemoved", 2);
  });

  it("returns fallback redaction on API failure", async () => {
    server.use(http.post(`${BASE}/api/auth/deidentification/redact`, () => HttpResponse.json(null, { status: 500 })));
    const result = await svc.redactText("Test PHI data", "HIPAA_SAFE_HARBOR");
    expect(result).toHaveProperty("redacted");
    expect(result).toHaveProperty("method");
    expect(result).toHaveProperty("entitiesRemoved");
  });
});

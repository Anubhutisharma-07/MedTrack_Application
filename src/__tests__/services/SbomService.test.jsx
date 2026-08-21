import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

const BASE_URL = "http://localhost:8081";

const server = setupServer(
  http.get(`${BASE_URL}/api/auth/sbom/artifacts`, () =>
    HttpResponse.json([
      { artifactId: "art_001", artifactType: "DOCKER_IMAGE", slsaLevel: "SLSA_LEVEL_3" },
    ])
  ),
  http.post(`${BASE_URL}/api/auth/sbom/artifacts`, () =>
    HttpResponse.json({ artifactId: "art_new", complianceStatus: "COMPLIANT" })
  ),
  http.get(`${BASE_URL}/api/auth/sbom/components`, () =>
    HttpResponse.json([
      { componentId: "cmp_001", name: "react", version: "18.2.0", licenseType: "MIT" },
    ])
  ),
  http.post(`${BASE_URL}/api/auth/sbom/components`, () =>
    HttpResponse.json({ componentId: "cmp_new" })
  ),
  http.post(`${BASE_URL}/api/auth/sbom/artifacts/:id/attest`, () =>
    HttpResponse.json({ attestationId: "att_001", slsaLevel: "SLSA_LEVEL_3" })
  ),
  http.get(`${BASE_URL}/api/auth/sbom/artifacts/:id/cyclonedx`, () =>
    HttpResponse.json({ format: "CycloneDX", version: "1.5", components: [] })
  )
);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

let svc;
beforeEach(async () => {
  vi.resetModules();
  svc = await import("../../services/SbomService");
});

describe("SbomService", () => {
  describe("getAllArtifacts", () => {
    it("fetches all build artifacts", async () => {
      const artifacts = await svc.getAllArtifacts();
      expect(Array.isArray(artifacts)).toBe(true);
      expect(artifacts[0].artifactId).toBe("art_001");
      expect(artifacts[0].slsaLevel).toBe("SLSA_LEVEL_3");
    });

    it("returns fallback artifacts on API failure", async () => {
      server.use(
        http.get(`${BASE_URL}/api/auth/sbom/artifacts`, () =>
          HttpResponse.json(null, { status: 500 })
        )
      );
      const artifacts = await svc.getAllArtifacts();
      expect(Array.isArray(artifacts)).toBe(true);
      expect(artifacts.length).toBeGreaterThan(0);
      expect(artifacts[0]).toHaveProperty("artifactId");
      expect(artifacts[0]).toHaveProperty("sha256Digest");
      expect(artifacts[0]).toHaveProperty("slsaLevel");
    });
  });

  describe("registerArtifact", () => {
    it("registers a new build artifact", async () => {
      const result = await svc.registerArtifact({
        artifactId: "art_new",
        artifactType: "NPM_PACKAGE",
        sha256Digest: "abc123",
      });
      expect(result).toHaveProperty("artifactId", "art_new");
      expect(result).toHaveProperty("complianceStatus", "COMPLIANT");
    });

    it("returns fallback artifact on API failure", async () => {
      server.use(
        http.post(`${BASE_URL}/api/auth/sbom/artifacts`, () =>
          HttpResponse.json(null, { status: 500 })
        )
      );
      const result = await svc.registerArtifact({
        artifactId: "art_fallback",
        artifactType: "DOCKER_IMAGE",
        sha256Digest: "def456",
      });
      expect(result).toHaveProperty("artifactId", "art_fallback");
      expect(result).toHaveProperty("complianceStatus");
      expect(result).toHaveProperty("createdAt");
    });
  });

  describe("getAllComponents", () => {
    it("fetches all dependency components", async () => {
      const components = await svc.getAllComponents();
      expect(Array.isArray(components)).toBe(true);
      expect(components[0].name).toBe("react");
      expect(components[0].licenseType).toBe("MIT");
    });

    it("returns fallback components on API failure", async () => {
      server.use(
        http.get(`${BASE_URL}/api/auth/sbom/components`, () =>
          HttpResponse.json(null, { status: 503 })
        )
      );
      const components = await svc.getAllComponents();
      expect(Array.isArray(components)).toBe(true);
      expect(components.length).toBeGreaterThan(0);
      expect(components[0]).toHaveProperty("componentId");
      expect(components[0]).toHaveProperty("name");
    });
  });

  describe("ingestComponent", () => {
    it("ingests a new component dependency", async () => {
      const result = await svc.ingestComponent({
        name: "lodash",
        version: "4.17.21",
        licenseType: "MIT",
      });
      expect(result).toHaveProperty("componentId");
    });

    it("returns fallback on API failure", async () => {
      server.use(
        http.post(`${BASE_URL}/api/auth/sbom/components`, () =>
          HttpResponse.json(null, { status: 500 })
        )
      );
      const result = await svc.ingestComponent({ name: "vue", version: "3.0" });
      expect(result).toHaveProperty("componentId");
    });
  });

  describe("generateAttestation", () => {
    it("generates SLSA attestation for an artifact", async () => {
      const result = await svc.generateAttestation("art_001");
      expect(result).toHaveProperty("attestationId");
      expect(result).toHaveProperty("slsaLevel");
    });

    it("returns fallback attestation on API failure", async () => {
      server.use(
        http.post(`${BASE_URL}/api/auth/sbom/artifacts/:id/attest`, () =>
          HttpResponse.json(null, { status: 500 })
        )
      );
      const result = await svc.generateAttestation("art_001");
      expect(result).toHaveProperty("attestationId");
      expect(result).toHaveProperty("slsaLevel");
    });
  });

  describe("getCycloneDxManifest", () => {
    it("fetches CycloneDX manifest for an artifact", async () => {
      const manifest = await svc.getCycloneDxManifest("art_001");
      expect(manifest).toHaveProperty("format", "CycloneDX");
      expect(manifest).toHaveProperty("version", "1.5");
    });

    it("returns fallback manifest on API failure", async () => {
      server.use(
        http.get(`${BASE_URL}/api/auth/sbom/artifacts/:id/cyclonedx`, () =>
          HttpResponse.json(null, { status: 500 })
        )
      );
      const manifest = await svc.getCycloneDxManifest("art_001");
      expect(manifest).toHaveProperty("format");
      expect(manifest).toHaveProperty("components");
    });
  });
});

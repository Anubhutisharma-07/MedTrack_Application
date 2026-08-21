import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

const BASE = "http://localhost:8081";

const server = setupServer(
  // QKD
  http.get(`${BASE}/api/auth/qkd/nodes`, () =>
    HttpResponse.json([{ nodeId: "QKD-001", nodeName: "Metro Fiber Link", nodeStatus: "QUANTUM_LINK_ESTABLISHED" }])
  ),
  http.post(`${BASE}/api/auth/qkd/nodes`, () =>
    HttpResponse.json({ nodeId: "QKD-NEW", nodeStatus: "QUANTUM_LINK_ESTABLISHED" })
  ),
  http.post(`${BASE}/api/auth/qkd/nodes/:id/exchange-sim`, () =>
    HttpResponse.json({ eavesdropperDetected: false, siftedKeyLengthBits: 4096 })
  ),
  // PQC
  http.get(`${BASE}/api/auth/pqc/keys`, () =>
    HttpResponse.json([{ keyId: "PQC-001", algorithm: "Kyber-1024", status: "ACTIVE_ENFORCED" }])
  ),
  http.post(`${BASE}/api/auth/pqc/keys`, () =>
    HttpResponse.json({ keyId: "PQC-NEW", status: "ACTIVE_ENFORCED" })
  ),
  http.post(`${BASE}/api/auth/pqc/simulate`, () =>
    HttpResponse.json({ operationType: "KEY_ENCAPSULATION_KEM", executionTimeMs: 1.5 })
  ),
  // CTEM
  http.get(`${BASE}/api/auth/ctem/assets`, () =>
    HttpResponse.json([{ assetId: "CTEM-001", assetName: "Telehealth Portal", cvssScore: 8.8 }])
  ),
  http.post(`${BASE}/api/auth/ctem/assets`, () =>
    HttpResponse.json({ assetId: "CTEM-NEW", exposureVerdict: "LOW_EXPOSURE_MONITORED" })
  ),
  http.post(`${BASE}/api/auth/ctem/assets/:id/attack-path-sim`, () =>
    HttpResponse.json({ simulatedExploitPath: "Public IP -> Gateway -> DB", attackBlastRadius: "Low" })
  ),
  // CSPM
  http.get(`${BASE}/api/auth/cspm/accounts`, () =>
    HttpResponse.json([{ accountId: "AWS-001", provider: "AWS", status: "CONNECTED" }])
  ),
  http.post(`${BASE}/api/auth/cspm/accounts`, () =>
    HttpResponse.json({ accountId: "AZ-NEW", status: "CONNECTED" })
  ),
  http.get(`${BASE}/api/auth/cspm/findings`, () =>
    HttpResponse.json([{ findingId: "FIND-001", severity: "HIGH", status: "OPEN" }])
  ),
  http.post(`${BASE}/api/auth/cspm/findings/ingest`, () =>
    HttpResponse.json({ findingId: "FIND-NEW", status: "INGESTED" })
  ),
  http.put(`${BASE}/api/auth/cspm/findings/:id/remediate`, () =>
    HttpResponse.json({ findingId: "FIND-001", status: "REMEDIATED" })
  ),
);

beforeEach(() => sessionStorage.clear());
beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

import { getQkdNodes, provisionQkdNode, runQkdExchangeSimulation, getQkdStandards } from "../../../services/QkdKeyDistributionService";
import { getPqcKeyPairs, generatePqcKeyPair, runPqcSimulation, getNistPqcStandards } from "../../../services/PostQuantumCryptoService";
import { getCtemAssets, onboardCtemAsset, runAttackPathSimulation, getCtemStandards } from "../../../services/HealthcareCtemService";
import { getAllAccounts, registerCloudAccount, getAllFindings, ingestFinding, remediateFinding } from "../../../services/CspmService";

describe("QkdKeyDistributionService", () => {
  it("getQkdNodes returns node list", async () => {
    const data = await getQkdNodes();
    expect(data).toHaveLength(1);
    expect(data[0].nodeStatus).toBe("QUANTUM_LINK_ESTABLISHED");
  });

  it("provisionQkdNode provisions a node", async () => {
    const result = await provisionQkdNode({ nodeName: "New Node" });
    expect(result.nodeId).toBe("QKD-NEW");
  });

  it("runQkdExchangeSimulation runs key exchange", async () => {
    const result = await runQkdExchangeSimulation("QKD-001");
    expect(result.eavesdropperDetected).toBe(false);
    expect(result.siftedKeyLengthBits).toBe(4096);
  });

  it("getQkdStandards returns standards", async () => {
    const data = await getQkdStandards();
    expect(data).toHaveLength(3);
    expect(data[0].standard).toContain("CNSA");
  });

  it("getQkdNodes falls back on error", async () => {
    server.use(http.get(`${BASE}/api/auth/qkd/nodes`, () => HttpResponse.error("fail")));
    const data = await getQkdNodes();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });

  it("provisionQkdNode falls back on error", async () => {
    server.use(http.post(`${BASE}/api/auth/qkd/nodes`, () => HttpResponse.error("fail")));
    const result = await provisionQkdNode({});
    expect(result.nodeId).toContain("QKD-NODE-");
  });

  it("runQkdExchangeSimulation falls back on error", async () => {
    server.use(http.post(`${BASE}/api/auth/qkd/nodes/:id/exchange-sim`, () => HttpResponse.error("fail")));
    const result = await runQkdExchangeSimulation("QKD-999");
    expect(result.eavesdropperDetected).toBe(false);
    expect(result.siftedKeyLengthBits).toBe(4096);
  });
});

describe("PostQuantumCryptoService", () => {
  it("getPqcKeyPairs returns key list", async () => {
    const data = await getPqcKeyPairs();
    expect(data).toHaveLength(1);
    expect(data[0].algorithm).toBe("Kyber-1024");
  });

  it("generatePqcKeyPair generates a key", async () => {
    const result = await generatePqcKeyPair({ keyAlias: "New Key" });
    expect(result.keyId).toBe("PQC-NEW");
    expect(result.status).toBe("ACTIVE_ENFORCED");
  });

  it("runPqcSimulation runs a simulation", async () => {
    const result = await runPqcSimulation("CRYSTALS-Kyber-1024", "test payload");
    expect(result.operationType).toBeDefined();
    expect(result.executionTimeMs).toBeDefined();
  });

  it("getNistPqcStandards returns standards", async () => {
    const data = await getNistPqcStandards();
    expect(data).toHaveLength(4);
    expect(data[0].name).toContain("Kyber");
    expect(data[3].status).toBe("PENDING_FIPS_PUB");
  });

  it("getPqcKeyPairs falls back on error", async () => {
    server.use(http.get(`${BASE}/api/auth/pqc/keys`, () => HttpResponse.error("fail")));
    const data = await getPqcKeyPairs();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(data[0].keyId).toBe("PQC-KEY-901");
  });

  it("generatePqcKeyPair falls back on error", async () => {
    server.use(http.post(`${BASE}/api/auth/pqc/keys`, () => HttpResponse.error("fail")));
    const result = await generatePqcKeyPair({});
    expect(result.keyId).toContain("PQC-KEY-");
  });

  it("runPqcSimulation falls back on error", async () => {
    server.use(http.post(`${BASE}/api/auth/pqc/simulate`, () => HttpResponse.error("fail")));
    const result = await runPqcSimulation("CRYSTALS-Kyber-1024", "data");
    expect(result.operationType).toBe("KEY_ENCAPSULATION_KEM");
  });
});

describe("HealthcareCtemService", () => {
  it("getCtemAssets returns asset list", async () => {
    const data = await getCtemAssets();
    expect(data).toHaveLength(1);
    expect(data[0].assetName).toBe("Telehealth Portal");
  });

  it("onboardCtemAsset onboards an asset", async () => {
    const result = await onboardCtemAsset({ assetName: "New Asset" });
    expect(result.assetId).toBe("CTEM-NEW");
  });

  it("runAttackPathSimulation runs simulation", async () => {
    const result = await runAttackPathSimulation("CTEM-001");
    expect(result.simulatedExploitPath).toBeDefined();
    expect(result.attackBlastRadius).toBeDefined();
  });

  it("getCtemStandards returns standards", async () => {
    const data = await getCtemStandards();
    expect(data).toHaveLength(3);
    expect(data[0].standard).toContain("Gartner");
  });

  it("getCtemAssets falls back on error", async () => {
    server.use(http.get(`${BASE}/api/auth/ctem/assets`, () => HttpResponse.error("fail")));
    const data = await getCtemAssets();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });

  it("onboardCtemAsset falls back on error", async () => {
    server.use(http.post(`${BASE}/api/auth/ctem/assets`, () => HttpResponse.error("fail")));
    const result = await onboardCtemAsset({});
    expect(result.assetId).toContain("CTEM-AST-");
  });

  it("runAttackPathSimulation falls back on error", async () => {
    server.use(http.post(`${BASE}/api/auth/ctem/assets/:id/attack-path-sim

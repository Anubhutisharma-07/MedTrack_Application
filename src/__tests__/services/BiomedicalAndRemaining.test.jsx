import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

const BASE = "http://localhost:8081";
const server = setupServer(
  http.get(`${BASE}/api/auth/ai-watermark/datasets`, () => HttpResponse.json([{ datasetId: "WM-001", name: "Training Data" }])),
  http.post(`${BASE}/api/auth/ai-watermark/datasets`, () => HttpResponse.json({ datasetId: "WM-NEW" })),
  http.post(`${BASE}/api/auth/ai-watermark/datasets/WM-001/verify-c2pa`, () => HttpResponse.json({ verified: true, manifest: "valid" })),
  http.get(`${BASE}/api/auth/blockchain/blocks`, () => HttpResponse.json([{ blockId: "BL-001", hash: "0xabc" }])),
  http.post(`${BASE}/api/auth/blockchain/blocks`, () => HttpResponse.json({ blockId: "BL-NEW" })),
  http.post(`${BASE}/api/auth/blockchain/verify-zkp`, () => HttpResponse.json({ valid: true, proofType: "SNARK" })),
  http.get(`${BASE}/api/auth/data-mesh/domains`, () => HttpResponse.json([{ domainId: "DM-001", name: "Clinical Data" }])),
  http.post(`${BASE}/api/auth/data-mesh/domains`, () => HttpResponse.json({ domainId: "DM-NEW" })),
  http.post(`${BASE}/api/auth/data-mesh/domains/DM-001/evaluate-policy`, () => HttpResponse.json({ compliant: true })),
  http.get(`${BASE}/api/auth/incident-command/incidents`, () => HttpResponse.json([{ incidentId: "IC-001", severity: "HIGH" }])),
  http.post(`${BASE}/api/auth/incident-command/incidents`, () => HttpResponse.json({ incidentId: "IC-NEW" })),
  http.post(`${BASE}/api/auth/incident-command/incidents/IC-001/restore-airgap`, () => HttpResponse.json({ restored: true })),
  http.get(`${BASE}/api/auth/mpc-hsm/vaults`, () => HttpResponse.json([{ vaultId: "MPC-001", threshold: "3-of-5" }])),
  http.post(`${BASE}/api/auth/mpc-hsm/vaults`, () => HttpResponse.json({ vaultId: "MPC-NEW" })),
  http.post(`${BASE}/api/auth/mpc-hsm/vaults/MPC-001/threshold-sign`, () => HttpResponse.json({ signatureValid: true })),
  http.get(`${BASE}/api/auth/soar/playbooks`, () => HttpResponse.json([{ playbookId: "SB-001", name: "Auto Respond" }])),
  http.post(`${BASE}/api/auth/soar/playbooks`, () => HttpResponse.json({ playbookId: "SB-NEW" })),
  http.post(`${BASE}/api/auth/soar/playbooks/SB-001/execute-sim`, () => HttpResponse.json({ simulated: true, score: 98 })),
  http.get(`${BASE}/api/auth/did-vc/credentials`, () => HttpResponse.json([{ credentialId: "VC-001", type: "DID" }])),
  http.post(`${BASE}/api/auth/did-vc/credentials`, () => HttpResponse.json({ credentialId: "VC-NEW" })),
  http.post(`${BASE}/api/auth/did-vc/credentials/VC-001/verify-zkp`, () => HttpResponse.json({ verified: true })),
  http.get(`${BASE}/api/auth/evidence/policy`, () => HttpResponse.json({ immutable: true })),
  http.put(`${BASE}/api/auth/evidence/policy`, () => HttpResponse.json({ success: true })),
  http.post(`${BASE}/api/auth/evidence/records/ingest`, () => HttpResponse.json({ recordId: "EV-NEW" })),
  http.post(`${BASE}/api/auth/evidence/chain/verify`, () => HttpResponse.json({ chainValid: true, blockCount: 50 })),
  http.get(`${BASE}/api/auth/evidence/records`, () => HttpResponse.json([{ recordId: "EV-001", type: "Audit Log" }])),
  http.get(`${BASE}/api/auth/evidence/chain/logs`, () => HttpResponse.json([{ action: "INGESTED" }])),
  http.get(`${BASE}/api/auth/threatintel/config`, () => HttpResponse.json({ feedEnabled: true, refreshInterval: 300 })),
  http.put(`${BASE}/api/auth/threatintel/config`, () => HttpResponse.json({ success: true })),
  http.post(`${BASE}/api/auth/threatintel/ioc/ingest`, () => HttpResponse.json({ indicatorId: "IOC-NEW" })),
  http.post(`${BASE}/api/auth/threatintel/mitigate/trigger`, () => HttpResponse.json({ mitigated: true })),
  http.get(`${BASE}/api/auth/threatintel/ioc`, () => HttpResponse.json([{ indicatorId: "IOC-001", type: "IP" }])),
  http.get(`${BASE}/api/auth/threatintel/mitigate/logs`, () => HttpResponse.json([{ action: "BLOCKED" }])),
);
beforeEach(() => sessionStorage.clear());
beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

import { getWatermarkedAiDatasets, watermarkAiDataset, verifyC2paManifest } from "../../../services/BiomedicalAiWatermarkService";
import { getBlockchainBlocks, mineAuditBlock, verifyZkpTransaction } from "../../../services/BiomedicalBlockchainService";
import { getDataMeshDomains, onboardDataMeshDomain, evaluateDataMeshPolicy } from "../../../services/BiomedicalDataMeshService";
import { getResilienceIncidents, triggerFailoverCommand, runAirgapRestorationSimulation } from "../../../services/BiomedicalIncidentCommandService";
import { getMpcVaults, provisionMpcVault, runMpcSignatureSimulation } from "../../../services/BiomedicalMpcHsmService";
import { getSoarPlaybooks, deploySoarPlaybook, runPlaybookSimulation } from "../../../services/BiomedicalSoarService";
import { getVerifiableCredentials, issueVerifiableCredential, verifyCredentialPresentation } from "../../../services/BiomedicalSovereignIdentityService";
import { getActivePolicy, updatePolicy, ingestEvidenceRecord, verifyEvidenceChain, getAllRecords, getAllChainLogs } from "../../../services/ComplianceEvidenceService";
import { getActiveFeedConfig, updateFeedConfig, ingestIndicator, triggerMitigation, getAllIndicators, getAllMitigationLogs } from "../../../services/ThreatIntelligenceService";

describe("BiomedicalAiWatermarkService", () => {
  it("getWatermarkedAiDatasets returns list", async () => { const d = await getWatermarkedAiDatasets(); expect(d).toHaveLength(1); expect(d[0].name).toBe("Training Data"); });
  it("watermarkAiDataset watermarks", async () => { const r = await watermarkAiDataset({ name: "New Data" }); expect(r.datasetId).toBe("WM-NEW"); });
  it("verifyC2paManifest verifies", async () => { const r = await verifyC2paManifest("WM-001"); expect(r.verified).toBe(true); });
});

describe("BiomedicalBlockchainService", () => {
  it("getBlockchainBlocks returns blocks", async () => { const d = await getBlockchainBlocks(); expect(d).toHaveLength(1); expect(d[0].hash).toBe("0xabc"); });
  it("mineAuditBlock mines block", async () => { const r = await mineAuditBlock({ data: "audit" }); expect(r.blockId).toBe("BL-NEW"); });
  it("verifyZkpTransaction verifies", async () => { const r = await verifyZkpTransaction("0xabc"); expect(r.valid).toBe(true); expect(r.proofType).toBe("SNARK"); });
});

describe("BiomedicalDataMeshService", () => {
  it("getDataMeshDomains returns domains", async () => { const d = await getDataMeshDomains(); expect(d).toHaveLength(1); expect(d[0].name).toBe("Clinical Data"); });
  it("onboardDataMeshDomain onboardes", async () => { const r = await onboardDataMeshDomain({ name: "New Domain" }); expect(r.domainId).toBe("DM-NEW"); });
  it("evaluateDataMeshPolicy evaluates", async () => { const r = await evaluateDataMeshPolicy("DM-001"); expect(r.compliant).toBe(true); });
});

describe("BiomedicalIncidentCommandService", () => {
  it("getResilienceIncidents returns incidents", async () => { const d = await getResilienceIncidents(); expect(d).toHaveLength(1); expect(d[0].severity).toBe("HIGH"); });
  it("triggerFailoverCommand triggers", async () => { const r = await triggerFailoverCommand({ type: "FAILOVER" }); expect(r.incidentId).toBe("IC-NEW"); });
  it("runAirgapRestorationSimulation runs sim", async () => { const r = await runAirgapRestorationSimulation("IC-001"); expect(r.restored).toBe(true); });
});

describe("BiomedicalMpcHsmService", () => {
  it("getMpcVaults returns vaults", async () => { const d = await getMpcVaults(); expect(d).toHaveLength(1); expect(d[0].threshold).toBe("3-of-5"); });
  it("provisionMpcVault provisions", async () => { const r = await provisionMpcVault({ threshold: "2-of-3" }); expect(r.vaultId).toBe("MPC-NEW"); });
  it("runMpcSignatureSimulation runs sim", async () => { const r = await runMpcSignatureSimulation("MPC-001"); expect(r.signatureValid).toBe(true); });
});

describe("BiomedicalSoarService", () => {
  it("getSoarPlaybooks returns playbooks", async () => { const d =

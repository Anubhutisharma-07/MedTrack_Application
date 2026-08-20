import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

const BASE = "http://localhost:8081";
const server = setupServer(
  http.get(`${BASE}/api/auth/threat/policy`, () => HttpResponse.json({ autoContain: true })),
  http.put(`${BASE}/api/auth/threat/policy`, () => HttpResponse.json({ success: true })),
  http.post(`${BASE}/api/auth/threat/incidents`, () => HttpResponse.json({ incidentId: "TI-NEW" })),
  http.post(`${BASE}/api/auth/threat/containment`, () => HttpResponse.json({ contained: true })),
  http.get(`${BASE}/api/auth/threat/incidents`, () => HttpResponse.json([{ incidentId: "TI-001", severity: "CRITICAL" }])),
  http.get(`${BASE}/api/auth/threat/containment-actions`, () => HttpResponse.json([{ actionId: "CA-001", type: "BLOCK_IP" }])),
  http.get(`${BASE}/api/auth/vulnerability/policy`, () => HttpResponse.json({ autoPatch: true })),
  http.put(`${BASE}/api/auth/vulnerability/policy`, () => HttpResponse.json({ success: true })),
  http.post(`${BASE}/api/auth/vulnerability/report`, () => HttpResponse.json({ vulnId: "VULN-NEW" })),
  http.post(`${BASE}/api/auth/vulnerability/patch`, () => HttpResponse.json({ patchId: "PATCH-001" })),
  http.post(`${BASE}/api/auth/vulnerability/scan`, () => HttpResponse.json({ scanId: "VS-001", findings: 5 })),
  http.get(`${BASE}/api/auth/vulnerability/list`, () => HttpResponse.json([{ vulnId: "V-001", severity: "HIGH" }])),
  http.get(`${BASE}/api/auth/vulnerability/patch-logs`, () => HttpResponse.json([{ patchId: "PL-001", status: "APPLIED" }])),
  http.get(`${BASE}/api/auth/sdp/enclaves`, () => HttpResponse.json([{ enclaveId: "EN-001", status: "ACTIVE" }])),
  http.post(`${BASE}/api/auth/sdp/enclaves`, () => HttpResponse.json({ enclaveId: "EN-NEW" })),
  http.post(`${BASE}/api/auth/sdp/enclaves/EN-001/spa-knock`, () => HttpResponse.json({ spaResult: "GRANTED", latencyMs: 12 })),
  http.get(`${BASE}/api/auth/zerotrust/policy`, () => HttpResponse.json({ enforceAll: true })),
  http.put(`${BASE}/api/auth/zerotrust/policy`, () => HttpResponse.json({ success: true })),
  http.get(`${BASE}/api/auth/zerotrust/threat-logs`, () => HttpResponse.json([{ ip: "10.0.0.1", threat: "BRUTE_FORCE" }])),
  http.get(`${BASE}/api/auth/zerotrust/violations`, () => HttpResponse.json([{ violationId: "ZV-001", type: "UNAUTHORIZED_ACCESS" }])),
  http.get(`${BASE}/api/auth/microsegmentation/rules`, () => HttpResponse.json([{ ruleId: "MS-001", name: "Isolate PCI" }])),
  http.post(`${BASE}/api/auth/microsegmentation/rules`, () => HttpResponse.json({ ruleId: "MS-NEW" })),
  http.get(`${BASE}/api/auth/microsegmentation/tunnels`, () => HttpResponse.json([{ tunnelId: "MT-001", status: "ESTABLISHED" }])),
  http.get(`${BASE}/api/auth/cspm/assets`, () => HttpResponse.json([{ assetId: "CSA-001", type: "S3_BUCKET" }])),
  http.post(`${BASE}/api/auth/cspm/assets`, () => HttpResponse.json({ assetId: "CSA-NEW" })),
  http.post(`${BASE}/api/auth/cspm/assets/CSA-001/remediate`, () => HttpResponse.json({ remediated: true })),
  http.get(`${BASE}/api/auth/saml/config`, () => HttpResponse.json({ enabled: true, provider: "Okta" })),
  http.put(`${BASE}/api/auth/saml/config`, () => HttpResponse.json({ success: true })),
  http.post(`${BASE}/api/auth/saml/assertion/process`, () => HttpResponse.json({ authenticated: true })),
  http.get(`${BASE}/api/auth/saml/sessions`, () => HttpResponse.json([{ sessionId: "SAM-001", user: "admin@medtrack.org" }])),
  http.get(`${BASE}/api/auth/scim/policy`, () => HttpResponse.json({ autoProvision: true })),
  http.put(`${BASE}/api/auth/scim/policy`, () => HttpResponse.json({ success: true })),
  http.post(`${BASE}/api/auth/scim/users/provision`, () => HttpResponse.json({ userId: "SCIM-NEW", provisioned: true })),
  http.post(`${BASE}/api/auth/scim/users/deprovision`, () => HttpResponse.json({ deprovisioned: true })),
  http.get(`${BASE}/api/auth/scim/users`, () => HttpResponse.json([{ userId: "SU-001", email: "nurse@medtrack.org" }])),
  http.get(`${BASE}/api/auth/scim/audit-logs`, () => HttpResponse.json([{ action: "PROVISIONED" }])),
  http.get(`${BASE}/api/auth/clinical-ai/models`, () => HttpResponse.json([{ modelId: "CAI-001", name: "Drug Interact" }])),
  http.post(`${BASE}/api/auth/clinical-ai/models`, () => HttpResponse.json({ modelId: "CAI-NEW" })),
  http.post(`${BASE}/api/auth/clinical-ai/models/CAI-001/adversarial-sim`, () => HttpResponse.json({ robustness: 94 })),
  http.get(`${BASE}/api/auth/trial-ledger/blocks`, () => HttpResponse.json([{ blockId: "BL-001", hash: "0xabc" }])),
  http.post(`${BASE}/api/auth/trial-ledger/blocks`, () => HttpResponse.json({ blockId: "BL-NEW" })),
  http.get(`${BASE}/api/auth/trial-ledger/validate`, () => HttpResponse.json({ chainValid: true, blockCount: 42 })),
  http.get(`${BASE}/api/auth/genomics/records`, () => HttpResponse.json([{ recordId: "GR-001", gene: "BRCA1" }])),
  http.post(`${BASE}/api/auth/genomics/records`, () => HttpResponse.json({ recordId: "GR-NEW" })),
  http.post(`${BASE}/api/auth/genomics/homomorphic-query`, () => HttpResponse.json({ queryResult: "MATCH_FOUND", encrypted: true })),
  http.get(`${BASE}/api/auth/fhe/enclaves`, () => HttpResponse.json([{ enclaveId: "FHE-001", status: "ACTIVE" }])),
  http.post(`${BASE}/api/auth/fhe/enclaves`, () => HttpResponse.json({ enclaveId: "FHE-NEW" })),
  http.post(`${BASE}/api/auth/fhe/enclaves/FHE-001/execute-query`, () => HttpResponse.json({ queryResult: "encrypted_result", computationTimeMs: 120 })),
  http.post(`${BASE}/api/auth/vulnerability/cve/ingest`, () => HttpResponse.json({ cveId: "CVE-NEW" })),
  http.post(`${BASE}/api/auth/vulnerability/patch/trigger`, () => HttpResponse.json({ triggered: true })),
  http.get(`${BASE}/api/auth/vulnerability/cve`, () => HttpResponse.json([{ cveId: "CVE-2026-1234", severity: "CRITICAL" }])),
  http.get(`${BASE}/api/auth/vulnerability/patch/logs`, () => HttpResponse.json([{ logId: "PL-NEW", status: "APPLIED" }])),
);
beforeEach(() => sessionStorage.clear());
beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

import { getActivePolicy as getThreatPolicy, updatePolicy as updateThreatPolicy, reportIncident, executeContainment, getAllIncidents, getAllContainmentActions } from "../../../services/SecurityThreatService";
import { getActivePolicy as getVulnPolicy, updatePolicy as updateVulnPolicy, reportVulnerability, applyPatch, runVulnerabilityScan, getAllVulnerabilities, getAllPatchLogs } from "../../../services/SecurityVulnerabilityService";
import { getSdpEnclaves, provisionSdpEnclave, runSpaKnockSimulation } from "../../../services/ZeroTrustSdpService";
import { getActivePolicy as getZTPolicy, updatePolicy as updateZTPolicy, getAllIpThreatLogs, getAllViolations } from "../../../services/ZeroTrustSecurityService";
import { getAllPolicies, createRule, getAllTunnels } from "../../../services/MicrosegmentationService";
import { getCloudAssets, remediateCloudAsset, onboardCloudAsset } from "../../../services/HealthcareCspmService";
import { getActiveConfig, updateConfig as updateSamlConfig, processSamlAssertion, getAllSessionLogs } from "../../../services/SamlIdentityProviderService";
import { getActivePolicy as getScimPolicy, updatePolicy as updateScimPolicy, provisionScimUser, deprovisionScimUser, getAllUserMappings, getAllAuditLogs as getScimAuditLogs } from "../../../services/ScimProvisioningService";
import { getClinicalAiModels, registerClinicalAiModel, runAdversarialAttackSimulation } from "../../../services/ClinicalAiDefenseService";
import { getTrialBlocks, recordTrialEntry, validateChainIntegrity } from "../../../services/ClinicalTrialLedgerService";
import { getGenomicRecords, vaultGenomicRecord, runHomomorphicDnaQuery } from "../../../services/GenomicDataVaultService";
import { getFheEnclaves, provisionFheEnclave, runFheQuerySimulation } from "../../../services/HomomorphicEncryptionService";
import { getActivePolicy as getVMPolicy, updatePolicy as updateVMPolicy, ingestVulnerability

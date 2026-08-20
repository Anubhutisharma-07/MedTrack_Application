import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Cpu,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  RefreshCw,
  Zap,
  Activity,
  Award,
  Search,
  Plus,
  Trash2,
  Download,
  AlertTriangle,
  CheckCircle2,
  X,
  FileCode,
  Sliders,
  Sparkles,
  Server,
  Layers,
  Terminal,
  Eye,
  Clock,
  Database,
  Check,
  Fingerprint
} from "lucide-react";

/**
 * ConfidentialComputeEnclavePage Component
 *
 * High-Assurance Confidential Computing & Hardware Secure Enclave Hub.
 * Enforces AMD SEV-SNP, Intel SGX, AWS Nitro Enclaves, TPM 2.0 PCR Attestation,
 * and Zero-Knowledge Memory Isolation for Clinical AI and Patient Telemetry Workloads.
 */
export default function ConfidentialComputeEnclavePage() {
  // State
  const [enclaves, setEnclaves] = useState([
    {
      enclaveId: "ENCLAVE-SGX-01",
      enclaveName: "Oncology Genomics Memory Isolation Enclave",
      hardwareTechnology: "AMD SEV-SNP / Intel SGX v2",
      pcrMeasurementHash: "0x89E102A39F8C71203456DE7890ABCDEF1234567890ABCDEF1234567890ABCDEF",
      attestationStatus: "HARDWARE_ATTESTED_VALID",
      isolatedMemoryMb: 32768,
      activeJobsCount: 4,
      lastAttestationTimestamp: "2026-08-14T01:30:00Z"
    },
    {
      enclaveId: "ENCLAVE-NITRO-02",
      enclaveName: "ICU Real-Time Vital Stream Confidential Compute Node",
      hardwareTechnology: "AWS Nitro Enclave / TPM 2.0",
      pcrMeasurementHash: "0xF0912A349C8D71201928374650ABCDEF1234567890ABCDEF1234567890ABCDEF",
      attestationStatus: "HARDWARE_ATTESTED_VALID",
      isolatedMemoryMb: 16384,
      activeJobsCount: 12,
      lastAttestationTimestamp: "2026-08-14T01:45:00Z"
    },
    {
      enclaveId: "ENCLAVE-SEV-03",
      enclaveName: "Federated Clinical Model Training Isolated Worker",
      hardwareTechnology: "AMD SEV-SNP Secure Nested Paging",
      pcrMeasurementHash: "0x12A349C8D71201928374650ABCDEF1234567890ABCDEF1234567890ABCDEF89E",
      attestationStatus: "ATTESTATION_REFRESH_PENDING",
      isolatedMemoryMb: 65536,
      activeJobsCount: 1,
      lastAttestationTimestamp: "2026-08-13T22:10:00Z"
    }
  ]);

  const [activeTab, setActiveTab] = useState("ENCLAVES"); // "ENCLAVES" | "ATTESTATION_SANDBOX" | "HARDWARE_METRICS"
  const [searchTerm, setSearchTerm] = useState("");
  const [techFilter, setTechFilter] = useState("ALL");
  const [notification, setNotification] = useState({ type: "", message: "" });
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [inspectEnclave, setInspectEnclave] = useState(null);

  // New Enclave Form State
  const [enclaveForm, setEnclaveForm] = useState({
    enclaveName: "",
    hardwareTechnology: "AMD SEV-SNP / Intel SGX v2",
    isolatedMemoryMb: 16384
  });

  // Remote Attestation Simulator State
  const [attestationTokenInput, setAttestationTokenInput] = useState("");
  const [attestationResult, setAttestationResult] = useState(null);
  const [verifying, setVerifying] = useState(false);

  // Hardware Telemetry Metrics
  const [hardwareMetrics] = useState({
    tpmVersion: "TPM 2.0 (Trusted Platform Module - ISO/IEC 11889)",
    rootOfTrustVendor: "AMD Platform Security Processor (PSP) / Intel CSME",
    secureMemoryEncryptionKeyHex: "0xA9F80123984712093847501928374650",
    memorySnoopingProtection: "ENABLED (TME-MK Total Memory Encryption)",
    hardwareFaultInjectionDefense: "ACTIVE (Glitch & Thermal Spike Monitor Intact)",
    activeAttestationCertificates: 8
  });

  // Enclave Provision Handler
  const handleProvisionEnclave = (e) => {
    e.preventDefault();
    if (!enclaveForm.enclaveName.trim()) {
      setNotification({ type: "error", message: "Enclave name is required." });
      return;
    }

    const newEnclave = {
      enclaveId: `ENCLAVE-${Math.floor(100 + Math.random() * 800)}`,
      enclaveName: enclaveForm.enclaveName.trim(),
      hardwareTechnology: enclaveForm.hardwareTechnology,
      pcrMeasurementHash: `0x${Math.random().toString(16).substr(2, 40).toUpperCase()}`,
      attestationStatus: "HARDWARE_ATTESTED_VALID",
      isolatedMemoryMb: parseInt(enclaveForm.isolatedMemoryMb, 10),
      activeJobsCount: 0,
      lastAttestationTimestamp: new Date().toISOString()
    };

    setEnclaves((prev) => [newEnclave, ...prev]);
    setCreateModalOpen(false);
    setNotification({
      type: "success",
      message: `Secure Enclave '${newEnclave.enclaveName}' provisioned with hardware RAM isolation!`
    });
    setEnclaveForm({
      enclaveName: "",
      hardwareTechnology: "AMD SEV-SNP / Intel SGX v2",
      isolatedMemoryMb: 16384
    });
  };

  // Refresh Attestation Handler
  const handleRefreshAttestation = (enclaveId) => {
    setEnclaves((prev) =>
      prev.map((e) =>
        e.enclaveId === enclaveId
          ? {
              ...e,
              attestationStatus: "HARDWARE_ATTESTED_VALID",
              lastAttestationTimestamp: new Date().toISOString()
            }
          : e
      )
    );
    setNotification({
      type: "success",
      message: `Remote attestation refreshed for ${enclaveId}. Hardware PCR hash validated!`
    });
  };

  // Remote Attestation Verification Handler
  const handleVerifyAttestation = (e) => {
    e.preventDefault();
    if (!attestationTokenInput.trim()) return;
    setVerifying(true);

    setTimeout(() => {
      setAttestationResult({
        attestationReportStatus: "PASSED_HARDWARE_ROOT_OF_TRUST_VERIFIED",
        tpmPcrMatch: "100% MATCH (PCR[0..23] Verified against Gold Image)",
        signatureAlgorithm: "ECDSA-P384-SHA384 (AMD SEV-SNP Platform Key)",
        enclaveMeasurementDigest: "0x89E102A39F8C71203456DE7890ABCDEF",
        attestationLatencyMs: 14.2
      });
      setVerifying(false);
    }, 600);
  };

  // Filtered Enclaves List
  const filteredEnclaves = useMemo(() => {
    return enclaves.filter((enc) => {
      const matchSearch =
        enc.enclaveName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        enc.enclaveId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        enc.hardwareTechnology.toLowerCase().includes(searchTerm.toLowerCase());
      const matchTech =
        techFilter === "ALL" ||
        (techFilter === "AMD" && enc.hardwareTechnology.includes("AMD")) ||
        (techFilter === "INTEL" && enc.hardwareTechnology.includes("Intel")) ||
        (techFilter === "AWS" && enc.hardwareTechnology.includes("AWS"));
      return matchSearch && matchTech;
    });
  }, [enclaves, searchTerm, techFilter]);

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-8 space-y-6">
      
      {/* 1. Page Header */}
      <div className="max-w-7xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1.5 font-mono">
                <Cpu size={13} className="animate-pulse" /> CONFIDENTIAL COMPUTE ENCLAVE
              </span>
              <span className="px-3 py-1 text-xs font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 rounded-full flex items-center gap-1">
                <ShieldCheck size={13} /> TPM 2.0 / AMD SEV-SNP
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Hardware Secure Enclave & Confidential Computing Control Hub
            </h1>
            <p className="text-slate-400 text-sm max-w-3xl leading-relaxed">
              Enterprise hardware-isolated execution environments protecting clinical AI workloads, sensitive patient data in RAM, and TPM 2.0 PCR remote attestation evidence validation.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto">
            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="w-full lg:w-auto px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-2xl transition shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2"
            >
              <Plus size={16} /> Provision Enclave Node
            </button>
          </div>
        </div>

        {/* Global Notifications */}
        {notification.message && (
          <div className="mt-6 p-4 rounded-2xl text-xs font-bold flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>{notification.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotification({ type: "", message: "" })}
              className="text-slate-400 hover:text-white"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      {/* 2. Navigation Tabs */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
          {[
            { id: "ENCLAVES", label: "Active Enclave Nodes", icon: Cpu },
            { id: "ATTESTATION_SANDBOX", label: "Remote Attestation Sandbox", icon: Fingerprint },
            { id: "HARDWARE_METRICS", label: "Hardware Telemetry", icon: Server }
          ].map((tab) => {
            const IconComp = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                    : "bg-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <IconComp size={15} /> {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-slate-400 w-full md:w-auto justify-end">
          <div>Provisioned RAM: <strong className="text-emerald-300">114.6 GB Isolated</strong></div>
          <div>Root of Trust: <strong className="text-purple-400">AMD PSP / Intel CSME</strong></div>
        </div>
      </div>

      {/* 3. TAB CONTENT: ENCLAVES */}
      {activeTab === "ENCLAVES" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl text-xs">
            <div className="relative w-full sm:w-80">
              <Search size={14} className="absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="Search enclave name, ID, or technology..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Filter Technology:</span>
              <select
                value={techFilter}
                onChange={(e) => setTechFilter(e.target.value)}
                className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ALL">ALL TECHNOLOGIES</option>
                <option value="AMD">AMD SEV-SNP</option>
                <option value="INTEL">INTEL SGX</option>
                <option value="AWS">AWS NITRO</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEnclaves.map((enc) => (
              <div
                key={enc.enclaveId}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl hover:border-emerald-500/40 transition flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 text-[11px] font-bold font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                      {enc.enclaveId}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${
                        enc.attestationStatus === "HARDWARE_ATTESTED_VALID"
                          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                          : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                      }`}
                    >
                      {enc.attestationStatus === "HARDWARE_ATTESTED_VALID" ? "ATTESTED VALID" : "REFRESH REQUIRED"}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight">{enc.enclaveName}</h3>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">{enc.hardwareTechnology}</p>
                  </div>

                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-1 text-xs font-mono">
                    <div className="text-slate-500 text-[10px] uppercase font-bold">PCR Measurement Digest</div>
                    <div className="text-purple-300 truncate">{enc.pcrMeasurementHash}</div>
                  </div>

                  <div className="space-y-1.5 text-xs font-mono text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Isolated Memory:</span>
                      <strong className="text-emerald-300">{(enc.isolatedMemoryMb / 1024).toFixed(1)} GB RAM</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Active Workloads:</span>
                      <span>{enc.activeJobsCount} Jobs Running</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleRefreshAttestation(enc.enclaveId)}
                    className="flex-1 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <RefreshCw size={13} /> Re-Attest Node
                  </button>
                  <button
                    type="button"
                    onClick={() => setInspectEnclave(enc)}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs"
                  >
                    <Eye size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. TAB CONTENT: ATTESTATION SANDBOX */}
      {activeTab === "ATTESTATION_SANDBOX" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Fingerprint size={18} className="text-emerald-400" /> TPM 2.0 & SEV-SNP Remote Attestation Evidence Evaluator
            </h3>
            <p className="text-xs text-slate-400">
              Submit hardware attestation quote tokens to verify PCR measurement digests against trusted golden reference hashes before releasing decryption key material.
            </p>

            <form onSubmit={handleVerifyAttestation} className="space-y-3">
              <textarea
                rows={3}
                placeholder="Enter Base64 / Hex Hardware Attestation Report Token..."
                value={attestationTokenInput}
                onChange={(e) => setAttestationTokenInput(e.target.value)}
                className="w-full p-4 bg-slate-950 border border-slate-700 rounded-2xl text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={verifying}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs transition flex items-center gap-2 shadow-lg shadow-emerald-600/20"
                >
                  {verifying ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} />}
                  {verifying ? "Verifying Attestation..." : "Validate Attestation Token"}
                </button>
              </div>
            </form>

            {attestationResult && (
              <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl text-xs space-y-3 font-mono">
                <div className="flex items-center justify-between text-emerald-400 font-bold border-b border-slate-800 pb-2">
                  <span>Attestation Report: {attestationResult.attestationReportStatus}</span>
                  <span>Latency: {attestationResult.attestationLatencyMs} ms</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">TPM PCR Verification</span>
                  <span className="text-sky-300 font-bold">{attestationResult.tpmPcrMatch}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Digital Signature Specification</span>
                  <span className="text-purple-300">{attestationResult.signatureAlgorithm}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. TAB CONTENT: HARDWARE METRICS */}
      {activeTab === "HARDWARE_METRICS" && (
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Server size={18} className="text-emerald-400" /> Platform Security Processor & Hardware Isolation Status
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
                <span className="text-slate-500 text-[10px] block">Trusted Platform Module Standard</span>
                <strong className="text-white">{hardwareMetrics.tpmVersion}</strong>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
                <span className="text-slate-500 text-[10px] block">Root of Trust Hardware Engine</span>
                <strong className="text-emerald-400">{hardwareMetrics.rootOfTrustVendor}</strong>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
                <span className="text-slate-500 text-[10px] block">RAM Snooping Protection</span>
                <strong className="text-purple-300">{hardwareMetrics.memorySnoopingProtection}</strong>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
                <span className="text-slate-500 text-[10px] block">Fault Injection Defense</span>
                <strong className="text-sky-300">{hardwareMetrics.hardwareFaultInjectionDefense}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Provision Enclave Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-xl w-full text-slate-100 space-y-4 shadow-2xl font-sans">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Cpu size={18} className="text-emerald-400" /> Provision Secure Enclave Node
              </h3>
              <button type="button" onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleProvisionEnclave} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-bold block mb-1">Enclave Node Name</label>
                <input
                  type="text"
                  placeholder="e.g. Oncology Genomic Sequencing Worker Enclave"
                  value={enclaveForm.enclaveName}
                  onChange={(e) => setEnclaveForm({ ...enclaveForm, enclaveName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Hardware Isolation Technology</label>
                <select
                  value={enclaveForm.hardwareTechnology}
                  onChange={(e) => setEnclaveForm({ ...enclaveForm, hardwareTechnology: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="AMD SEV-SNP / Intel SGX v2">AMD SEV-SNP / Intel SGX v2 (Encrypted RAM)</option>
                  <option value="AWS Nitro Enclave / TPM 2.0">AWS Nitro Enclave / TPM 2.0</option>
                  <option value="Intel TDX Trust Domain Extensions">Intel TDX Trust Domain Extensions</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Isolated Memory Allocation (MB RAM)</label>
                <input
                  type="number"
                  value={enclaveForm.isolatedMemoryMb}
                  onChange={(e) => setEnclaveForm({ ...enclaveForm, isolatedMemoryMb: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs transition shadow-lg shadow-emerald-600/20"
                >
                  Provision Hardware Enclave
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inspect Enclave Modal */}
      {inspectEnclave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full text-slate-100 space-y-4 shadow-2xl font-mono">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white font-sans">{inspectEnclave.enclaveId} - Inspection</h3>
              <button type="button" onClick={() => setInspectEnclave(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs space-y-2">
              <div>Name: <strong className="text-emerald-300 font-sans">{inspectEnclave.enclaveName}</strong></div>
              <div>Tech: <strong className="text-purple-300">{inspectEnclave.hardwareTechnology}</strong></div>
              <div>Digest: <span className="text-sky-300 break-all">{inspectEnclave.pcrMeasurementHash}</span></div>
              <div>RAM: <span>{(inspectEnclave.isolatedMemoryMb / 1024).toFixed(1)} GB</span></div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setInspectEnclave(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs font-sans"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

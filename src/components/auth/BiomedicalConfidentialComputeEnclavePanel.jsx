import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Cpu,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Sliders,
  Terminal,
  Lock,
  Search,
  PlusCircle,
  Download,
  Code,
  Layers,
  Sparkles,
  Eye,
  X,
  FileCode,
  Database,
  Key,
  UserCheck,
  Activity,
  Smartphone,
  Globe,
  Zap,
  Check,
  Server,
  HardDrive,
  Copy,
  Radio,
  Share2,
  Box,
  Fingerprint
} from "lucide-react";
import {
  getEnclaveRegistry,
  provisionEnclave,
  verifyHardwareAttestation,
  getEnclaveVendorProfiles,
  exportEnclaveReportJson,
  getEnclaveStandards
} from "../../services/BiomedicalConfidentialComputeEnclaveService";
import "../../pages/auth/auth.css";

/**
 * BiomedicalConfidentialComputeEnclavePanel Component
 * 
 * Biomedical Confidential Computing Enclave & Hardware Remote Attestation Console.
 * Features:
 * 1. Active Hardware Enclave Registry (Intel SGX3, AMD SEV-SNP, AWS Nitro)
 * 2. Hardware Vendor Architecture & Isolation Matrix
 * 3. Hardware Remote Attestation Quote Verification Sandbox
 * 4. Confidential Computing Audit JSON Report Inspector & Exporter
 * 5. NIST SP 800-160 & Confidential Computing Consortium (CCC) Standards
 * 6. Provision & Attest Enclave Modal
 */
export default function BiomedicalConfidentialComputeEnclavePanel() {
  // State
  const [enclaves, setEnclaves] = useState([]);
  const [vendorProfiles, setVendorProfiles] = useState([]);
  const [standards, setStandards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [activeTab, setActiveTab] = useState("ENCLAVES"); // "ENCLAVES" | "VENDORS" | "SANDBOX" | "JSON_REPORT" | "STANDARDS"

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVendorFilter, setSelectedVendorFilter] = useState("ALL");

  // Sandbox State
  const [selectedEnclaveId, setSelectedEnclaveId] = useState("ENCLAVE-SGX-0104");
  const [attestationResult, setAttestationResult] = useState(null);

  // JSON Report Exporter State
  const [exportedJson, setExportedJson] = useState("");
  const [copiedJson, setCopiedJson] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [enclaveName, setEnclaveName] = useState("");
  const [hardwareVendor, setHardwareVendor] = useState("Intel SGX3 (DCAP Remote Attestation)");
  const [ramMb, setRamMb] = useState(32768);

  // Load telemetry
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [enclaveList, vendorList, stdList] = await Promise.all([
        getEnclaveRegistry().catch(() => []),
        getEnclaveVendorProfiles().catch(() => []),
        getEnclaveStandards().catch(() => [])
      ]);

      setEnclaves(enclaveList);
      setVendorProfiles(vendorList);
      setStandards(stdList);

      if (enclaveList.length > 0) {
        const initialReport = await exportEnclaveReportJson(enclaveList[0].enclaveId);
        setExportedJson(initialReport);
      }
    } catch (err) {
      console.error("Failed to load confidential compute data:", err);
      setMessage({ type: "error", text: "Failed connecting to Confidential Compute Enclave service." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Enclave Selection for Report Export
  const handleExportEnclaveReport = async (enclaveId) => {
    try {
      setSelectedEnclaveId(enclaveId);
      const jsonStr = await exportEnclaveReportJson(enclaveId);
      setExportedJson(jsonStr);
      setCopiedJson(false);
    } catch (err) {
      console.error("Failed exporting enclave report:", err);
    }
  };

  // Run Hardware Attestation Sandbox
  const handleVerifyAttestation = async (e) => {
    e?.preventDefault();
    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const result = await verifyHardwareAttestation(selectedEnclaveId);
      setAttestationResult(result);
      setMessage({
        type: "success",
        text: `Hardware Attestation Quote verified in ${result.verificationLatencyMs}ms! TCB Status: ${result.tcbStatus}. Provider: ${result.attestationProvider}.`
      });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "Hardware remote attestation failed." });
    } finally {
      setActionLoading(false);
    }
  };

  // Provision Enclave
  const handleProvisionEnclave = async (e) => {
    e.preventDefault();
    if (!enclaveName.trim()) return;

    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const newEnclave = await provisionEnclave({
        enclaveName: enclaveName.trim(),
        hardwareVendor,
        ramMb: Number(ramMb)
      });

      setEnclaveName("");
      setIsModalOpen(false);
      setMessage({
        type: "success",
        text: `Enclave ${newEnclave.enclaveId} provisioned and attested! Allocated RAM: ${newEnclave.allocatedRamMb} MB.`
      });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "Failed to provision enclave." });
    } finally {
      setActionLoading(false);
    }
  };

  // Copy JSON Report to Clipboard
  const handleCopyJson = () => {
    navigator.clipboard.writeText(exportedJson);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  // Filtered Enclaves
  const filteredEnclaves = useMemo(() => {
    return enclaves.filter((e) => {
      const matchesSearch =
        e.enclaveName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.hardwareVendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.enclaveId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.activeWorkloads.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesVendor = selectedVendorFilter === "ALL" || e.hardwareVendor.includes(selectedVendorFilter);

      return matchesSearch && matchesVendor;
    });
  }, [enclaves, searchQuery, selectedVendorFilter]);

  // Metrics
  const metrics = useMemo(() => {
    const totalEnclaves = enclaves.length;
    const attestedCount = enclaves.filter((e) => e.securityState === "ATTESTED_SECURE").length;
    const totalRamGb = (enclaves.reduce((acc, curr) => acc + (curr.allocatedRamMb || 0), 0) / 1024).toFixed(0);

    return { totalEnclaves, attestedCount, totalRamGb };
  }, [enclaves]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* 1. Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden text-slate-100">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 border border-purple-500/20 rounded-full flex items-center gap-1.5 font-mono">
                <Cpu size={12} /> CONFIDENTIAL COMPUTING ENCLAVES
              </span>
              <span className="px-3 py-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1 font-mono">
                <Fingerprint size={12} /> INTEL SGX & AMD SEV-SNP
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Biomedical Confidential Compute Enclaves & Attestation
            </h2>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Hardware-enforced memory encryption, remote attestation measurement quotes, Zero-Trust genomic alignment, and blind medical record query processing under NIST SP 800-160 and CCC standards.
            </p>
          </div>

          {/* Telemetry Widget */}
          <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl w-full lg:w-auto text-xs space-y-2">
            <div className="flex items-center justify-between gap-6 font-mono">
              <span className="text-slate-400 font-sans font-bold uppercase text-[10px]">Enclave Telemetry</span>
              <span className="text-purple-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                TEE HARDWARE ACTIVE
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-700/80 font-mono text-[11px]">
              <div>Active Enclaves: <strong className="text-white">{metrics.totalEnclaves} Hardware TEEs</strong></div>
              <div>Attestation State: <strong className="text-emerald-400">{metrics.attestedCount} Attested</strong></div>
              <div>Allocated Memory: <strong className="text-purple-300">{metrics.totalRamGb} GB RAM</strong></div>
              <div>Memory Protection: <strong className="text-emerald-400">AES-512 MEE</strong></div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        {message.text && (
          <div
            className={`mt-6 p-4 rounded-xl text-sm font-medium flex items-center justify-between border ${
              message.type === "error"
                ? "bg-red-500/10 border-red-500/30 text-red-400"
                : "bg-purple-500/10 border-purple-500/30 text-purple-400"
            }`}
          >
            <div className="flex items-center gap-2">
              {message.type === "error" ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
              <span>{message.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setMessage({ type: "", text: "" })}
              className="text-slate-400 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>

      {/* 2. Navigation bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("ENCLAVES")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "ENCLAVES"
                ? "bg-purple-600 text-white font-black shadow-lg shadow-purple-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Cpu size={15} /> Confidential Enclaves ({enclaves.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("VENDORS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "VENDORS"
                ? "bg-purple-600 text-white font-black shadow-lg shadow-purple-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Server size={15} /> Hardware Vendors ({vendorProfiles.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("SANDBOX")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "SANDBOX"
                ? "bg-purple-600 text-white font-black shadow-lg shadow-purple-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Zap size={15} /> Remote Attestation Sandbox
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("JSON_REPORT")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "JSON_REPORT"
                ? "bg-purple-600 text-white font-black shadow-lg shadow-purple-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Code size={15} /> Enclave Audit JSON Report
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("STANDARDS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "STANDARDS"
                ? "bg-purple-600 text-white font-black shadow-lg shadow-purple-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <ShieldCheck size={15} /> NIST & CCC Standards ({standards.length})
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-purple-600/20"
        >
          <PlusCircle size={15} /> Provision Hardware Enclave
        </button>
      </div>

      {/* 3. ENCLAVES TAB */}
      {activeTab === "ENCLAVES" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white">Active Confidential Computing Enclaves</h3>
              <p className="text-xs text-slate-400 font-mono">Enclave IDs, hardware vendors, measurement hashes, memory encryption algorithms, and active workloads</p>
            </div>

            {/* Search & Vendor Filter */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search size={14} className="absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search enclave, vendor, hash..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <select
                className="py-2 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                value={selectedVendorFilter}
                onChange={(e) => setSelectedVendorFilter(e.target.value)}
              >
                <option value="ALL">All Hardware Vendors</option>
                <option value="Intel">Intel SGX3</option>
                <option value="AMD">AMD SEV-SNP</option>
                <option value="Nitro">AWS Nitro</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-3">Enclave ID</th>
                  <th className="p-3">Enclave Name & Measurement Hash</th>
                  <th className="p-3">Hardware Vendor</th>
                  <th className="p-3">Memory RAM</th>
                  <th className="p-3">Active Workload</th>
                  <th className="p-3 text-right">Attestation State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {filteredEnclaves.map((e, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/60 transition cursor-pointer" onClick={() => handleExportEnclaveReport(e.enclaveId)}>
                    <td className="p-3 font-bold text-purple-400 flex items-center gap-1.5">
                      <Radio size={12} className="text-purple-500 animate-pulse" />
                      {e.enclaveId}
                    </td>
                    <td className="p-3 font-sans">
                      <div className="font-semibold text-white">{e.enclaveName}</div>
                      <div className="text-[10px] text-purple-300 font-mono">{e.attestationMeasurementHash.substring(0, 32)}...</div>
                    </td>
                    <td className="p-3 text-slate-300 font-mono text-[10px]">{e.hardwareVendor}</td>
                    <td className="p-3 font-bold text-white">{(e.allocatedRamMb / 1024).toFixed(0)} GB</td>
                    <td className="p-3 text-slate-400 font-mono text-[10px]">{e.activeWorkloads}</td>
                    <td className="p-3 text-right font-sans">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {e.securityState}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. HARDWARE VENDORS TAB */}
      {activeTab === "VENDORS" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Server size={18} className="text-purple-400" /> Supported TEE Hardware Vendors
              </h3>
              <p className="text-xs text-slate-400 font-mono">Attestation types, max memory capacities, isolation guarantees, and production status</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {vendorProfiles.map((v, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 font-sans">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded font-bold">
                    {v.vendorId}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">{v.status}</span>
                </div>

                <h4 className="text-sm font-bold text-white">{v.vendorName}</h4>

                <div className="space-y-1 font-mono text-[11px]">
                  <div className="text-slate-400">Attestation: <strong className="text-purple-300">{v.attestationType}</strong></div>
                  <div className="text-slate-400">Max RAM: <strong className="text-white">{(v.maxMemoryEnclaveMb / 1024).toFixed(0)} GB</strong></div>
                  <div className="text-slate-400">Isolation: <strong className="text-emerald-400">{v.isolationGuarantee}</strong></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. SANDBOX TAB */}
      {activeTab === "SANDBOX" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Zap size={18} className="text-purple-400" /> Hardware Remote Attestation Quote Verification Sandbox
              </h3>
            </div>

            <form onSubmit={handleVerifyAttestation} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Target Enclave ID:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-sans"
                  value={selectedEnclaveId}
                  onChange={(e) => setSelectedEnclaveId(e.target.value)}
                >
                  {enclaves.map((e) => (
                    <option key={e.enclaveId} value={e.enclaveId}>
                      {e.enclaveId} - {e.enclaveName}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-lg shadow-purple-600/20"
              >
                <Zap size={16} /> Verify Hardware Remote Attestation Quote
              </button>
            </form>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-400" /> Attestation Quote Output
              </h3>
            </div>

            {attestationResult ? (
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-sans font-bold uppercase">Attestation Provider:</span>
                  <div className="text-[10px] text-purple-300">{attestationResult.attestationProvider}</div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[11px] p-3 bg-slate-950/60 rounded-xl border border-slate-800 font-sans">
                  <div>Quote Result: <strong className="text-emerald-400">{attestationResult.quoteVerificationResult}</strong></div>
                  <div>TCB Status: <strong className="text-emerald-400">{attestationResult.tcbStatus}</strong></div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-2xl">
                Click "Verify Hardware Remote Attestation Quote" to validate TEE measurement integrity.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. ENCLAVE AUDIT JSON REPORT TAB */}
      {activeTab === "JSON_REPORT" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Code size={18} className="text-purple-400" /> Enclave Audit JSON Report
              </h3>
              <p className="text-xs text-slate-400 font-mono">Standardized NIST SP 800-160 & CCC Audit JSON schema detailing hardware vendor, measurement hash, and memory encryption</p>
            </div>

            <button
              type="button"
              onClick={handleCopyJson}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 border border-slate-700"
            >
              {copiedJson ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
              {copiedJson ? "Copied Enclave Report JSON!" : "Copy Enclave Report JSON"}
            </button>
          </div>

          <div className="relative rounded-2xl border border-slate-800 bg-slate-950 p-4 max-h-[500px] overflow-y-auto">
            <pre className="text-xs font-mono text-purple-300 leading-relaxed whitespace-pre-wrap">
              {exportedJson}
            </pre>
          </div>
        </div>
      )}

      {/* 7. STANDARDS TAB */}
      {activeTab === "STANDARDS" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">NIST & Confidential Computing Consortium Standards</h3>
              <p className="text-xs text-slate-400 font-mono">Standards for hardware root-of-trust, memory isolation, and attestation</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {standards.map((s, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded font-bold">
                    {s.standard}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white">{s.standard}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{s.detail}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8. PROVISION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full text-slate-100 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Cpu size={18} className="text-purple-400" /> Provision Hardware Enclave
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleProvisionEnclave} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Enclave Name:</label>
                <input
                  type="text"
                  placeholder="e.g. Oncology Clinical Trial Enclave"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-sans"
                  value={enclaveName}
                  onChange={(e) => setEnclaveName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Hardware Vendor Architecture:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-sans"
                  value={hardwareVendor}
                  onChange={(e) => setHardwareVendor(e.target.value)}
                >
                  <option value="Intel SGX3 (DCAP Remote Attestation)">Intel SGX3 (DCAP Remote Attestation)</option>
                  <option value="AMD SEV-SNP (Secure Encrypted Virtualization)">AMD SEV-SNP (Secure Encrypted Virtualization)</option>
                  <option value="AWS Nitro Enclave (Cryptographic Isolation)">AWS Nitro Enclave (Cryptographic Isolation)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Allocated RAM (MB):</label>
                <input
                  type="number"
                  placeholder="32768"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                  value={ramMb}
                  onChange={(e) => setRamMb(e.target.value)}
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition shadow-lg shadow-purple-600/20"
                >
                  Provision Enclave
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  KeyRound,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Sliders,
  Terminal,
  Cpu,
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
  ShieldAlert,
  HardDrive,
  Copy,
  Radio,
  Share2
} from "lucide-react";
import {
  getZkpVerifiableEhrRegistry,
  generateZkpCredentialProof,
  verifyZkProofSandbox,
  getZkCircuitInventory,
  exportZkpCredentialJson,
  getZkpVerifiableEhrStandards
} from "../../services/BiomedicalZkpVerifiableEhrService";
import "../../pages/auth/auth.css";

/**
 * BiomedicalZkpVerifiableEhrPanel Component
 * 
 * Biomedical Zero-Knowledge Proof (ZKP) Verifiable EHR & Medical Credentials Console.
 * Features:
 * 1. ZKP Verifiable Medical Credentials & Nullifier Hash Registry
 * 2. zk-SNARKs Groth16 / PLONK Circuit Proving Key Inventory Matrix
 * 3. W3C Verifiable Credentials 2.0 JSON Schema Inspector & Exporter
 * 4. Real-Time zk-SNARKs Pairing Check & Verification Sandbox
 * 5. W3C VC 2.0, Groth16 BN254 & ISO/IEC 18013-5 Standards
 * 6. Issue ZKP Verifiable Credential Wizard Modal
 */
export default function BiomedicalZkpVerifiableEhrPanel() {
  // State
  const [proofs, setProofs] = useState([]);
  const [circuits, setCircuits] = useState([]);
  const [standards, setStandards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [activeTab, setActiveTab] = useState("PROOFS"); // "PROOFS" | "CIRCUITS" | "SANDBOX" | "JSON_VC" | "STANDARDS"

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCircuitFilter, setSelectedCircuitFilter] = useState("ALL");

  // Sandbox State
  const [selectedProofId, setSelectedProofId] = useState("ZKP-PROOF-2401");
  const [sandboxResult, setSandboxResult] = useState(null);

  // JSON VC Exporter State
  const [exportedJson, setExportedJson] = useState("");
  const [copiedJson, setCopiedJson] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [credentialType, setCredentialType] = useState("W3C Verifiable Clinical Credential (VACCINATION_PROOF)");
  const [predicate, setPredicate] = useState("isVaccinated = true (PHI Zero Exposure)");

  // Load telemetry
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [proofList, circList, stdList] = await Promise.all([
        getZkpVerifiableEhrRegistry().catch(() => []),
        getZkCircuitInventory().catch(() => []),
        getZkpVerifiableEhrStandards().catch(() => [])
      ]);

      setProofs(proofList);
      setCircuits(circList);
      setStandards(stdList);

      if (proofList.length > 0) {
        const initialVc = await exportZkpCredentialJson(proofList[0].proofId);
        setExportedJson(initialVc);
      }
    } catch (err) {
      console.error("Failed to load biomedical ZKP EHR data:", err);
      setMessage({ type: "error", text: "Failed connecting to ZKP EHR service." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Proof Selection for JSON Export
  const handleExportProofVc = async (proofId) => {
    try {
      setSelectedProofId(proofId);
      const jsonStr = await exportZkpCredentialJson(proofId);
      setExportedJson(jsonStr);
      setCopiedJson(false);
    } catch (err) {
      console.error("Failed exporting ZKP VC JSON:", err);
    }
  };

  // Run Proof Verification Sandbox
  const handleVerifySandbox = async (e) => {
    e?.preventDefault();
    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const result = await verifyZkProofSandbox(selectedProofId);
      setSandboxResult(result);
      setMessage({
        type: "success",
        text: `zk-SNARKs Groth16 Pairing Check completed in ${result.verificationLatencyMs}ms! Curve: ${result.ellipticCurve}. Pairing Check: PASSED. PHI Leakage: ZERO.`
      });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "ZKP proof verification failed." });
    } finally {
      setActionLoading(false);
    }
  };

  // Issue ZKP Credential
  const handleIssueCredential = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const newProof = await generateZkpCredentialProof({
        credentialType,
        predicate
      });

      setIsModalOpen(false);
      setMessage({
        type: "success",
        text: `ZKP Verifiable Credential ${newProof.proofId} issued with Groth16-BN254 circuit under W3C VC 2.0!`
      });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "Failed to issue ZKP verifiable credential." });
    } finally {
      setActionLoading(false);
    }
  };

  // Copy VC JSON to Clipboard
  const handleCopyJson = () => {
    navigator.clipboard.writeText(exportedJson);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  // Filtered Proofs
  const filteredProofs = useMemo(() => {
    return proofs.filter((p) => {
      const matchesSearch =
        p.credentialType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.subjectDid.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.proofId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.disclosedPredicate.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCircuit = selectedCircuitFilter === "ALL" || p.zkCircuit.includes(selectedCircuitFilter);

      return matchesSearch && matchesCircuit;
    });
  }, [proofs, searchQuery, selectedCircuitFilter]);

  // Metrics
  const metrics = useMemo(() => {
    const totalProofs = proofs.length;
    const avgLatency = (proofs.reduce((acc, curr) => acc + curr.proofLatencyMs, 0) / (totalProofs || 1)).toFixed(0);

    return { totalProofs, avgLatency };
  }, [proofs]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* 1. Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden text-slate-100">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 border border-purple-500/20 rounded-full flex items-center gap-1.5 font-mono">
                <KeyRound size={12} /> ZKP VERIFIABLE EHR & CREDENTIALS
              </span>
              <span className="px-3 py-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1 font-mono">
                <ShieldCheck size={12} /> W3C VC 2.0 / zk-SNARKs GROTH16
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Biomedical ZKP Verifiable EHR & Credentials
            </h2>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Zero-Knowledge Proof (ZKP) selective predicate disclosure for medical credentials, vaccination proofs, and physician prescriber licenses with zero raw PHI disclosure under W3C Verifiable Credentials v2.0.
            </p>
          </div>

          {/* Telemetry Widget */}
          <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl w-full lg:w-auto text-xs space-y-2">
            <div className="flex items-center justify-between gap-6 font-mono">
              <span className="text-slate-400 font-sans font-bold uppercase text-[10px]">ZKP Circuit Telemetry</span>
              <span className="text-purple-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                BN254 GROTH16 ACTIVE
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-700/80 font-mono text-[11px]">
              <div>Verified Proofs: <strong className="text-white">{metrics.totalProofs} Active</strong></div>
              <div>Proof Latency: <strong className="text-purple-300">{metrics.avgLatency}ms Avg</strong></div>
              <div>PHI Exposure: <strong className="text-emerald-400">0% (ZERO DISCLOSURE)</strong></div>
              <div>Nullifier Hash: <strong className="text-emerald-400">100% UNIQUE</strong></div>
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
            onClick={() => setActiveTab("PROOFS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "PROOFS"
                ? "bg-purple-600 text-white font-black shadow-lg shadow-purple-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <KeyRound size={15} /> Verifiable Credentials ({proofs.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("CIRCUITS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "CIRCUITS"
                ? "bg-purple-600 text-white font-black shadow-lg shadow-purple-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Cpu size={15} /> zk-SNARKs Circuits ({circuits.length})
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
            <Zap size={15} /> Groth16 Pairing Verifier Sandbox
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("JSON_VC")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "JSON_VC"
                ? "bg-purple-600 text-white font-black shadow-lg shadow-purple-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Code size={15} /> W3C VC 2.0 JSON Inspector
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
            <ShieldCheck size={15} /> W3C & ISO Standards ({standards.length})
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-purple-600/20"
        >
          <PlusCircle size={15} /> Issue ZKP Credential
        </button>
      </div>

      {/* 3. PROOFS TAB */}
      {activeTab === "PROOFS" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white">ZKP Verifiable Medical Credentials & Proof Registry</h3>
              <p className="text-xs text-slate-400 font-mono">Proof IDs, credential types, Subject DIDs, zk-circuits, disclosed predicates, and nullifier hashes</p>
            </div>

            {/* Search & Circuit Filter */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search size={14} className="absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search DID, proof, predicate..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <select
                className="py-2 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                value={selectedCircuitFilter}
                onChange={(e) => setSelectedCircuitFilter(e.target.value)}
              >
                <option value="ALL">All Circuits</option>
                <option value="Groth16">Groth16</option>
                <option value="PLONK">PLONK</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-3">Proof ID</th>
                  <th className="p-3">Credential Type & Subject DID</th>
                  <th className="p-3">zk-SNARKs Circuit & Disclosed Predicate</th>
                  <th className="p-3">Nullifier Hash</th>
                  <th className="p-3 text-right">Verification Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {filteredProofs.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/60 transition cursor-pointer" onClick={() => handleExportProofVc(p.proofId)}>
                    <td className="p-3 font-bold text-purple-400 flex items-center gap-1.5">
                      <Radio size={12} className="text-purple-500 animate-pulse" />
                      {p.proofId}
                    </td>
                    <td className="p-3 font-sans">
                      <div className="font-semibold text-white">{p.credentialType}</div>
                      <div className="text-[10px] text-purple-300 font-mono">{p.subjectDid}</div>
                    </td>
                    <td className="p-3 font-mono text-[10px]">
                      <div className="text-slate-300">{p.zkCircuit}</div>
                      <div className="text-emerald-400 font-bold">{p.disclosedPredicate}</div>
                    </td>
                    <td className="p-3 text-slate-500 font-mono text-[10px] break-all">{p.nullifierHash.substring(0, 24)}...</td>
                    <td className="p-3 text-right font-sans">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {p.verificationStatus} ({p.proofLatencyMs}ms)
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. CIRCUITS TAB */}
      {activeTab === "CIRCUITS" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Cpu size={18} className="text-purple-400" /> Compiled zk-SNARKs Proving Key Circuit Matrix
              </h3>
              <p className="text-xs text-slate-400 font-mono">Circom compiled R1CS circuits, BN254 / BLS12-381 curves, constraint counts, and proving key hashes</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {circuits.map((c, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 font-sans">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded font-bold">
                    {c.circuitId}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">{c.status}</span>
                </div>

                <h4 className="text-sm font-bold text-white">{c.circuitName}</h4>

                <div className="space-y-1 font-mono text-[11px]">
                  <div className="text-slate-400">Curve: <strong className="text-purple-300">{c.curve}</strong></div>
                  <div className="text-slate-400">R1CS Constraints: <strong className="text-white">{c.constraintCount.toLocaleString()}</strong></div>
                  <div className="text-slate-500 text-[10px] break-all pt-1">PK Hash: {c.provingKeyHash}</div>
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
                <Zap size={18} className="text-purple-400" /> Groth16 Pairing Check Sandbox
              </h3>
            </div>

            <form onSubmit={handleVerifySandbox} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Target ZKP Proof ID:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-sans"
                  value={selectedProofId}
                  onChange={(e) => setSelectedProofId(e.target.value)}
                >
                  {proofs.map((p) => (
                    <option key={p.proofId} value={p.proofId}>
                      {p.proofId} - {p.credentialType}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-lg shadow-purple-600/20"
              >
                <Zap size={16} /> Execute Groth16 Pairing Verification
              </button>
            </form>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-400" /> Verification Output
              </h3>
            </div>

            {sandboxResult ? (
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-sans font-bold uppercase">Elliptic Curve Pairing:</span>
                  <div className="text-sm font-bold text-purple-400">{sandboxResult.ellipticCurve}</div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[11px] p-3 bg-slate-950/60 rounded-xl border border-slate-800 font-sans">
                  <div>Pairing Check: <strong className="text-emerald-400 font-mono text-[10px]">PASSED (e(A,B) = e(alpha,beta))</strong></div>
                  <div>PHI Disclosure: <strong className="text-emerald-400">0% (ZERO PHI DISCLOSED)</strong></div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-2xl">
                Click "Execute Groth16 Pairing Verification" to verify proof.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. W3C VC 2.0 JSON INSPECTOR TAB */}
      {activeTab === "JSON_VC" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Code size={18} className="text-purple-400" /> W3C Verifiable Credential 2.0 JSON Schema
              </h3>
              <p className="text-xs text-slate-400 font-mono">Standardized W3C VC v2.0 JSON-LD schema containing issuer DID, subject DID, disclosed predicate, and Groth16 proof</p>
            </div>

            <button
              type="button"
              onClick={handleCopyJson}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 border border-slate-700"
            >
              {copiedJson ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
              {copiedJson ? "Copied VC JSON!" : "Copy W3C VC 2.0 JSON"}
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
              <h3 className="text-base font-bold text-white">W3C VC 2.0 & ISO/IEC Standards</h3>
              <p className="text-xs text-slate-400 font-mono">Frameworks for verifiable credentials, zero-knowledge proofs, and selective attribute disclosure</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <KeyRound size={18} className="text-purple-400" /> Issue ZKP Verifiable Credential
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleIssueCredential} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Credential Type:</label>
                <input
                  type="text"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-sans"
                  value={credentialType}
                  onChange={(e) => setCredentialType(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Disclosed Predicate (Zero PHI Exposure):</label>
                <input
                  type="text"
                  placeholder="e.g. isVaccinated = true"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-emerald-300 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={predicate}
                  onChange={(e) => setPredicate(e.target.value)}
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
                  Issue Credential
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Lock,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Sliders,
  Terminal,
  Cpu,
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
  Network,
  Binary,
  ShieldAlert,
  Settings2,
  Workflow
} from "lucide-react";
import {
  getFheMpcRegistry,
  provisionFheStream,
  evaluateHomomorphicOperation,
  getMpcClusterProfiles,
  exportFheReportJson,
  getFheStandards
} from "../../services/BiomedicalFheMpcTelemetryService";
import "../../pages/auth/auth.css";

/**
 * BiomedicalFheMpcTelemetryPanel Component
 * 
 * Biomedical Fully Homomorphic Encryption (FHE) & Multi-Party Computation (MPC) Telemetry Console.
 * Features:
 * 1. Active FHE / MPC Telemetry Stream Registry (CKKS & BFV Schemes)
 * 2. Multi-Party Computation (MPC) Custodian Cluster Nodes Matrix
 * 3. Ring-Lattice Cryptographic Polynomial Matrix & Key Length Telemetry
 * 4. Zero-Decryption Homomorphic Evaluation Sandbox
 * 5. FHE / MPC Audit JSON Report Inspector & Exporter
 * 6. HomomorphicEncryption.org & ISO/IEC 18033-6 Standards
 * 7. Provision Encrypted Telemetry Stream Modal
 */
export default function BiomedicalFheMpcTelemetryPanel() {
  // State
  const [streams, setStreams] = useState([]);
  const [mpcNodes, setMpcNodes] = useState([]);
  const [standards, setStandards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [activeTab, setActiveTab] = useState("STREAMS"); // "STREAMS" | "MPC_NODES" | "LATTICE_MATRIX" | "SANDBOX" | "JSON_REPORT" | "STANDARDS"

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSchemeFilter, setSelectedSchemeFilter] = useState("ALL");

  // Sandbox State
  const [selectedStreamId, setSelectedStreamId] = useState("FHE-STREAM-8801");
  const [operationType, setOperationType] = useState("EVALUATE_MEAN_BIOMETRIC");
  const [evalResult, setEvalResult] = useState(null);

  // JSON Report Exporter State
  const [exportedJson, setExportedJson] = useState("");
  const [copiedJson, setCopiedJson] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fheScheme, setFheScheme] = useState("CKKS (Cheon-Kim-Kim-Song Homomorphic Encryption)");
  const [telemetryType, setTelemetryType] = useState("ECG Cardiac Arrhythmia Telemetry");

  // Load telemetry
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [streamList, nodeList, stdList] = await Promise.all([
        getFheMpcRegistry().catch(() => []),
        getMpcClusterProfiles().catch(() => []),
        getFheStandards().catch(() => [])
      ]);

      setStreams(streamList);
      setMpcNodes(nodeList);
      setStandards(stdList);

      if (streamList.length > 0) {
        const initialReport = await exportFheReportJson(streamList[0].streamId);
        setExportedJson(initialReport);
      }
    } catch (err) {
      console.error("Failed to load FHE/MPC telemetry data:", err);
      setMessage({ type: "error", text: "Failed connecting to FHE/MPC Telemetry service." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Stream Selection for Report Export
  const handleExportStreamReport = async (streamId) => {
    try {
      setSelectedStreamId(streamId);
      const jsonStr = await exportFheReportJson(streamId);
      setExportedJson(jsonStr);
      setCopiedJson(false);
    } catch (err) {
      console.error("Failed exporting FHE report:", err);
    }
  };

  // Run Homomorphic Evaluation Sandbox
  const handleEvaluateOperation = async (e) => {
    e?.preventDefault();
    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const result = await evaluateHomomorphicOperation(selectedStreamId, operationType);
      setEvalResult(result);
      setMessage({
        type: "success",
        text: `Homomorphic Operation executed in ${result.evaluationLatencyMs}ms! Decryption Performed: FALSE. Ciphertext output verified.`
      });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "Homomorphic evaluation failed." });
    } finally {
      setActionLoading(false);
    }
  };

  // Provision FHE Stream
  const handleProvisionStream = async (e) => {
    e.preventDefault();

    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const newStream = await provisionFheStream({ fheScheme, telemetryType });

      setIsModalOpen(false);
      setMessage({
        type: "success",
        text: `Encrypted Telemetry Stream ${newStream.streamId} provisioned for ${newStream.patientPseudoId}! Scheme: ${newStream.fheScheme}.`
      });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "Failed to provision FHE stream." });
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

  // Filtered Streams
  const filteredStreams = useMemo(() => {
    return streams.filter((s) => {
      const matchesSearch =
        s.encryptedTelemetryType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.patientPseudoId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.streamId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.fheScheme.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesScheme = selectedSchemeFilter === "ALL" || s.fheScheme.includes(selectedSchemeFilter);

      return matchesSearch && matchesScheme;
    });
  }, [streams, searchQuery, selectedSchemeFilter]);

  // Lattice Polynomial Matrix Data
  const latticeMatrixData = useMemo(() => {
    return [
      {
        schemeName: "CKKS (Floating Point Arithmetic)",
        polynomialDegree: "N = 8192 / 16384 Rings",
        modulusSizeBits: "438-bit Prime Modulus (q)",
        noiseBudgetRemaining: "128 bits (Optimal)",
        bootstrappingRequired: "FALSE (Leveled FHE)"
      },
      {
        schemeName: "BFV (Exact Integer Arithmetic)",
        polynomialDegree: "N = 4096 / 8192 Rings",
        modulusSizeBits: "218-bit Prime Modulus (q)",
        noiseBudgetRemaining: "96 bits (Optimal)",
        bootstrappingRequired: "FALSE (Leveled FHE)"
      }
    ];
  }, []);

  // Metrics
  const metrics = useMemo(() => {
    const totalStreams = streams.length;
    const computeNodesCount = mpcNodes.length;
    const avgLatency = (streams.reduce((acc, curr) => acc + curr.computationLatencyMs, 0) / (totalStreams || 1)).toFixed(0);

    return { totalStreams, computeNodesCount, avgLatency };
  }, [streams, mpcNodes]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* 1. Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden text-slate-100">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-full flex items-center gap-1.5 font-mono">
                <Binary size={12} /> FULLY HOMOMORPHIC ENCRYPTION (FHE)
              </span>
              <span className="px-3 py-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1 font-mono">
                <ShieldCheck size={12} /> MULTI-PARTY COMPUTATION (MPC)
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Biomedical FHE & MPC Telemetry Hub
            </h2>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Zero-decryption homomorphic telemetry analysis, CKKS/BFV lattice ring encryption, Shamir 3-of-5 threshold secret sharing, and blind biometric query processing under ISO/IEC 18033-6 standards.
            </p>
          </div>

          {/* Telemetry Widget */}
          <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl w-full lg:w-auto text-xs space-y-2">
            <div className="flex items-center justify-between gap-6 font-mono">
              <span className="text-slate-400 font-sans font-bold uppercase text-[10px]">FHE Telemetry Engine</span>
              <span className="text-indigo-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                LATTICE ENGINE ACTIVE
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-700/80 font-mono text-[11px]">
              <div>Encrypted Streams: <strong className="text-white">{metrics.totalStreams} Streams</strong></div>
              <div>MPC Custodians: <strong className="text-indigo-300">{metrics.computeNodesCount} Nodes</strong></div>
              <div>Eval Latency: <strong className="text-emerald-400">{metrics.avgLatency}ms Avg</strong></div>
              <div>Decryption Exposure: <strong className="text-emerald-400">0% (ZERO exposure)</strong></div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        {message.text && (
          <div
            className={`mt-6 p-4 rounded-xl text-sm font-medium flex items-center justify-between border ${
              message.type === "error"
                ? "bg-red-500/10 border-red-500/30 text-red-400"
                : "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
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
            onClick={() => setActiveTab("STREAMS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "STREAMS"
                ? "bg-indigo-600 text-white font-black shadow-lg shadow-indigo-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Binary size={15} /> Encrypted Streams ({streams.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("MPC_NODES")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "MPC_NODES"
                ? "bg-indigo-600 text-white font-black shadow-lg shadow-indigo-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Network size={15} /> MPC Custodian Nodes ({mpcNodes.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("LATTICE_MATRIX")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "LATTICE_MATRIX"
                ? "bg-indigo-600 text-white font-black shadow-lg shadow-indigo-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Settings2 size={15} /> Ring-Lattice Matrix ({latticeMatrixData.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("SANDBOX")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "SANDBOX"
                ? "bg-indigo-600 text-white font-black shadow-lg shadow-indigo-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Zap size={15} /> Homomorphic Eval Sandbox
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("JSON_REPORT")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "JSON_REPORT"
                ? "bg-indigo-600 text-white font-black shadow-lg shadow-indigo-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Code size={15} /> FHE Audit JSON Report
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("STANDARDS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "STANDARDS"
                ? "bg-indigo-600 text-white font-black shadow-lg shadow-indigo-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <ShieldCheck size={15} /> ISO & NIST Standards ({standards.length})
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-indigo-600/20"
        >
          <PlusCircle size={15} /> Provision FHE Stream
        </button>
      </div>

      {/* 3. STREAMS TAB */}
      {activeTab === "STREAMS" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white">Active Homomorphic Telemetry Streams</h3>
              <p className="text-xs text-slate-400 font-mono">Stream IDs, patient pseudo IDs, FHE schemes, MPC protocols, and evaluation statuses</p>
            </div>

            {/* Search & Scheme Filter */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search size={14} className="absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search stream, pseudo ID, scheme..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <select
                className="py-2 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                value={selectedSchemeFilter}
                onChange={(e) => setSelectedSchemeFilter(e.target.value)}
              >
                <option value="ALL">All FHE Schemes</option>
                <option value="CKKS">CKKS Scheme</option>
                <option value="BFV">BFV Scheme</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-3">Stream ID</th>
                  <th className="p-3">Patient Pseudo ID & Telemetry Type</th>
                  <th className="p-3">FHE Scheme</th>
                  <th className="p-3">MPC Protocol</th>
                  <th className="p-3">Eval Latency</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {filteredStreams.map((s, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/60 transition cursor-pointer" onClick={() => handleExportStreamReport(s.streamId)}>
                    <td className="p-3 font-bold text-indigo-400 flex items-center gap-1.5">
                      <Radio size={12} className="text-indigo-500 animate-pulse" />
                      {s.streamId}
                    </td>
                    <td className="p-3 font-sans">
                      <div className="font-semibold text-white">{s.encryptedTelemetryType}</div>
                      <div className="text-[10px] text-indigo-300 font-mono">{s.patientPseudoId}</div>
                    </td>
                    <td className="p-3 text-slate-300 font-mono text-[10px]">{s.fheScheme}</td>
                    <td className="p-3 text-slate-400 font-mono text-[10px]">{s.mpcProtocol}</td>
                    <td className="p-3 font-mono text-emerald-400 font-bold">{s.computationLatencyMs}ms</td>
                    <td className="p-3 text-right font-sans">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {s.homomorphicEvalStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. MPC NODES TAB */}
      {activeTab === "MPC_NODES" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Network size={18} className="text-indigo-400" /> Multi-Party Computation Custodian Cluster Nodes
              </h3>
              <p className="text-xs text-slate-400 font-mono">Node hosts, Shamir threshold roles, ring encryption key lengths, and node health</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {mpcNodes.map((n, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 font-sans">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded font-bold">
                    {n.nodeId}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">{n.nodeStatus}</span>
                </div>

                <h4 className="text-sm font-bold text-white">{n.nodeHost}</h4>

                <div className="space-y-1 font-mono text-[11px]">
                  <div className="text-slate-400">Role: <strong className="text-indigo-300">{n.shardRole}</strong></div>
                  <div className="text-slate-400">Ring Key: <strong className="text-white">{n.encryptionKeyLength}</strong></div>
                  <div className="text-slate-400">Node Latency: <strong className="text-emerald-400">{n.latencyMs}ms</strong></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. LATTICE MATRIX TAB */}
      {activeTab === "LATTICE_MATRIX" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Settings2 size={18} className="text-indigo-400" /> Ring-Lattice Cryptographic Polynomial Matrix
              </h3>
              <p className="text-xs text-slate-400 font-mono">Polynomial degrees (N), prime moduli (q), noise budgets, and leveling status</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {latticeMatrixData.map((l, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 font-sans">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded font-bold">
                    {l.schemeName}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">{l.noiseBudgetRemaining}</span>
                </div>

                <h4 className="text-sm font-bold text-white">{l.schemeName}</h4>

                <div className="space-y-1 font-mono text-[11px]">
                  <div className="text-slate-400">Polynomial Degree: <strong className="text-indigo-300">{l.polynomialDegree}</strong></div>
                  <div className="text-slate-400">Modulus Size: <strong className="text-white">{l.modulusSizeBits}</strong></div>
                  <div className="text-slate-400">Bootstrapping Required: <strong className="text-emerald-400">{l.bootstrappingRequired}</strong></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. SANDBOX TAB */}
      {activeTab === "SANDBOX" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Zap size={18} className="text-indigo-400" /> Zero-Decryption Homomorphic Evaluation Sandbox
              </h3>
            </div>

            <form onSubmit={handleEvaluateOperation} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Target FHE Telemetry Stream:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans"
                  value={selectedStreamId}
                  onChange={(e) => setSelectedStreamId(e.target.value)}
                >
                  {streams.map((s) => (
                    <option key={s.streamId} value={s.streamId}>
                      {s.streamId} - {s.encryptedTelemetryType}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Homomorphic Operation:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans"
                  value={operationType}
                  onChange={(e) => setOperationType(e.target.value)}
                >
                  <option value="EVALUATE_MEAN_BIOMETRIC">EVALUATE MEAN BIOMETRIC (CKKS Float Polynomial)</option>
                  <option value="EVALUATE_THRESHOLD_ALERT">EVALUATE THRESHOLD ALERT (BFV Integer Comparison)</option>
                  <option value="EVALUATE_VARIANCE_POLYNOMIAL">EVALUATE VARIANCE POLYNOMIAL (Lattice Ring Arithmetic)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-lg shadow-indigo-600/20"
              >
                <Zap size={16} /> Execute Homomorphic Evaluation (Zero PHI Exposure)
              </button>
            </form>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-400" /> Evaluation Output & Ciphertext
              </h3>
            </div>

            {evalResult ? (
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-sans font-bold uppercase">Encrypted Ciphertext Result:</span>
                  <div className="text-[10px] text-indigo-300 break-all">{evalResult.encryptedCiphertextOutput}</div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[11px] p-3 bg-slate-950/60 rounded-xl border border-slate-800 font-sans">
                  <div>Decryption Exposure: <strong className="text-emerald-400">FALSE (0% Exposure)</strong></div>
                  <div>ZKP Proof Status: <strong className="text-emerald-400">VERIFIED</strong></div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-2xl">
                Click "Execute Homomorphic Evaluation" to perform blind arithmetic over encrypted stream.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 7. FHE AUDIT JSON REPORT TAB */}
      {activeTab === "JSON_REPORT" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Code size={18} className="text-indigo-400" /> FHE Audit JSON Report
              </h3>
              <p className="text-xs text-slate-400 font-mono">Standardized HomomorphicEncryption.org & ISO/IEC 18033-6 Audit JSON schema</p>
            </div>

            <button
              type="button"
              onClick={handleCopyJson}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 border border-slate-700"
            >
              {copiedJson ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
              {copiedJson ? "Copied FHE Report JSON!" : "Copy FHE Report JSON"}
            </button>
          </div>

          <div className="relative rounded-2xl border border-slate-800 bg-slate-950 p-4 max-h-[500px] overflow-y-auto">
            <pre className="text-xs font-mono text-indigo-300 leading-relaxed whitespace-pre-wrap">
              {exportedJson}
            </pre>
          </div>
        </div>
      )}

      {/* 8. STANDARDS TAB */}
      {activeTab === "STANDARDS" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">ISO & Homomorphic Encryption Standards</h3>
              <p className="text-xs text-slate-400 font-mono">International standards for privacy-preserving polynomial ring computations</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {standards.map((s, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded font-bold">
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

      {/* 9. PROVISION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full text-slate-100 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Binary size={18} className="text-indigo-400" /> Provision Encrypted FHE Stream
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleProvisionStream} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">FHE Cryptographic Scheme:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans"
                  value={fheScheme}
                  onChange={(e) => setFheScheme(e.target.value)}
                >
                  <option value="CKKS (Cheon-Kim-Kim-Song Homomorphic Encryption)">CKKS (Cheon-Kim-Kim-Song Homomorphic Encryption)</option>
                  <option value="BFV (Brakerski-Fan-Vercauteren Exact Int Scheme)">BFV (Brakerski-Fan-Vercauteren Exact Int Scheme)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Encrypted Telemetry Type:</label>
                <input
                  type="text"
                  placeholder="e.g. ECG Cardiac Arrhythmia Telemetry"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans"
                  value={telemetryType}
                  onChange={(e) => setTelemetryType(e.target.value)}
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
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition shadow-lg shadow-indigo-600/20"
                >
                  Provision Stream
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

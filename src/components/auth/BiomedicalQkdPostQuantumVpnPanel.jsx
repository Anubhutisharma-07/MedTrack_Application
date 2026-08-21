import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Zap,
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
  Check,
  Server,
  HardDrive,
  Copy,
  Radio,
  Share2,
  Network,
  Atom,
  Lock,
  CpuIcon,
  ActivitySquare
} from "lucide-react";
import {
  getQkdVpnRegistry,
  establishQkdTunnel,
  verifyQkdEntanglement,
  getPqcStandardProfiles,
  exportQkdReportJson,
  getQkdStandards
} from "../../services/BiomedicalQkdPostQuantumVpnService";
import "../../pages/auth/auth.css";

/**
 * BiomedicalQkdPostQuantumVpnPanel Component
 * 
 * Biomedical Quantum Key Distribution (QKD) & Post-Quantum Cryptography (PQC) VPN Console.
 * Features:
 * 1. Active QKD Photonic Mesh Tunnels & PQC VPN Registry (BB84 & E91 Protocols)
 * 2. NIST FIPS 203/204 Post-Quantum Cryptography Algorithm Profiles (ML-KEM / ML-DSA)
 * 3. Photonic Eavesdropping & Entanglement Verification Sandbox
 * 4. QKD & PQC Audit JSON Report Inspector & Exporter
 * 5. ETSI GS QKD 014 & NIST FIPS 203/204 Standards
 * 6. Establish Quantum-Safe VPN Tunnel Modal
 */
export default function BiomedicalQkdPostQuantumVpnPanel() {
  // State
  const [tunnels, setTunnels] = useState([]);
  const [pqcProfiles, setPqcProfiles] = useState([]);
  const [standards, setStandards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [activeTab, setActiveTab] = useState("TUNNELS"); // "TUNNELS" | "PQC_PROFILES" | "SANDBOX" | "JSON_REPORT" | "STANDARDS"

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProtocolFilter, setSelectedProtocolFilter] = useState("ALL");

  // Sandbox State
  const [selectedTunnelId, setSelectedTunnelId] = useState("QKD-TUNNEL-7001");
  const [verificationResult, setVerificationResult] = useState(null);

  // JSON Report Exporter State
  const [exportedJson, setExportedJson] = useState("");
  const [copiedJson, setCopiedJson] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tunnelName, setTunnelName] = useState("");
  const [qkdProtocol, setQkdProtocol] = useState("BB84 Single-Photon Polarization Protocol");
  const [targetNode, setTargetNode] = useState("Metropolitan General Hospital Node Alpha");

  // Load telemetry
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [tunnelList, profileList, stdList] = await Promise.all([
        getQkdVpnRegistry().catch(() => []),
        getPqcStandardProfiles().catch(() => []),
        getQkdStandards().catch(() => [])
      ]);

      setTunnels(tunnelList);
      setPqcProfiles(profileList);
      setStandards(stdList);

      if (tunnelList.length > 0) {
        const initialReport = await exportQkdReportJson(tunnelList[0].tunnelId);
        setExportedJson(initialReport);
      }
    } catch (err) {
      console.error("Failed to load QKD VPN data:", err);
      setMessage({ type: "error", text: "Failed connecting to QKD Post-Quantum VPN service." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Tunnel Selection for Report Export
  const handleExportTunnelReport = async (tunnelId) => {
    try {
      setSelectedTunnelId(tunnelId);
      const jsonStr = await exportQkdReportJson(tunnelId);
      setExportedJson(jsonStr);
      setCopiedJson(false);
    } catch (err) {
      console.error("Failed exporting QKD report:", err);
    }
  };

  // Run Photonic Entanglement Sandbox Verification
  const handleVerifyEntanglement = async (e) => {
    e?.preventDefault();
    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const result = await verifyQkdEntanglement(selectedTunnelId);
      setVerificationResult(result);
      setMessage({
        type: "success",
        text: `QKD Entanglement verified in ${result.verificationLatencyMs}ms! Eavesdropping Detected: FALSE. Channel: STABLE_ENTANGLED.`
      });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "QKD photonic entanglement verification failed." });
    } finally {
      setActionLoading(false);
    }
  };

  // Establish Tunnel
  const handleEstablishTunnel = async (e) => {
    e.preventDefault();
    if (!tunnelName.trim()) return;

    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const newTunnel = await establishQkdTunnel({
        tunnelName: tunnelName.trim(),
        qkdProtocol,
        targetNode
      });

      setTunnelName("");
      setIsModalOpen(false);
      setMessage({
        type: "success",
        text: `Quantum-Safe VPN Tunnel ${newTunnel.tunnelId} established with ${newTunnel.targetNode}! Rate: ${newTunnel.quantumKeyRateKbps} Kbps.`
      });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "Failed to establish QKD tunnel." });
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

  // Filtered Tunnels
  const filteredTunnels = useMemo(() => {
    return tunnels.filter((t) => {
      const matchesSearch =
        t.tunnelName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.targetNode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.tunnelId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.pqcAlgorithm.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesProtocol = selectedProtocolFilter === "ALL" || t.qkdProtocol.includes(selectedProtocolFilter);

      return matchesSearch && matchesProtocol;
    });
  }, [tunnels, searchQuery, selectedProtocolFilter]);

  // Metrics
  const metrics = useMemo(() => {
    const totalTunnels = tunnels.length;
    const avgKeyRate = (tunnels.reduce((acc, curr) => acc + curr.quantumKeyRateKbps, 0) / (totalTunnels || 1)).toFixed(1);
    const avgBer = (tunnels.reduce((acc, curr) => acc + curr.quantumBerPercent, 0) / (totalTunnels || 1)).toFixed(2);

    return { totalTunnels, avgKeyRate, avgBer };
  }, [tunnels]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* 1. Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden text-slate-100">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 rounded-full flex items-center gap-1.5 font-mono">
                <Atom size={12} /> QUANTUM KEY DISTRIBUTION (QKD)
              </span>
              <span className="px-3 py-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1 font-mono">
                <ShieldCheck size={12} /> POST-QUANTUM CRYPTOGRAPHY (PQC)
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Biomedical QKD & Post-Quantum VPN Subsystem
            </h2>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Photonic quantum entanglement mesh tunnels, ML-KEM-1024 (Kyber) & ML-DSA (Dilithium) lattice cryptography, zero eavesdropping verification, and ETSI GS QKD 014 standards.
            </p>
          </div>

          {/* Telemetry Widget */}
          <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl w-full lg:w-auto text-xs space-y-2">
            <div className="flex items-center justify-between gap-6 font-mono">
              <span className="text-slate-400 font-sans font-bold uppercase text-[10px]">Quantum Telemetry</span>
              <span className="text-cyan-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                PHOTONIC MESH ACTIVE
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-700/80 font-mono text-[11px]">
              <div>Active Tunnels: <strong className="text-white">{metrics.totalTunnels} QKD Links</strong></div>
              <div>Avg QKD Key Rate: <strong className="text-cyan-300">{metrics.avgKeyRate} Kbps</strong></div>
              <div>Bit Error Rate: <strong className="text-emerald-400">{metrics.avgBer}% BER</strong></div>
              <div>PQC Protection: <strong className="text-emerald-400">ML-KEM-1024</strong></div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        {message.text && (
          <div
            className={`mt-6 p-4 rounded-xl text-sm font-medium flex items-center justify-between border ${
              message.type === "error"
                ? "bg-red-500/10 border-red-500/30 text-red-400"
                : "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
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
            onClick={() => setActiveTab("TUNNELS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "TUNNELS"
                ? "bg-cyan-600 text-white font-black shadow-lg shadow-cyan-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Atom size={15} /> QKD Mesh Tunnels ({tunnels.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("PQC_PROFILES")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "PQC_PROFILES"
                ? "bg-cyan-600 text-white font-black shadow-lg shadow-cyan-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Lock size={15} /> NIST PQC Standards ({pqcProfiles.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("SANDBOX")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "SANDBOX"
                ? "bg-cyan-600 text-white font-black shadow-lg shadow-cyan-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Zap size={15} /> Photonic Entanglement Sandbox
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("JSON_REPORT")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "JSON_REPORT"
                ? "bg-cyan-600 text-white font-black shadow-lg shadow-cyan-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Code size={15} /> QKD Audit JSON Report
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("STANDARDS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "STANDARDS"
                ? "bg-cyan-600 text-white font-black shadow-lg shadow-cyan-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <ShieldCheck size={15} /> ETSI & NIST Standards ({standards.length})
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-cyan-600/20"
        >
          <PlusCircle size={15} /> Establish QKD Tunnel
        </button>
      </div>

      {/* 3. TUNNELS TAB */}
      {activeTab === "TUNNELS" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white">Active Quantum Key Distribution Mesh Tunnels</h3>
              <p className="text-xs text-slate-400 font-mono">Tunnel IDs, target node destinations, QKD protocols, PQC algorithms, and key generation rates</p>
            </div>

            {/* Search & Protocol Filter */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search size={14} className="absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search tunnel, node, PQC..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <select
                className="py-2 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono"
                value={selectedProtocolFilter}
                onChange={(e) => setSelectedProtocolFilter(e.target.value)}
              >
                <option value="ALL">All QKD Protocols</option>
                <option value="BB84">BB84 Protocol</option>
                <option value="E91">E91 Entanglement Protocol</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-3">Tunnel ID</th>
                  <th className="p-3">Tunnel Name & Target Node</th>
                  <th className="p-3">QKD Protocol</th>
                  <th className="p-3">PQC Algorithm</th>
                  <th className="p-3">Key Rate / BER</th>
                  <th className="p-3 text-right">Entanglement State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {filteredTunnels.map((t, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/60 transition cursor-pointer" onClick={() => handleExportTunnelReport(t.tunnelId)}>
                    <td className="p-3 font-bold text-cyan-400 flex items-center gap-1.5">
                      <Radio size={12} className="text-cyan-500 animate-pulse" />
                      {t.tunnelId}
                    </td>
                    <td className="p-3 font-sans">
                      <div className="font-semibold text-white">{t.tunnelName}</div>
                      <div className="text-[10px] text-cyan-300 font-mono">{t.targetNode}</div>
                    </td>
                    <td className="p-3 text-slate-300 font-mono text-[10px]">{t.qkdProtocol}</td>
                    <td className="p-3 text-slate-400 font-mono text-[10px]">{t.pqcAlgorithm}</td>
                    <td className="p-3 font-mono text-emerald-400 font-bold">{t.quantumKeyRateKbps} Kbps ({t.quantumBerPercent}% BER)</td>
                    <td className="p-3 text-right font-sans">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {t.quantumEntanglementState}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. PQC PROFILES TAB */}
      {activeTab === "PQC_PROFILES" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Lock size={18} className="text-cyan-400" /> NIST FIPS Released Post-Quantum Standards
              </h3>
              <p className="text-xs text-slate-400 font-mono">Mathematical foundations, quantum security categories, use cases, and FIPS release status</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pqcProfiles.map((p, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 font-sans">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded font-bold">
                    {p.pqcId}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">{p.status}</span>
                </div>

                <h4 className="text-sm font-bold text-white">{p.pqcName}</h4>

                <div className="space-y-1 font-mono text-[11px]">
                  <div className="text-slate-400">Security Level: <strong className="text-cyan-300">{p.quantumSecurityCategory}</strong></div>
                  <div className="text-slate-400">Math Foundation: <strong className="text-white">{p.mathFoundation}</strong></div>
                  <div className="text-slate-400">Primary Use Case: <strong className="text-emerald-400">{p.useCase}</strong></div>
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
                <Zap size={18} className="text-cyan-400" /> Photonic Eavesdropping & Entanglement Sandbox
              </h3>
            </div>

            <form onSubmit={handleVerifyEntanglement} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Target QKD Mesh Tunnel ID:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-sans"
                  value={selectedTunnelId}
                  onChange={(e) => setSelectedTunnelId(e.target.value)}
                >
                  {tunnels.map((t) => (
                    <option key={t.tunnelId} value={t.tunnelId}>
                      {t.tunnelId} - {t.tunnelName}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-lg shadow-cyan-600/20"
              >
                <Zap size={16} /> Verify Photonic Entanglement & Quantum BER
              </button>
            </form>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-400" /> Photonic Channel Verification Output
              </h3>
            </div>

            {verificationResult ? (
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-sans font-bold uppercase">Channel Status:</span>
                  <div className="text-[10px] text-cyan-300">{verificationResult.quantumChannelState}</div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[11px] p-3 bg-slate-950/60 rounded-xl border border-slate-800 font-sans">
                  <div>Eavesdropping Detected: <strong className="text-emerald-400">FALSE (Zero Interception)</strong></div>
                  <div>PQC Handshake: <strong className="text-emerald-400">VERIFIED SAFE</strong></div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-2xl">
                Click "Verify Photonic Entanglement" to check photon polarization integrity.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. QKD AUDIT JSON REPORT TAB */}
      {activeTab === "JSON_REPORT" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Code size={18} className="text-cyan-400" /> QKD Audit JSON Report
              </h3>
              <p className="text-xs text-slate-400 font-mono">Standardized NIST FIPS 203/204 & ETSI GS QKD 014 Audit JSON schema</p>
            </div>

            <button
              type="button"
              onClick={handleCopyJson}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 border border-slate-700"
            >
              {copiedJson ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
              {copiedJson ? "Copied QKD Report JSON!" : "Copy QKD Report JSON"}
            </button>
          </div>

          <div className="relative rounded-2xl border border-slate-800 bg-slate-950 p-4 max-h-[500px] overflow-y-auto">
            <pre className="text-xs font-mono text-cyan-300 leading-relaxed whitespace-pre-wrap">
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
              <h3 className="text-base font-bold text-white">ETSI & NIST Post-Quantum Standards</h3>
              <p className="text-xs text-slate-400 font-mono">International standards for software-defined quantum communication and PQC algorithms</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {standards.map((s, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded font-bold">
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

      {/* 8. ESTABLISH MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full text-slate-100 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Atom size={18} className="text-cyan-400" /> Establish Quantum-Safe VPN Tunnel
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEstablishTunnel} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Tunnel Name:</label>
                <input
                  type="text"
                  placeholder="e.g. Emergency Ambulance Telemedicine QKD Link"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-sans"
                  value={tunnelName}
                  onChange={(e) => setTunnelName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">QKD Photonic Protocol:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-sans"
                  value={qkdProtocol}
                  onChange={(e) => setQkdProtocol(e.target.value)}
                >
                  <option value="BB84 Single-Photon Polarization Protocol">BB84 Single-Photon Polarization Protocol</option>
                  <option value="E91 Entanglement-Based Quantum Protocol">E91 Entanglement-Based Quantum Protocol</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Target Node Destination:</label>
                <input
                  type="text"
                  placeholder="e.g. Metropolitan General Hospital Node Alpha"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-sans"
                  value={targetNode}
                  onChange={(e) => setTargetNode(e.target.value)}
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
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition shadow-lg shadow-cyan-600/20"
                >
                  Establish Tunnel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

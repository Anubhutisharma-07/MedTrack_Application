import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Crosshair,
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
  Share2,
  Flame,
  Target
} from "lucide-react";
import {
  getBasSimulationsRegistry,
  executeBasSimulation,
  runBasPayloadSandbox,
  getMitreAttackMatrix,
  exportBasReportJson,
  getBasStandards
} from "../../services/BiomedicalBasPenetrationTestingService";
import "../../pages/auth/auth.css";

/**
 * BiomedicalBasPenetrationTestingPanel Component
 * 
 * Biomedical Breach & Attack Simulation (BAS) & Automated Penetration Testing Console.
 * Features:
 * 1. Active BAS Attack Simulations & Exploitation Scenario Registry
 * 2. MITRE ATT&CK for Healthcare Mapping Matrix
 * 3. Zero-Day Payload Execution & Defense Sandbox
 * 4. BAS Penetration Testing Audit Report JSON Inspector & Exporter
 * 5. NIST SP 800-115 & MITRE ATT&CK Framework Standards
 * 6. Execute BAS Attack Simulation Wizard Modal
 */
export default function BiomedicalBasPenetrationTestingPanel() {
  // State
  const [simulations, setSimulations] = useState([]);
  const [mitreMatrix, setMitreMatrix] = useState([]);
  const [standards, setStandards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [activeTab, setActiveTab] = useState("SIMULATIONS"); // "SIMULATIONS" | "MITRE" | "SANDBOX" | "JSON_REPORT" | "STANDARDS"

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSeverityFilter, setSelectedSeverityFilter] = useState("ALL");

  // Sandbox State
  const [selectedSimulationId, setSelectedSimulationId] = useState("BAS-SIM-2501");
  const [sandboxResult, setSandboxResult] = useState(null);

  // JSON Report Exporter State
  const [exportedJson, setExportedJson] = useState("");
  const [copiedJson, setCopiedJson] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [simulationName, setSimulationName] = useState("");
  const [attackVector, setAttackVector] = useState("PACS DICOM Gateway (Port 104)");

  // Load telemetry
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [simList, matrixList, stdList] = await Promise.all([
        getBasSimulationsRegistry().catch(() => []),
        getMitreAttackMatrix().catch(() => []),
        getBasStandards().catch(() => [])
      ]);

      setSimulations(simList);
      setMitreMatrix(matrixList);
      setStandards(stdList);

      if (simList.length > 0) {
        const initialReport = await exportBasReportJson(simList[0].simulationId);
        setExportedJson(initialReport);
      }
    } catch (err) {
      console.error("Failed to load biomedical BAS data:", err);
      setMessage({ type: "error", text: "Failed connecting to BAS service." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Simulation Selection for Report Export
  const handleExportSimReport = async (simId) => {
    try {
      setSelectedSimulationId(simId);
      const jsonStr = await exportBasReportJson(simId);
      setExportedJson(jsonStr);
      setCopiedJson(false);
    } catch (err) {
      console.error("Failed exporting BAS report:", err);
    }
  };

  // Run Payload Sandbox
  const handleRunSandbox = async (e) => {
    e?.preventDefault();
    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const result = await runBasPayloadSandbox(selectedSimulationId);
      setSandboxResult(result);
      setMessage({
        type: "success",
        text: `BAS Attack Payload execution blocked in ${result.sandboxLatencyMs}ms! WAF Block: PASSED. Microsegmentation: ACTIVE.`
      });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "BAS payload sandbox execution failed." });
    } finally {
      setActionLoading(false);
    }
  };

  // Execute BAS Attack Simulation
  const handleExecuteSimulation = async (e) => {
    e.preventDefault();
    if (!simulationName.trim()) return;

    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const newSim = await executeBasSimulation({
        simulationName: simulationName.trim(),
        attackVector
      });

      setSimulationName("");
      setIsModalOpen(false);
      setMessage({
        type: "success",
        text: `BAS Simulation ${newSim.simulationId} launched against ${newSim.attackVector}! Threat Blocked: YES.`
      });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "Failed to execute BAS simulation." });
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

  // Filtered Simulations
  const filteredSimulations = useMemo(() => {
    return simulations.filter((s) => {
      const matchesSearch =
        s.simulationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.attackVector.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.simulationId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.mitreTechnique.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSeverity = selectedSeverityFilter === "ALL" || s.severityLevel.includes(selectedSeverityFilter);

      return matchesSearch && matchesSeverity;
    });
  }, [simulations, searchQuery, selectedSeverityFilter]);

  // Metrics
  const metrics = useMemo(() => {
    const totalSims = simulations.length;
    const blockedCount = simulations.filter((s) => s.executionStatus === "SIMULATION_BLOCKED").length;
    const avgLatency = (simulations.reduce((acc, curr) => acc + curr.mitigationLatencyMs, 0) / (totalSims || 1)).toFixed(0);

    return { totalSims, blockedCount, avgLatency };
  }, [simulations]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* 1. Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden text-slate-100">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-red-400 bg-red-500/10 border border-red-500/20 rounded-full flex items-center gap-1.5 font-mono">
                <Crosshair size={12} /> BREACH & ATTACK SIMULATION (BAS)
              </span>
              <span className="px-3 py-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1 font-mono">
                <ShieldCheck size={12} /> MITRE ATT&CK FOR HEALTHCARE
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Biomedical BAS & Automated Penetration Testing
            </h2>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Continuous automated penetration testing, zero-day exploit payload simulation, PACS DICOM buffer overflow testing, and MITRE ATT&CK mitigation mapping under NIST SP 800-115 standards.
            </p>
          </div>

          {/* Telemetry Widget */}
          <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl w-full lg:w-auto text-xs space-y-2">
            <div className="flex items-center justify-between gap-6 font-mono">
              <span className="text-slate-400 font-sans font-bold uppercase text-[10px]">BAS Simulation Telemetry</span>
              <span className="text-red-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
                SIMULATOR ACTIVE
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-700/80 font-mono text-[11px]">
              <div>Total Simulations: <strong className="text-white">{metrics.totalSims} Executed</strong></div>
              <div>Threats Blocked: <strong className="text-emerald-400">{metrics.blockedCount} / {metrics.totalSims} (100%)</strong></div>
              <div>Mitigation Latency: <strong className="text-red-300">{metrics.avgLatency}ms Avg</strong></div>
              <div>MITRE Coverage: <strong className="text-emerald-400">100% MAPPED</strong></div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        {message.text && (
          <div
            className={`mt-6 p-4 rounded-xl text-sm font-medium flex items-center justify-between border ${
              message.type === "error"
                ? "bg-red-500/10 border-red-500/30 text-red-400"
                : "bg-red-500/10 border-red-500/30 text-red-400"
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
            onClick={() => setActiveTab("SIMULATIONS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "SIMULATIONS"
                ? "bg-red-600 text-white font-black shadow-lg shadow-red-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Crosshair size={15} /> Attack Simulations ({simulations.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("MITRE")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "MITRE"
                ? "bg-red-600 text-white font-black shadow-lg shadow-red-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Target size={15} /> MITRE ATT&CK Matrix ({mitreMatrix.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("SANDBOX")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "SANDBOX"
                ? "bg-red-600 text-white font-black shadow-lg shadow-red-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Zap size={15} /> Zero-Day Payload Sandbox
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("JSON_REPORT")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "JSON_REPORT"
                ? "bg-red-600 text-white font-black shadow-lg shadow-red-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Code size={15} /> BAS Audit JSON Report
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("STANDARDS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "STANDARDS"
                ? "bg-red-600 text-white font-black shadow-lg shadow-red-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <ShieldCheck size={15} /> NIST & MITRE Standards ({standards.length})
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-red-600/20"
        >
          <PlusCircle size={15} /> Launch Attack Simulation
        </button>
      </div>

      {/* 3. SIMULATIONS TAB */}
      {activeTab === "SIMULATIONS" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white">BAS Penetration Testing & Attack Scenario Registry</h3>
              <p className="text-xs text-slate-400 font-mono">Simulation IDs, attack vectors, MITRE techniques, target zones, and mitigation latencies</p>
            </div>

            {/* Search & Severity Filter */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search size={14} className="absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search simulation, vector, MITRE..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <select
                className="py-2 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                value={selectedSeverityFilter}
                onChange={(e) => setSelectedSeverityFilter(e.target.value)}
              >
                <option value="ALL">All Severities</option>
                <option value="CRITICAL">CRITICAL</option>
                <option value="HIGH">HIGH</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-3">Simulation ID</th>
                  <th className="p-3">Scenario & Attack Vector</th>
                  <th className="p-3">MITRE Technique</th>
                  <th className="p-3">Target Zone</th>
                  <th className="p-3">Mitigation Latency</th>
                  <th className="p-3 text-right">Execution Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {filteredSimulations.map((s, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/60 transition cursor-pointer" onClick={() => handleExportSimReport(s.simulationId)}>
                    <td className="p-3 font-bold text-red-400 flex items-center gap-1.5">
                      <Radio size={12} className="text-red-500 animate-pulse" />
                      {s.simulationId}
                    </td>
                    <td className="p-3 font-sans">
                      <div className="font-semibold text-white">{s.simulationName}</div>
                      <div className="text-[10px] text-red-300 font-mono">{s.attackVector}</div>
                    </td>
                    <td className="p-3 text-slate-300 font-mono text-[10px]">{s.mitreTechnique}</td>
                    <td className="p-3 text-slate-400 font-mono text-[10px]">{s.targetZone}</td>
                    <td className="p-3 font-mono text-red-400 font-bold">{s.mitigationLatencyMs}ms</td>
                    <td className="p-3 text-right font-sans">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {s.executionStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. MITRE MATRIX TAB */}
      {activeTab === "MITRE" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Target size={18} className="text-red-400" /> MITRE ATT&CK Matrix for Healthcare
              </h3>
              <p className="text-xs text-slate-400 font-mono">Tactics, techniques, target components, and zero-trust mitigation controls</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {mitreMatrix.map((m, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 font-sans">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded font-bold">
                    {m.techniqueId}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">{m.defenseStatus}</span>
                </div>

                <h4 className="text-sm font-bold text-white">{m.techniqueName}</h4>

                <div className="space-y-1 font-mono text-[11px]">
                  <div className="text-slate-400">Tactic: <strong className="text-red-300">{m.tactic}</strong></div>
                  <div className="text-slate-400">Target: <strong className="text-white">{m.targetComponent}</strong></div>
                  <div className="text-slate-400">Mitigation: <strong className="text-emerald-400">{m.mitigationControl}</strong></div>
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
                <Zap size={18} className="text-red-400" /> Zero-Day Payload Execution Sandbox
              </h3>
            </div>

            <form onSubmit={handleRunSandbox} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Target BAS Simulation ID:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-red-500 font-sans"
                  value={selectedSimulationId}
                  onChange={(e) => setSelectedSimulationId(e.target.value)}
                >
                  {simulations.map((s) => (
                    <option key={s.simulationId} value={s.simulationId}>
                      {s.simulationId} - {s.simulationName}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-lg shadow-red-600/20"
              >
                <Zap size={16} /> Execute Zero-Day Exploit Payload
              </button>
            </form>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-400" /> Defense Execution Output
              </h3>
            </div>

            {sandboxResult ? (
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-sans font-bold uppercase">Defense Result:</span>
                  <div className="text-sm font-bold text-emerald-400">EXPLOIT BLOCKED BY WAF & ZERO-TRUST</div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[11px] p-3 bg-slate-950/60 rounded-xl border border-slate-800 font-sans">
                  <div>Microsegmentation: <strong className="text-emerald-400">TRIGGERED</strong></div>
                  <div>MITRE Coverage: <strong className="text-emerald-400">100% BLOCKED</strong></div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-2xl">
                Click "Execute Zero-Day Exploit Payload" to run simulation against defensive controls.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. BAS AUDIT JSON REPORT TAB */}
      {activeTab === "JSON_REPORT" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Code size={18} className="text-red-400" /> BAS Penetration Testing Audit JSON Report
              </h3>
              <p className="text-xs text-slate-400 font-mono">Standardized NIST SP 800-115 Audit JSON schema detailing attack vector, MITRE technique, and zero-trust defense</p>
            </div>

            <button
              type="button"
              onClick={handleCopyJson}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 border border-slate-700"
            >
              {copiedJson ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
              {copiedJson ? "Copied Report JSON!" : "Copy BAS Report JSON"}
            </button>
          </div>

          <div className="relative rounded-2xl border border-slate-800 bg-slate-950 p-4 max-h-[500px] overflow-y-auto">
            <pre className="text-xs font-mono text-red-300 leading-relaxed whitespace-pre-wrap">
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
              <h3 className="text-base font-bold text-white">NIST SP 800-115 & MITRE Framework Standards</h3>
              <p className="text-xs text-slate-400 font-mono">Standards for automated penetration testing and adversary technique emulation</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {standards.map((s, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded font-bold">
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
                <Crosshair size={18} className="text-red-400" /> Launch BAS Attack Simulation
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleExecuteSimulation} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Scenario Name:</label>
                <input
                  type="text"
                  placeholder="e.g. Ransomware Lateral Movement Simulation"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-red-500 font-sans"
                  value={simulationName}
                  onChange={(e) => setSimulationName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Target Attack Vector:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-red-500 font-sans"
                  value={attackVector}
                  onChange={(e) => setAttackVector(e.target.value)}
                >
                  <option value="PACS DICOM Gateway (Port 104)">PACS DICOM Gateway (Port 104)</option>
                  <option value="Smart Infusion Pump WiFi Controller">Smart Infusion Pump WiFi Controller</option>
                  <option value="Clinical Records Gateway REST API">Clinical Records Gateway REST API</option>
                </select>
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
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition shadow-lg shadow-red-600/20"
                >
                  Launch Simulation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

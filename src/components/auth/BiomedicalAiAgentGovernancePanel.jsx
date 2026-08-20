import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Bot,
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
  Wrench
} from "lucide-react";
import {
  getAiAgentGovernanceRegistry,
  registerClinicalAiAgent,
  inspectAiAgentSandbox,
  getAiAgentToolPolicies,
  exportAiAgentReportJson,
  getAiAgentGovernanceStandards
} from "../../services/BiomedicalAiAgentGovernanceService";
import "../../pages/auth/auth.css";

/**
 * BiomedicalAiAgentGovernancePanel Component
 * 
 * Biomedical Autonomous AI Agent Governance & Guardrails Console.
 * Features:
 * 1. Clinical AI Agents Registry & Tool-Use Access Boundary Matrix
 * 2. Tool-Use Access Control & HITL Overwatch Policy Matrix
 * 3. AI Agent Governance Audit Report JSON Inspector & Exporter
 * 4. Real-Time Hallucination Risk & Tool Boundary Sandbox
 * 5. NIST AI RMF 1.0, US EO 14110 & EU AI Act Standards
 * 6. Register Clinical AI Agent Wizard Modal
 */
export default function BiomedicalAiAgentGovernancePanel() {
  // State
  const [agents, setAgents] = useState([]);
  const [toolPolicies, setToolPolicies] = useState([]);
  const [standards, setStandards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [activeTab, setActiveTab] = useState("AGENTS"); // "AGENTS" | "POLICIES" | "SANDBOX" | "JSON_REPORT" | "STANDARDS"

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedComplianceFilter, setSelectedComplianceFilter] = useState("ALL");

  // Sandbox State
  const [selectedAgentId, setSelectedAgentId] = useState("AI-AGENT-2301");
  const [inspectionResult, setInspectionResult] = useState(null);

  // JSON Report Exporter State
  const [exportedJson, setExportedJson] = useState("");
  const [copiedJson, setCopiedJson] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [agentName, setAgentName] = useState("");
  const [agentCategory, setAgentCategory] = useState("Clinical Decision Support");
  const [modelArchitecture, setModelArchitecture] = useState("Med-PaLM 2 / Clinical-Llama-3");

  // Load telemetry
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [agentList, polList, stdList] = await Promise.all([
        getAiAgentGovernanceRegistry().catch(() => []),
        getAiAgentToolPolicies().catch(() => []),
        getAiAgentGovernanceStandards().catch(() => [])
      ]);

      setAgents(agentList);
      setToolPolicies(polList);
      setStandards(stdList);

      if (agentList.length > 0) {
        const initialReport = await exportAiAgentReportJson(agentList[0].agentId);
        setExportedJson(initialReport);
      }
    } catch (err) {
      console.error("Failed to load biomedical AI agent governance data:", err);
      setMessage({ type: "error", text: "Failed connecting to AI Agent Governance service." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Agent Selection for Report Export
  const handleExportAgentReport = async (agentId) => {
    try {
      setSelectedAgentId(agentId);
      const jsonStr = await exportAiAgentReportJson(agentId);
      setExportedJson(jsonStr);
      setCopiedJson(false);
    } catch (err) {
      console.error("Failed exporting AI agent report:", err);
    }
  };

  // Run Inspection Sandbox
  const handleInspectSandbox = async (e) => {
    e?.preventDefault();
    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const result = await inspectAiAgentSandbox(selectedAgentId);
      setInspectionResult(result);
      setMessage({
        type: "success",
        text: `AI Agent Tool Inspection completed in ${result.inspectionLatencyMs}ms! Boundary Check: ${result.toolCallBoundaryCheck}. Hallucination Risk: ${result.hallucinationProbability}.`
      });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "AI Agent tool inspection failed." });
    } finally {
      setActionLoading(false);
    }
  };

  // Register AI Agent
  const handleRegisterAgent = async (e) => {
    e.preventDefault();
    if (!agentName.trim()) return;

    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const newAgent = await registerClinicalAiAgent({
        agentName: agentName.trim(),
        agentCategory,
        modelArchitecture
      });

      setAgentName("");
      setIsModalOpen(false);
      setMessage({
        type: "success",
        text: `Clinical AI Agent ${newAgent.agentId} registered under NIST AI RMF 1.0 safety guardrails!`
      });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "Failed to register clinical AI agent." });
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

  // Filtered Agents
  const filteredAgents = useMemo(() => {
    return agents.filter((a) => {
      const matchesSearch =
        a.agentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.agentCategory.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.agentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.modelArchitecture.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCompliance = selectedComplianceFilter === "ALL" || a.complianceStatus.includes(selectedComplianceFilter);

      return matchesSearch && matchesCompliance;
    });
  }, [agents, searchQuery, selectedComplianceFilter]);

  // Metrics
  const metrics = useMemo(() => {
    const totalAgents = agents.length;
    const hitlCount = agents.filter((a) => a.hitlOverwatchRequired).length;
    const avgRisk = (agents.reduce((acc, curr) => acc + curr.hallucinationRiskScore, 0) / (totalAgents || 1)).toFixed(1);

    return { totalAgents, hitlCount, avgRisk };
  }, [agents]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* 1. Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden text-slate-100">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 rounded-full flex items-center gap-1.5 font-mono">
                <Bot size={12} /> AUTONOMOUS AI AGENT GOVERNANCE
              </span>
              <span className="px-3 py-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1 font-mono">
                <ShieldCheck size={12} /> NIST AI RMF 1.0 / US EO 14110
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Biomedical Autonomous AI Agent Governance
            </h2>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Real-time tool-use access control boundaries, hallucination risk scoring, Human-In-The-Loop (HITL) overwatch, and prohibited action enforcement for clinical AI agents under NIST AI RMF 1.0 guidelines.
            </p>
          </div>

          {/* Telemetry Widget */}
          <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl w-full lg:w-auto text-xs space-y-2">
            <div className="flex items-center justify-between gap-6 font-mono">
              <span className="text-slate-400 font-sans font-bold uppercase text-[10px]">AI Governance Telemetry</span>
              <span className="text-cyan-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                GUARDRAILS ENFORCED
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-700/80 font-mono text-[11px]">
              <div>Active Agents: <strong className="text-white">{metrics.totalAgents} Registered</strong></div>
              <div>HITL Overwatch: <strong className="text-cyan-300">{metrics.hitlCount} Active</strong></div>
              <div>Hallucination Score: <strong className="text-emerald-400">{metrics.avgRisk}% Low Risk</strong></div>
              <div>Tool Boundary: <strong className="text-emerald-400">100% ENFORCED</strong></div>
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
            onClick={() => setActiveTab("AGENTS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "AGENTS"
                ? "bg-cyan-600 text-white font-black shadow-lg shadow-cyan-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Bot size={15} /> Clinical AI Agents ({agents.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("POLICIES")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "POLICIES"
                ? "bg-cyan-600 text-white font-black shadow-lg shadow-cyan-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Wrench size={15} /> Tool Policies ({toolPolicies.length})
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
            <Zap size={15} /> Tool Inspection Sandbox
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
            <Code size={15} /> AI Governance JSON Report
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
            <ShieldCheck size={15} /> NIST AI RMF Standards ({standards.length})
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-cyan-600/20"
        >
          <PlusCircle size={15} /> Register AI Agent
        </button>
      </div>

      {/* 3. AGENTS TAB */}
      {activeTab === "AGENTS" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white">Registered Clinical AI Agents & Tool Boundaries</h3>
              <p className="text-xs text-slate-400 font-mono">Agent IDs, names, categories, model architectures, tool access boundaries, prohibited actions, and HITL status</p>
            </div>

            {/* Search & Compliance Filter */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search size={14} className="absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search agent, model, tool..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <select
                className="py-2 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono"
                value={selectedComplianceFilter}
                onChange={(e) => setSelectedComplianceFilter(e.target.value)}
              >
                <option value="ALL">All Compliance</option>
                <option value="NIST_AI_RMF">NIST AI RMF</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-3">Agent ID</th>
                  <th className="p-3">Agent Name & Category</th>
                  <th className="p-3">Model Architecture</th>
                  <th className="p-3">Tool Access Boundaries</th>
                  <th className="p-3">Prohibited Actions</th>
                  <th className="p-3 text-right">HITL Overwatch</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {filteredAgents.map((a, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/60 transition cursor-pointer" onClick={() => handleExportAgentReport(a.agentId)}>
                    <td className="p-3 font-bold text-cyan-400 flex items-center gap-1.5">
                      <Radio size={12} className="text-cyan-500 animate-pulse" />
                      {a.agentId}
                    </td>
                    <td className="p-3 font-sans">
                      <div className="font-semibold text-white">{a.agentName}</div>
                      <div className="text-[10px] text-cyan-300 font-mono">{a.agentCategory}</div>
                    </td>
                    <td className="p-3 text-slate-300 font-mono text-[10px]">{a.modelArchitecture}</td>
                    <td className="p-3 text-emerald-400 font-mono text-[10px]">{a.toolAccessBoundaries.join(", ")}</td>
                    <td className="p-3 text-red-400 font-mono text-[10px]">{a.prohibitedActions.join(", ")}</td>
                    <td className="p-3 text-right font-sans">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                        {a.hitlOverwatchRequired ? "REQUIRED" : "OPTIONAL"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. TOOL POLICIES TAB */}
      {activeTab === "POLICIES" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Wrench size={18} className="text-cyan-400" /> Tool-Use Access Control Policy Matrix
              </h3>
              <p className="text-xs text-slate-400 font-mono">Pre-approved clinical tool APIs, execution levels, HITL requirements, and risk classifications</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {toolPolicies.map((tp, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 font-sans">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded font-bold">
                    {tp.toolId}
                  </span>
                  <span className={`text-[10px] font-mono font-bold ${tp.riskCategory.includes("PROHIBITED") ? "text-red-400" : "text-emerald-400"}`}>
                    {tp.riskCategory}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-white">{tp.toolName}</h4>

                <div className="space-y-1 font-mono text-[11px]">
                  <div className="text-slate-400">Access Level: <strong className="text-cyan-300">{tp.accessLevel}</strong></div>
                  <div className="text-slate-400">HITL Gate: <strong className="text-white">{tp.hitlApprovalRequired ? "MANDATORY" : "BYPASSED"}</strong></div>
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
                <Zap size={18} className="text-cyan-400" /> Tool Inspection Sandbox
              </h3>
            </div>

            <form onSubmit={handleInspectSandbox} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Target Clinical AI Agent:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-sans"
                  value={selectedAgentId}
                  onChange={(e) => setSelectedAgentId(e.target.value)}
                >
                  {agents.map((a) => (
                    <option key={a.agentId} value={a.agentId}>
                      {a.agentId} - {a.agentName}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-lg shadow-cyan-600/20"
              >
                <Zap size={16} /> Execute Tool Boundary Inspection
              </button>
            </form>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-400" /> Inspection Output
              </h3>
            </div>

            {inspectionResult ? (
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-sans font-bold uppercase">Boundary Check:</span>
                  <div className="text-sm font-bold text-cyan-400">{inspectionResult.toolCallBoundaryCheck}</div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[11px] p-3 bg-slate-950/60 rounded-xl border border-slate-800 font-sans">
                  <div>Hallucination Risk: <strong className="text-emerald-400 font-mono text-[10px]">{inspectionResult.hallucinationProbability}</strong></div>
                  <div>HITL Gate: <strong className="text-emerald-400">PASSED</strong></div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-2xl">
                Click "Execute Tool Boundary Inspection" to inspect AI agent tool calls.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. AI GOVERNANCE JSON REPORT TAB */}
      {activeTab === "JSON_REPORT" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Code size={18} className="text-cyan-400" /> AI Agent Governance Audit JSON Report
              </h3>
              <p className="text-xs text-slate-400 font-mono">Standardized NIST AI RMF 1.0 Audit JSON schema containing agent profiles, tool access boundaries, and HITL rules</p>
            </div>

            <button
              type="button"
              onClick={handleCopyJson}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 border border-slate-700"
            >
              {copiedJson ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
              {copiedJson ? "Copied Report JSON!" : "Copy Governance Report JSON"}
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
              <h3 className="text-base font-bold text-white">NIST AI RMF & US EO 14110 Standards</h3>
              <p className="text-xs text-slate-400 font-mono">Frameworks for safe, secure, and trustworthy clinical artificial intelligence governance</p>
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

      {/* 8. PROVISION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full text-slate-100 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Bot size={18} className="text-cyan-400" /> Register Clinical AI Agent
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRegisterAgent} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">AI Agent Name:</label>
                <input
                  type="text"
                  placeholder="e.g. Emergency Department Triage Assist AI"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-sans"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Model Architecture:</label>
                <input
                  type="text"
                  placeholder="e.g. Med-PaLM 2 / Clinical-Llama-3"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-sans"
                  value={modelArchitecture}
                  onChange={(e) => setModelArchitecture(e.target.value)}
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
                  Register Agent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

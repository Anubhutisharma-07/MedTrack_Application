import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  ShieldAlert,
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
  CpuIcon,
  ActivitySquare,
  Flame,
  Workflow
} from "lucide-react";
import {
  getEbpfRegistry,
  deployEbpfPolicy,
  verifyEbpfProbeHealth,
  getEbpfHookProfiles,
  exportEbpfReportJson,
  getEbpfStandards
} from "../../services/BiomedicalZeroTrustEbpfPerimeterService";
import "../../pages/auth/auth.css";

/**
 * BiomedicalZeroTrustEbpfPerimeterPanel Component
 * 
 * Biomedical eBPF Kernel Probes & Zero-Trust Microsegmentation Console.
 * Features:
 * 1. Active eBPF Microsegmentation Policies & Kernel Probe Telemetry Registry
 * 2. eBPF Hook Types & Execution Architecture Matrix (XDP, kprobe, cgroup)
 * 3. eBPF Kernel Probe Telemetry & XDP Packet Drop Sandbox
 * 4. eBPF Zero-Trust Audit JSON Report Inspector & Exporter
 * 5. NIST SP 800-207 Zero Trust & Linux eBPF Foundation Standards
 * 6. Deploy eBPF Microsegmentation Policy Modal
 */
export default function BiomedicalZeroTrustEbpfPerimeterPanel() {
  // State
  const [policies, setPolicies] = useState([]);
  const [hookProfiles, setHookProfiles] = useState([]);
  const [standards, setStandards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [activeTab, setActiveTab] = useState("POLICIES"); // "POLICIES" | "HOOKS" | "SANDBOX" | "JSON_REPORT" | "STANDARDS"

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedHookFilter, setSelectedHookFilter] = useState("ALL");

  // Sandbox State
  const [selectedPolicyId, setSelectedPolicyId] = useState("EBPF-POL-3001");
  const [probeResult, setProbeResult] = useState(null);

  // JSON Report Exporter State
  const [exportedJson, setExportedJson] = useState("");
  const [copiedJson, setCopiedJson] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [policyName, setPolicyName] = useState("");
  const [ebpfHookType, setEbpfHookType] = useState("XDP (eXtress Data Path) Network Ingress Hook");
  const [targetNamespace, setTargetNamespace] = useState("vlan-104-imaging-pacs");

  // Load telemetry
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [policyList, hookList, stdList] = await Promise.all([
        getEbpfRegistry().catch(() => []),
        getEbpfHookProfiles().catch(() => []),
        getEbpfStandards().catch(() => [])
      ]);

      setPolicies(policyList);
      setHookProfiles(hookList);
      setStandards(stdList);

      if (policyList.length > 0) {
        const initialReport = await exportEbpfReportJson(policyList[0].policyId);
        setExportedJson(initialReport);
      }
    } catch (err) {
      console.error("Failed to load eBPF data:", err);
      setMessage({ type: "error", text: "Failed connecting to Zero-Trust eBPF Perimeter service." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Policy Selection for Report Export
  const handleExportPolicyReport = async (policyId) => {
    try {
      setSelectedPolicyId(policyId);
      const jsonStr = await exportEbpfReportJson(policyId);
      setExportedJson(jsonStr);
      setCopiedJson(false);
    } catch (err) {
      console.error("Failed exporting eBPF report:", err);
    }
  };

  // Run eBPF Probe Health Sandbox
  const handleVerifyProbe = async (e) => {
    e?.preventDefault();
    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const result = await verifyEbpfProbeHealth(selectedPolicyId);
      setProbeResult(result);
      setMessage({
        type: "success",
        text: `eBPF Kernel Probe verified in ${result.verificationLatencyMs}ms! Mode: ${result.xdpDriverMode}. Violations Blocked: ${result.zeroTrustViolationsBlocked}.`
      });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "eBPF kernel probe verification failed." });
    } finally {
      setActionLoading(false);
    }
  };

  // Deploy Policy
  const handleDeployPolicy = async (e) => {
    e.preventDefault();
    if (!policyName.trim()) return;

    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const newPolicy = await deployEbpfPolicy({
        policyName: policyName.trim(),
        ebpfHookType,
        targetNamespace
      });

      setPolicyName("");
      setIsModalOpen(false);
      setMessage({
        type: "success",
        text: `eBPF Microsegmentation Policy ${newPolicy.policyId} deployed to ${newPolicy.targetNamespace}! Status: ENFORCING_STRICT.`
      });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "Failed to deploy eBPF policy." });
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

  // Filtered Policies
  const filteredPolicies = useMemo(() => {
    return policies.filter((p) => {
      const matchesSearch =
        p.policyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.targetNamespace.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.policyId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.enforcementMode.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesHook = selectedHookFilter === "ALL" || p.ebpfHookType.includes(selectedHookFilter);

      return matchesSearch && matchesHook;
    });
  }, [policies, searchQuery, selectedHookFilter]);

  // Metrics
  const metrics = useMemo(() => {
    const totalPolicies = policies.length;
    const totalSyscalls = (policies.reduce((acc, curr) => acc + curr.inspectedSyscallsSec, 0) / 1000).toFixed(0);
    const hooksCount = hookProfiles.length;

    return { totalPolicies, totalSyscalls, hooksCount };
  }, [policies, hookProfiles]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* 1. Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden text-slate-100">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1.5 font-mono">
                <CpuIcon size={12} /> LINUX eBPF KERNEL PROBES
              </span>
              <span className="px-3 py-1 text-xs font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 rounded-full flex items-center gap-1 font-mono">
                <ShieldCheck size={12} /> NIST SP 800-207 ZERO TRUST
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Biomedical Zero-Trust eBPF Perimeter Subsystem
            </h2>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              XDP sub-microsecond network ingress filtering, kprobe kernel syscall tracing, Cilium container microsegmentation, and SPIFFE/SPIRE socket binding under NIST SP 800-207 standards.
            </p>
          </div>

          {/* Telemetry Widget */}
          <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl w-full lg:w-auto text-xs space-y-2">
            <div className="flex items-center justify-between gap-6 font-mono">
              <span className="text-slate-400 font-sans font-bold uppercase text-[10px]">Kernel Telemetry</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                KERNEL PROBES ENFORCING
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-700/80 font-mono text-[11px]">
              <div>Active Policies: <strong className="text-white">{metrics.totalPolicies} eBPF Rules</strong></div>
              <div>Inspected Syscalls: <strong className="text-emerald-300">{metrics.totalSyscalls}K / sec</strong></div>
              <div>Kernel Hooks: <strong className="text-cyan-300">{metrics.hooksCount} Hook Types</strong></div>
              <div>Enforcement Mode: <strong className="text-emerald-400">DENY DEFAULT</strong></div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        {message.text && (
          <div
            className={`mt-6 p-4 rounded-xl text-sm font-medium flex items-center justify-between border ${
              message.type === "error"
                ? "bg-red-500/10 border-red-500/30 text-red-400"
                : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
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
            onClick={() => setActiveTab("POLICIES")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "POLICIES"
                ? "bg-emerald-600 text-white font-black shadow-lg shadow-emerald-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <ShieldAlert size={15} /> eBPF Policies ({policies.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("HOOKS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "HOOKS"
                ? "bg-emerald-600 text-white font-black shadow-lg shadow-emerald-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <CpuIcon size={15} /> Kernel Hook Matrix ({hookProfiles.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("SANDBOX")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "SANDBOX"
                ? "bg-emerald-600 text-white font-black shadow-lg shadow-emerald-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Zap size={15} /> Kernel Probe Sandbox
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("JSON_REPORT")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "JSON_REPORT"
                ? "bg-emerald-600 text-white font-black shadow-lg shadow-emerald-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Code size={15} /> eBPF Audit JSON Report
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("STANDARDS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "STANDARDS"
                ? "bg-emerald-600 text-white font-black shadow-lg shadow-emerald-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <ShieldCheck size={15} /> NIST & eBPF Standards ({standards.length})
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-emerald-600/20"
        >
          <PlusCircle size={15} /> Deploy eBPF Policy
        </button>
      </div>

      {/* 3. POLICIES TAB */}
      {activeTab === "POLICIES" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white">Active eBPF Microsegmentation Policies</h3>
              <p className="text-xs text-slate-400 font-mono">Policy IDs, target namespaces, eBPF hook types, enforcement modes, and inspected syscall rates</p>
            </div>

            {/* Search & Hook Filter */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search size={14} className="absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search policy, namespace, mode..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <select
                className="py-2 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                value={selectedHookFilter}
                onChange={(e) => setSelectedHookFilter(e.target.value)}
              >
                <option value="ALL">All eBPF Hooks</option>
                <option value="XDP">XDP Network Hook</option>
                <option value="kprobe">kprobe Syscall Tracing</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-3">Policy ID</th>
                  <th className="p-3">Policy Name & Namespace</th>
                  <th className="p-3">eBPF Hook Type</th>
                  <th className="p-3">Enforcement Mode</th>
                  <th className="p-3">Inspected Syscalls</th>
                  <th className="p-3 text-right">Microsegmentation Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {filteredPolicies.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/60 transition cursor-pointer" onClick={() => handleExportPolicyReport(p.policyId)}>
                    <td className="p-3 font-bold text-emerald-400 flex items-center gap-1.5">
                      <Radio size={12} className="text-emerald-500 animate-pulse" />
                      {p.policyId}
                    </td>
                    <td className="p-3 font-sans">
                      <div className="font-semibold text-white">{p.policyName}</div>
                      <div className="text-[10px] text-emerald-300 font-mono">{p.targetNamespace}</div>
                    </td>
                    <td className="p-3 text-slate-300 font-mono text-[10px]">{p.ebpfHookType}</td>
                    <td className="p-3 text-slate-400 font-mono text-[10px]">{p.enforcementMode}</td>
                    <td className="p-3 font-mono text-emerald-400 font-bold">{(p.inspectedSyscallsSec / 1000).toFixed(0)}K / sec</td>
                    <td className="p-3 text-right font-sans">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {p.microsegmentationStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. HOOK PROFILES TAB */}
      {activeTab === "HOOKS" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CpuIcon size={18} className="text-emerald-400" /> eBPF Kernel Hook Types & Architecture Matrix
              </h3>
              <p className="text-xs text-slate-400 font-mono">Execution layers, performance classes, primary security use cases, and status</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {hookProfiles.map((h, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 font-sans">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-bold">
                    {h.hookId}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">{h.status}</span>
                </div>

                <h4 className="text-sm font-bold text-white">{h.hookName}</h4>

                <div className="space-y-1 font-mono text-[11px]">
                  <div className="text-slate-400">Execution Layer: <strong className="text-emerald-300">{h.executionLayer}</strong></div>
                  <div className="text-slate-400">Performance: <strong className="text-white">{h.performanceClass}</strong></div>
                  <div className="text-slate-400">Security Target: <strong className="text-cyan-400">{h.primarySecurityUse}</strong></div>
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
                <Zap size={18} className="text-emerald-400" /> eBPF Kernel Probe Telemetry Sandbox
              </h3>
            </div>

            <form onSubmit={handleVerifyProbe} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Target eBPF Policy ID:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans"
                  value={selectedPolicyId}
                  onChange={(e) => setSelectedPolicyId(e.target.value)}
                >
                  {policies.map((p) => (
                    <option key={p.policyId} value={p.policyId}>
                      {p.policyId} - {p.policyName}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-lg shadow-emerald-600/20"
              >
                <Zap size={16} /> Verify eBPF Probe Health & XDP Offload
              </button>
            </form>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-400" /> Kernel Telemetry Output
              </h3>
            </div>

            {probeResult ? (
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-sans font-bold uppercase">XDP Driver Mode:</span>
                  <div className="text-[10px] text-emerald-300">{probeResult.xdpDriverMode}</div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[11px] p-3 bg-slate-950/60 rounded-xl border border-slate-800 font-sans">
                  <div>Zero-Trust Violations Blocked: <strong className="text-emerald-400">{probeResult.zeroTrustViolationsBlocked}</strong></div>
                  <div>BPF Map Memory Used: <strong className="text-emerald-400">{probeResult.bpfMapMemoryUsedMb} MB</strong></div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-2xl">
                Click "Verify eBPF Probe Health" to inspect bytecode verifier and XDP map state.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. eBPF AUDIT JSON REPORT TAB */}
      {activeTab === "JSON_REPORT" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Code size={18} className="text-emerald-400" /> eBPF Audit JSON Report
              </h3>
              <p className="text-xs text-slate-400 font-mono">Standardized NIST SP 800-207 & Cilium eBPF Audit JSON schema</p>
            </div>

            <button
              type="button"
              onClick={handleCopyJson}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 border border-slate-700"
            >
              {copiedJson ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
              {copiedJson ? "Copied eBPF Report JSON!" : "Copy eBPF Report JSON"}
            </button>
          </div>

          <div className="relative rounded-2xl border border-slate-800 bg-slate-950 p-4 max-h-[500px] overflow-y-auto">
            <pre className="text-xs font-mono text-emerald-300 leading-relaxed whitespace-pre-wrap">
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
              <h3 className="text-base font-bold text-white">NIST & eBPF Foundation Security Standards</h3>
              <p className="text-xs text-slate-400 font-mono">Standards for kernel-level microsegmentation and SPIFFE workload identity binding</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {standards.map((s, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-bold">
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

      {/* 8. DEPLOY MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full text-slate-100 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldAlert size={18} className="text-emerald-400" /> Deploy eBPF Policy
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleDeployPolicy} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Policy Name:</label>
                <input
                  type="text"
                  placeholder="e.g. Surgical Robot Telemetry eBPF Shield"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans"
                  value={policyName}
                  onChange={(e) => setPolicyName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">eBPF Hook Architecture:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans"
                  value={ebpfHookType}
                  onChange={(e) => setEbpfHookType(e.target.value)}
                >
                  <option value="XDP (eXtress Data Path) Network Ingress Hook">XDP (eXtress Data Path) Network Ingress Hook</option>
                  <option value="kprobe / kretprobe Syscall Interceptor">kprobe / kretprobe Syscall Interceptor</option>
                  <option value="cgroup / sock_ops Socket Level Filter">cgroup / sock_ops Socket Level Filter</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Target Namespace / VLAN:</label>
                <input
                  type="text"
                  placeholder="e.g. vlan-104-imaging-pacs"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans"
                  value={targetNamespace}
                  onChange={(e) => setTargetNamespace(e.target.value)}
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
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition shadow-lg shadow-emerald-600/20"
                >
                  Deploy Policy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

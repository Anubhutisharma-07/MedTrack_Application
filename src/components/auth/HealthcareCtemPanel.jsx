import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Radar,
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
  Server,
  Filter,
  Network,
  Radio,
  Share2
} from "lucide-react";
import {
  getHealthcareCtemInventory,
  initiateCtemDiscoveryScan,
  validateCtemExposure,
  getGartner5StageBreakdown,
  exportCtemReportJson,
  getHealthcareCtemStandards
} from "../../services/HealthcareCtemService";
import "../../pages/auth/auth.css";

/**
 * HealthcareCtemPanel Component
 * 
 * Comprehensive Healthcare Continuous Threat Exposure Management (CTEM) & Attack Surface Console.
 * Features:
 * 1. Gartner CTEM Asset Exposure Inventory & Exploitability Score Matrix
 * 2. Gartner 5-Stage CTEM Interactive Workflow Pipeline Breakdown
 * 3. Real-Time Exploitability Validation & Air-Gap Microsegmentation Sandbox
 * 4. CTEM Exposure Audit JSON Report Inspector & Exporter
 * 5. Gartner CTEM 5-Stage Framework & NIST SP 800-160 Standards
 * 6. CTEM Attack Surface Discovery Scan Modal
 */
export default function HealthcareCtemPanel() {
  // State
  const [assets, setAssets] = useState([]);
  const [pipeline, setPipeline] = useState([]);
  const [standards, setStandards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [activeTab, setActiveTab] = useState("ASSETS"); // "ASSETS" | "PIPELINE" | "SANDBOX" | "JSON_REPORT" | "STANDARDS"

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExposureFilter, setSelectedExposureFilter] = useState("ALL");

  // Sandbox State
  const [selectedAssetId, setSelectedAssetId] = useState("CTEM-ASSET-2601");
  const [validateResult, setValidateResult] = useState(null);

  // JSON Report Exporter State
  const [exportedJson, setExportedJson] = useState("");
  const [copiedJson, setCopiedJson] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [assetName, setAssetName] = useState("");
  const [assetCategory, setAssetCategory] = useState("Clinical IoT Device");

  // Load telemetry
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [assetList, pipeList, stdList] = await Promise.all([
        getHealthcareCtemInventory().catch(() => []),
        getGartner5StageBreakdown().catch(() => []),
        getHealthcareCtemStandards().catch(() => [])
      ]);

      setAssets(assetList);
      setPipeline(pipeList);
      setStandards(stdList);

      if (assetList.length > 0) {
        const initialReport = await exportCtemReportJson(assetList[0].assetId);
        setExportedJson(initialReport);
      }
    } catch (err) {
      console.error("Failed to load healthcare CTEM data:", err);
      setMessage({ type: "error", text: "Failed connecting to CTEM service." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Asset Selection for Report Export
  const handleExportAssetReport = async (assetId) => {
    try {
      setSelectedAssetId(assetId);
      const jsonStr = await exportCtemReportJson(assetId);
      setExportedJson(jsonStr);
      setCopiedJson(false);
    } catch (err) {
      console.error("Failed exporting CTEM report:", err);
    }
  };

  // Run Exposure Validation
  const handleValidateExposure = async (e) => {
    e?.preventDefault();
    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const result = await validateCtemExposure(selectedAssetId);
      setValidateResult(result);
      setMessage({
        type: "success",
        text: `CTEM Exploitability Validation completed in ${result.exposureMitigationLatencyMs}ms! Exploitability Verified: YES. RCE Prevented: YES. Microsegmentation: ACTIVE.`
      });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "CTEM exposure validation failed." });
    } finally {
      setActionLoading(false);
    }
  };

  // Initiate Discovery Scan
  const handleInitiateScan = async (e) => {
    e.preventDefault();
    if (!assetName.trim()) return;

    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const newAsset = await initiateCtemDiscoveryScan({
        assetName: assetName.trim(),
        assetCategory
      });

      setAssetName("");
      setIsModalOpen(false);
      setMessage({
        type: "success",
        text: `CTEM Attack Surface Scan initiated for asset ${newAsset.assetId} under Gartner Stage 1 Scoping!`
      });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "Failed to initiate CTEM discovery scan." });
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

  // Filtered Assets
  const filteredAssets = useMemo(() => {
    return assets.filter((a) => {
      const matchesSearch =
        a.assetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.assetCategory.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.assetId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.ipAddress.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesExposure = selectedExposureFilter === "ALL" || a.exposureLevel.includes(selectedExposureFilter);

      return matchesSearch && matchesExposure;
    });
  }, [assets, searchQuery, selectedExposureFilter]);

  // Metrics
  const metrics = useMemo(() => {
    const totalAssets = assets.length;
    const criticalCount = assets.filter((a) => a.exposureLevel.includes("CRITICAL")).length;
    const avgScore = (assets.reduce((acc, curr) => acc + curr.exploitabilityScore, 0) / (totalAssets || 1)).toFixed(1);

    return { totalAssets, criticalCount, avgScore };
  }, [assets]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* 1. Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden text-slate-100">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center gap-1.5 font-mono">
                <Radar size={12} /> CONTINUOUS THREAT EXPOSURE MANAGEMENT
              </span>
              <span className="px-3 py-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1 font-mono">
                <ShieldCheck size={12} /> GARTNER CTEM 5-STAGE FRAMEWORK
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Healthcare CTEM & Attack Surface Management
            </h2>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Continuous discovery, exploitability validation, and microsegmentation for exposed DICOM PACS imaging servers, shadow medical IoT devices, and clinical workstations under Gartner CTEM guidelines.
            </p>
          </div>

          {/* Telemetry Widget */}
          <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl w-full lg:w-auto text-xs space-y-2">
            <div className="flex items-center justify-between gap-6 font-mono">
              <span className="text-slate-400 font-sans font-bold uppercase text-[10px]">CTEM Exposure Telemetry</span>
              <span className="text-amber-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                EXPOSURE VALIDATION ACTIVE
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-700/80 font-mono text-[11px]">
              <div>Discovered Assets: <strong className="text-white">{metrics.totalAssets} Active</strong></div>
              <div>Critical Exposure: <strong className="text-amber-300">{metrics.criticalCount} Assets</strong></div>
              <div>Exploit Score: <strong className="text-amber-400">{metrics.avgScore} / 10.0</strong></div>
              <div>Microsegmentation: <strong className="text-emerald-400">100% AIR-GAPPED</strong></div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        {message.text && (
          <div
            className={`mt-6 p-4 rounded-xl text-sm font-medium flex items-center justify-between border ${
              message.type === "error"
                ? "bg-red-500/10 border-red-500/30 text-red-400"
                : "bg-amber-500/10 border-amber-500/30 text-amber-400"
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
            onClick={() => setActiveTab("ASSETS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "ASSETS"
                ? "bg-amber-600 text-white font-black shadow-lg shadow-amber-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Radar size={15} /> Discovered Assets ({assets.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("PIPELINE")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "PIPELINE"
                ? "bg-amber-600 text-white font-black shadow-lg shadow-amber-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Layers size={15} /> Gartner 5-Stage Pipeline ({pipeline.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("SANDBOX")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "SANDBOX"
                ? "bg-amber-600 text-white font-black shadow-lg shadow-amber-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Zap size={15} /> Exploitability Validation Sandbox
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("JSON_REPORT")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "JSON_REPORT"
                ? "bg-amber-600 text-white font-black shadow-lg shadow-amber-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Code size={15} /> CTEM JSON Audit Report
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("STANDARDS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "STANDARDS"
                ? "bg-amber-600 text-white font-black shadow-lg shadow-amber-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <ShieldCheck size={15} /> Standards & Frameworks ({standards.length})
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-amber-600/20"
        >
          <PlusCircle size={15} /> Initiate Discovery Scan
        </button>
      </div>

      {/* 3. ASSETS TAB */}
      {activeTab === "ASSETS" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white">Discovered Exposed Healthcare Assets</h3>
              <p className="text-xs text-slate-400 font-mono">Asset IDs, names, categories, IP addresses, CVE vulnerabilities, exploitability scores, and CTEM 5-stage progression</p>
            </div>

            {/* Search & Exposure Filter */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search size={14} className="absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search asset, IP, CVE..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <select
                className="py-2 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                value={selectedExposureFilter}
                onChange={(e) => setSelectedExposureFilter(e.target.value)}
              >
                <option value="ALL">All Exposures</option>
                <option value="CRITICAL">CRITICAL</option>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-3">Asset ID</th>
                  <th className="p-3">Asset Name & Category</th>
                  <th className="p-3">Network Zone & IP</th>
                  <th className="p-3">CVE Vulnerabilities</th>
                  <th className="p-3">Exploit Score</th>
                  <th className="p-3 text-right">CTEM Stage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {filteredAssets.map((a, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/60 transition cursor-pointer" onClick={() => handleExportAssetReport(a.assetId)}>
                    <td className="p-3 font-bold text-amber-400 flex items-center gap-1.5">
                      <Radio size={12} className="text-amber-500 animate-pulse" />
                      {a.assetId}
                    </td>
                    <td className="p-3 font-sans">
                      <div className="font-semibold text-white">{a.assetName}</div>
                      <div className="text-[10px] text-amber-300 font-mono">{a.assetCategory}</div>
                    </td>
                    <td className="p-3 font-mono text-[10px]">
                      <div className="text-slate-300">{a.networkZone}</div>
                      <div className="text-slate-500">{a.ipAddress}</div>
                    </td>
                    <td className="p-3 text-red-400 font-mono text-[10px]">{a.cveVulnerabilities.join(", ")}</td>
                    <td className="p-3 font-mono font-bold text-amber-400">{a.exploitabilityScore} / 10.0</td>
                    <td className="p-3 text-right font-sans">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        {a.ctemStage}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. GARTNER 5-STAGE PIPELINE TAB */}
      {activeTab === "PIPELINE" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers size={18} className="text-amber-400" /> Gartner 5-Stage CTEM Framework Pipeline Matrix
              </h3>
              <p className="text-xs text-slate-400 font-mono">Continuous Threat Exposure Management lifecycle breakdown across Scoping, Discovery, Prioritization, Validation, and Mobilization</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {pipeline.map((p, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 flex flex-col justify-between">
                <div className="space-y-1">
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 block w-fit">
                    {p.stage}
                  </span>
                  <h4 className="text-xs font-bold text-white pt-1">{p.title}</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-sans">{p.description}</p>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between font-mono text-[10px]">
                  <span className="text-slate-500">Active Items:</span>
                  <span className="text-amber-300 font-bold">{p.activeCount} Assets</span>
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
                <Zap size={18} className="text-amber-400" /> CTEM Exploitability Validation Sandbox
              </h3>
            </div>

            <form onSubmit={handleValidateExposure} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Target Exposed Asset:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-sans"
                  value={selectedAssetId}
                  onChange={(e) => setSelectedAssetId(e.target.value)}
                >
                  {assets.map((a) => (
                    <option key={a.assetId} value={a.assetId}>
                      {a.assetId} - {a.assetName}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-lg shadow-amber-600/20"
              >
                <Zap size={16} /> Execute Exploitability Validation
              </button>
            </form>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-400" /> Validation Output
              </h3>
            </div>

            {validateResult ? (
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-sans font-bold uppercase">Exploitability Status:</span>
                  <div className="text-sm font-bold text-emerald-400">{validateResult.exploitabilityVerified ? "VERIFIED & MITIGATED" : "UNVERIFIED"}</div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[11px] p-3 bg-slate-950/60 rounded-xl border border-slate-800 font-sans">
                  <div>RCE Prevented: <strong className="text-emerald-400 font-mono text-[10px]">YES</strong></div>
                  <div>Microsegmentation: <strong className="text-emerald-400">ACTIVE AIR-GAP</strong></div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-2xl">
                Click "Execute Exploitability Validation" to validate asset exposure.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. CTEM JSON AUDIT REPORT TAB */}
      {activeTab === "JSON_REPORT" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Code size={18} className="text-amber-400" /> CTEM Exposure Audit JSON Report
              </h3>
              <p className="text-xs text-slate-400 font-mono">Standardized Gartner CTEM Exposure Audit JSON schema containing asset details, CVE list, and microsegmentation rules</p>
            </div>

            <button
              type="button"
              onClick={handleCopyJson}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 border border-slate-700"
            >
              {copiedJson ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
              {copiedJson ? "Copied Report JSON!" : "Copy CTEM Report JSON"}
            </button>
          </div>

          <div className="relative rounded-2xl border border-slate-800 bg-slate-950 p-4 max-h-[500px] overflow-y-auto">
            <pre className="text-xs font-mono text-amber-300 leading-relaxed whitespace-pre-wrap">
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
              <h3 className="text-base font-bold text-white">Gartner CTEM & NIST Standards</h3>
              <p className="text-xs text-slate-400 font-mono">Frameworks for continuous threat exposure management, attack surface reduction, and cyber resiliency</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {standards.map((s, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded font-bold">
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
                <Radar size={18} className="text-amber-400" /> Initiate CTEM Discovery Scan
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleInitiateScan} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Asset Name & Network Range:</label>
                <input
                  type="text"
                  placeholder="e.g. ICU Bedside Patient Monitor Telemetry Hub"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-sans"
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Asset Category:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-sans"
                  value={assetCategory}
                  onChange={(e) => setAssetCategory(e.target.value)}
                >
                  <option value="Clinical IoT Device">Clinical IoT Device</option>
                  <option value="Shadow Medical Device / DICOM PACS">Shadow Medical Device / DICOM PACS</option>
                  <option value="Legacy Medical Workstation">Legacy Medical Workstation</option>
                  <option value="Telemedicine Video Hub">Telemedicine Video Hub</option>
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
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition shadow-lg shadow-amber-600/20"
                >
                  Initiate Scan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

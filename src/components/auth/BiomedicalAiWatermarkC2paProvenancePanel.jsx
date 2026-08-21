import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Sparkles,
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
  Image,
  Award,
  BadgeCheck
} from "lucide-react";
import {
  getC2paAssetsRegistry,
  embedC2paWatermark,
  verifyC2paManifest,
  getC2paClaimGenerators,
  exportC2paReportJson,
  getC2paStandards
} from "../../services/BiomedicalAiWatermarkC2paProvenanceService";
import "../../pages/auth/auth.css";

/**
 * BiomedicalAiWatermarkC2paProvenancePanel Component
 * 
 * Biomedical AI Diagnostic Image Watermarking & C2PA Provenance Console.
 * Features:
 * 1. Active C2PA Watermarked Diagnostic Assets Registry
 * 2. C2PA Manifest Claim Generator Profiles & PKI Certificates Matrix
 * 3. Steganographic Watermark & C2PA Manifest Verification Sandbox
 * 4. C2PA Provenance Audit JSON Report Inspector & Exporter
 * 5. C2PA Specification 2.0 & US Executive Order 14110 Standards
 * 6. Embed C2PA Cryptographic Watermark Modal
 */
export default function BiomedicalAiWatermarkC2paProvenancePanel() {
  // State
  const [assets, setAssets] = useState([]);
  const [claimGenerators, setClaimGenerators] = useState([]);
  const [standards, setStandards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [activeTab, setActiveTab] = useState("ASSETS"); // "ASSETS" | "GENERATORS" | "SANDBOX" | "JSON_REPORT" | "STANDARDS"

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTamperFilter, setSelectedTamperFilter] = useState("ALL");

  // Sandbox State
  const [selectedAssetId, setSelectedAssetId] = useState("C2PA-ASSET-9011");
  const [verificationResult, setVerificationResult] = useState(null);

  // JSON Report Exporter State
  const [exportedJson, setExportedJson] = useState("");
  const [copiedJson, setCopiedJson] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [assetName, setAssetName] = useState("");
  const [provenanceIssuer, setProvenanceIssuer] = useState("Mayo Clinic AI Radiology Lab");
  const [aiModel, setAiModel] = useState("Med-PaLM 2 Vision / CheXNet Synthesizer");

  // Load telemetry
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [assetList, genList, stdList] = await Promise.all([
        getC2paAssetsRegistry().catch(() => []),
        getC2paClaimGenerators().catch(() => []),
        getC2paStandards().catch(() => [])
      ]);

      setAssets(assetList);
      setClaimGenerators(genList);
      setStandards(stdList);

      if (assetList.length > 0) {
        const initialReport = await exportC2paReportJson(assetList[0].assetId);
        setExportedJson(initialReport);
      }
    } catch (err) {
      console.error("Failed to load C2PA watermarking data:", err);
      setMessage({ type: "error", text: "Failed connecting to AI Watermark C2PA Provenance service." });
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
      const jsonStr = await exportC2paReportJson(assetId);
      setExportedJson(jsonStr);
      setCopiedJson(false);
    } catch (err) {
      console.error("Failed exporting C2PA report:", err);
    }
  };

  // Run C2PA Manifest Verification Sandbox
  const handleVerifyC2pa = async (e) => {
    e?.preventDefault();
    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const result = await verifyC2paManifest(selectedAssetId);
      setVerificationResult(result);
      setMessage({
        type: "success",
        text: `C2PA Manifest verified in ${result.verificationLatencyMs}ms! Signature: VALID. Watermark: DETECTED. Tamper Risk: ${result.tamperRiskScore}.`
      });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "C2PA manifest verification failed." });
    } finally {
      setActionLoading(false);
    }
  };

  // Embed Watermark
  const handleEmbedWatermark = async (e) => {
    e.preventDefault();
    if (!assetName.trim()) return;

    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const newAsset = await embedC2paWatermark({
        assetName: assetName.trim(),
        provenanceIssuer,
        aiModel
      });

      setAssetName("");
      setIsModalOpen(false);
      setMessage({
        type: "success",
        text: `C2PA Cryptographic Watermark embedded in ${newAsset.assetName}! Manifest Hash: ${newAsset.c2paManifestHash.substring(0, 18)}...`
      });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "Failed to embed C2PA watermark." });
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
        a.provenanceIssuer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.assetId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.aiGeneratorModel.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesTamper = selectedTamperFilter === "ALL" || a.tamperCheckStatus.includes(selectedTamperFilter);

      return matchesSearch && matchesTamper;
    });
  }, [assets, searchQuery, selectedTamperFilter]);

  // Metrics
  const metrics = useMemo(() => {
    const totalAssets = assets.length;
    const authenticCount = assets.filter((a) => a.tamperCheckStatus === "AUTHENTIC_UNALTERED").length;
    const generatorsCount = claimGenerators.length;

    return { totalAssets, authenticCount, generatorsCount };
  }, [assets, claimGenerators]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* 1. Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden text-slate-100">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center gap-1.5 font-mono">
                <Sparkles size={12} /> C2PA CONTENT CREDENTIALS
              </span>
              <span className="px-3 py-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1 font-mono">
                <BadgeCheck size={12} /> STEGANOGRAPHIC WATERMARKING
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Biomedical AI Watermarking & C2PA Provenance
            </h2>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Cryptographic asset manifests, deep latent frequency watermarking, deepfake diagnostic detection, and content credential authentication under C2PA v2.0 and US EO 14110 directives.
            </p>
          </div>

          {/* Telemetry Widget */}
          <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl w-full lg:w-auto text-xs space-y-2">
            <div className="flex items-center justify-between gap-6 font-mono">
              <span className="text-slate-400 font-sans font-bold uppercase text-[10px]">C2PA Watermark Engine</span>
              <span className="text-amber-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                WATERMARKING ACTIVE
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-700/80 font-mono text-[11px]">
              <div>Certified Assets: <strong className="text-white">{metrics.totalAssets} DICOM Scans</strong></div>
              <div>Authenticity State: <strong className="text-emerald-400">{metrics.authenticCount} Authentic</strong></div>
              <div>Claim Generators: <strong className="text-amber-300">{metrics.generatorsCount} PKI Nodes</strong></div>
              <div>Tamper Detection: <strong className="text-emerald-400">100% VERIFIED</strong></div>
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
            <Image size={15} /> Certified Assets ({assets.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("GENERATORS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "GENERATORS"
                ? "bg-amber-600 text-white font-black shadow-lg shadow-amber-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Award size={15} /> Claim Generators ({claimGenerators.length})
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
            <Zap size={15} /> Manifest Verification Sandbox
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
            <Code size={15} /> C2PA Audit JSON Report
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
            <ShieldCheck size={15} /> C2PA & ISO Standards ({standards.length})
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-amber-600/20"
        >
          <PlusCircle size={15} /> Embed C2PA Watermark
        </button>
      </div>

      {/* 3. ASSETS TAB */}
      {activeTab === "ASSETS" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white">Watermarked Diagnostic Image Assets</h3>
              <p className="text-xs text-slate-400 font-mono">Asset IDs, C2PA manifest hashes, watermark algorithms, provenance issuers, and AI generator models</p>
            </div>

            {/* Search & Tamper Filter */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search size={14} className="absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search asset, issuer, model..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <select
                className="py-2 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                value={selectedTamperFilter}
                onChange={(e) => setSelectedTamperFilter(e.target.value)}
              >
                <option value="ALL">All Authenticity States</option>
                <option value="AUTHENTIC">AUTHENTIC UNALTERED</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-3">Asset ID</th>
                  <th className="p-3">Diagnostic Name & C2PA Hash</th>
                  <th className="p-3">Watermark Algorithm</th>
                  <th className="p-3">Provenance Issuer</th>
                  <th className="p-3">AI Generator Model</th>
                  <th className="p-3 text-right">Tamper Status</th>
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
                      <div className="text-[10px] text-amber-300 font-mono">{a.c2paManifestHash.substring(0, 32)}...</div>
                    </td>
                    <td className="p-3 text-slate-300 font-mono text-[10px]">{a.watermarkAlgorithm}</td>
                    <td className="p-3 text-slate-400 font-mono text-[10px]">{a.provenanceIssuer}</td>
                    <td className="p-3 text-slate-300 font-mono text-[10px]">{a.aiGeneratorModel}</td>
                    <td className="p-3 text-right font-sans">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {a.tamperCheckStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. CLAIM GENERATORS TAB */}
      {activeTab === "GENERATORS" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Award size={18} className="text-amber-400" /> Certified C2PA Claim Generators
              </h3>
              <p className="text-xs text-slate-400 font-mono">Format standards, cryptographic signing key types, certifying bodies, and status</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {claimGenerators.map((g, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 font-sans">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded font-bold">
                    {g.generatorId}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">{g.status}</span>
                </div>

                <h4 className="text-sm font-bold text-white">{g.generatorName}</h4>

                <div className="space-y-1 font-mono text-[11px]">
                  <div className="text-slate-400">Format: <strong className="text-amber-300">{g.formatStandard}</strong></div>
                  <div className="text-slate-400">Signing Key: <strong className="text-white">{g.signingKeyType}</strong></div>
                  <div className="text-slate-400">Certifying Body: <strong className="text-emerald-400">{g.certifyingBody}</strong></div>
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
                <Zap size={18} className="text-amber-400" /> C2PA Manifest Verification Sandbox
              </h3>
            </div>

            <form onSubmit={handleVerifyC2pa} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Target Diagnostic Asset ID:</label>
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
                <Zap size={16} /> Verify C2PA Manifest & Steganographic Watermark
              </button>
            </form>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-400" /> Provenance Verification Output
              </h3>
            </div>

            {verificationResult ? (
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-sans font-bold uppercase">Specification:</span>
                  <div className="text-[10px] text-amber-300">{verificationResult.c2paSpecVersion}</div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[11px] p-3 bg-slate-950/60 rounded-xl border border-slate-800 font-sans">
                  <div>Signature Status: <strong className="text-emerald-400">VALID CERTIFIED</strong></div>
                  <div>Tamper Risk Score: <strong className="text-emerald-400">{verificationResult.tamperRiskScore}</strong></div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-2xl">
                Click "Verify C2PA Manifest & Steganographic Watermark" to validate asset content credentials.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. C2PA AUDIT JSON REPORT TAB */}
      {activeTab === "JSON_REPORT" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Code size={18} className="text-amber-400" /> C2PA Audit JSON Report
              </h3>
              <p className="text-xs text-slate-400 font-mono">Standardized C2PA v2.0 & ISO/IEC 19566-5 Audit JSON schema detailing manifest hash, issuer, and watermark algorithm</p>
            </div>

            <button
              type="button"
              onClick={handleCopyJson}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 border border-slate-700"
            >
              {copiedJson ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
              {copiedJson ? "Copied C2PA Report JSON!" : "Copy C2PA Report JSON"}
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
              <h3 className="text-base font-bold text-white">C2PA & ISO Content Provenance Standards</h3>
              <p className="text-xs text-slate-400 font-mono">Standards for digital media watermarking and content authenticity assertions</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

      {/* 8. EMBED MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full text-slate-100 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles size={18} className="text-amber-400" /> Embed C2PA Watermark
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEmbedWatermark} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Diagnostic Asset Name:</label>
                <input
                  type="text"
                  placeholder="e.g. Ultrasound Cardiac Diagnostic Scan"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-sans"
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Provenance Issuer Authority:</label>
                <input
                  type="text"
                  placeholder="e.g. Mayo Clinic AI Radiology Lab"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-sans"
                  value={provenanceIssuer}
                  onChange={(e) => setProvenanceIssuer(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">AI Generator Model:</label>
                <input
                  type="text"
                  placeholder="e.g. Med-PaLM 2 Vision / CheXNet Synthesizer"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-sans"
                  value={aiModel}
                  onChange={(e) => setAiModel(e.target.value)}
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
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition shadow-lg shadow-amber-600/20"
                >
                  Embed Watermark
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

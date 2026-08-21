import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Globe,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Activity,
  Zap,
  Search,
  Plus,
  RefreshCw,
  Eye,
  Lock,
  CheckCircle2,
  X,
  Sliders,
  Sparkles,
  Server,
  Layers,
  Terminal,
  Crosshair,
  Radar,
  Radio,
  FileText,
  Download,
  Flame,
  ArrowUpRight
} from "lucide-react";

/**
 * CtemAttackSurfaceHubPage Component
 *
 * High-Assurance Continuous Threat Exposure Management (CTEM) & Attack Surface Hub.
 * Enforces Gartner CTEM 5-Phase Framework, CVSS v4.0, EPSS Exploit Prediction Scoring,
 * External Attack Surface Management (EASM), and Automated Breach Remediation Mobilization.
 */
export default function CtemAttackSurfaceHubPage() {
  // State
  const [assets, setAssets] = useState([
    {
      assetId: "EASM-ASSET-101",
      assetName: "api.medtrack-health.org (External API Gateway)",
      assetType: "PUBLIC_API_GATEWAY",
      exposureLevel: "CRITICAL_EXPOSURE",
      cvssScore: 9.8,
      epssProbability: "94.2% (HIGH_EXPLOITATION_PROBABILITY)",
      detectedVulnerabilities: ["CVE-2026-30192 (Remote Code Execution in Ingress)", "TLS 1.1 Deprecated Cipher Suite"],
      remediationStatus: "REMEDIATION_IN_PROGRESS",
      lastScannedTimestamp: "2026-08-14T01:15:00Z"
    },
    {
      assetId: "EASM-ASSET-102",
      assetName: "medtrack-clinical-telemetry-s3-vault.s3.amazonaws.com",
      assetType: "CLOUD_STORAGE_BUCKET",
      exposureLevel: "HIGH_EXPOSURE",
      cvssScore: 8.5,
      epssProbability: "68.4%",
      detectedVulnerabilities: ["Overly Permissive S3 Bucket Policy (READ_ACL)"],
      remediationStatus: "MOBILIZED_PLAYBOOK_ACTIVE",
      lastScannedTimestamp: "2026-08-14T00:50:00Z"
    },
    {
      assetId: "EASM-ASSET-103",
      assetName: "198.51.100.42 (Edge Router - Emergency Hospital Portal)",
      assetType: "NETWORK_EDGE_ROUTER",
      exposureLevel: "LOW_EXPOSURE",
      cvssScore: 3.2,
      epssProbability: "2.1%",
      detectedVulnerabilities: ["Open Port 8443 (Management Console)"],
      remediationStatus: "MONITORING_SECURE",
      lastScannedTimestamp: "2026-08-13T23:30:00Z"
    }
  ]);

  const [activeTab, setActiveTab] = useState("ATTACK_SURFACE"); // "ATTACK_SURFACE" | "SCANNER_SANDBOX" | "FRAMEWORK"
  const [searchTerm, setSearchTerm] = useState("");
  const [exposureFilter, setExposureFilter] = useState("ALL");
  const [notification, setNotification] = useState({ type: "", message: "" });
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [inspectAsset, setInspectAsset] = useState(null);

  // Scanner Simulator State
  const [targetDomainInput, setTargetDomainInput] = useState("");
  const [scanResult, setScanResult] = useState(null);
  const [scanning, setScanning] = useState(false);

  // CTEM 5-Phase Telemetry Status
  const [ctemTelemetry] = useState({
    scopingCoverage: "100% (All Public IPv4/IPv6 & Cloud Infrastructure)",
    discoveredAssetsCount: 142,
    prioritizedThreatsCount: 9,
    validatedExploitsCount: 2,
    mobilizedRemediationsCount: 7,
    avgRemediationTimeHours: 4.2
  });

  // Asset Scan Trigger Handler
  const handleTriggerScan = (e) => {
    e.preventDefault();
    if (!targetDomainInput.trim()) return;
    setScanning(true);

    setTimeout(() => {
      setScanResult({
        targetScanned: targetDomainInput.trim(),
        openPortsDiscovered: [80, 443, 8443],
        tlsCertificateValidity: "VALID (Expires in 182 days)",
        detectedThreatVector: "NONE_CRITICAL (EPSS 0.05%)",
        cvssScoreCalculated: 2.1,
        scanLatencyMs: 840
      });
      setScanning(false);
    }, 700);
  };

  // Dispatch Remediation Playbook Handler
  const handleDispatchPlaybook = (assetId) => {
    setAssets((prev) =>
      prev.map((a) =>
        a.assetId === assetId
          ? {
              ...a,
              exposureLevel: "LOW_EXPOSURE",
              remediationStatus: "REMEDIATION_COMPLETE_VERIFIED"
            }
          : a
      )
    );
    setNotification({
      type: "success",
      message: `SOAR Remediation Playbook dispatched for ${assetId}. Exposure mitigated!`
    });
  };

  // Filtered Assets List
  const filteredAssets = useMemo(() => {
    return assets.filter((a) => {
      const matchSearch =
        a.assetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.assetId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.assetType.toLowerCase().includes(searchTerm.toLowerCase());
      const matchExp =
        exposureFilter === "ALL" ||
        (exposureFilter === "CRITICAL" && a.exposureLevel.includes("CRITICAL")) ||
        (exposureFilter === "HIGH" && a.exposureLevel.includes("HIGH")) ||
        (exposureFilter === "LOW" && a.exposureLevel.includes("LOW"));
      return matchSearch && matchExp;
    });
  }, [assets, searchTerm, exposureFilter]);

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-8 space-y-6">
      
      {/* 1. Page Header */}
      <div className="max-w-7xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-red-400 bg-red-500/10 border border-red-500/20 rounded-full flex items-center gap-1.5 font-mono">
                <Radar size={13} className="animate-pulse" /> CTEM ATTACK SURFACE HUB
              </span>
              <span className="px-3 py-1 text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center gap-1">
                <ShieldAlert size={13} /> CVSS v4.0 / EPSS EXPLOIT SCORING
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Continuous Threat Exposure Management (CTEM) Control Center
            </h1>
            <p className="text-slate-400 text-sm max-w-3xl leading-relaxed">
              Continuous 5-stage threat exposure management framework (Scoping, Discovery, Prioritization, Validation, Mobilization) for external attack surface management (EASM) and automated remediation.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto">
            <button
              type="button"
              onClick={() => setScanModalOpen(true)}
              className="w-full lg:w-auto px-5 py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-2xl transition shadow-lg shadow-red-600/25 flex items-center justify-center gap-2"
            >
              <Crosshair size={16} /> Run EASM Attack Surface Scan
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
            { id: "ATTACK_SURFACE", label: "External Attack Surface", icon: Globe },
            { id: "SCANNER_SANDBOX", label: "Interactive EASM Scanner", icon: Crosshair },
            { id: "FRAMEWORK", label: "Gartner CTEM Framework Telemetry", icon: Layers }
          ].map((tab) => {
            const IconComp = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-red-600 text-white shadow-lg shadow-red-600/20"
                    : "bg-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <IconComp size={15} /> {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-slate-400 w-full md:w-auto justify-end">
          <div>Discovered Assets: <strong className="text-white">{ctemTelemetry.discoveredAssetsCount}</strong></div>
          <div>Mean Time to Remediate: <strong className="text-emerald-400">{ctemTelemetry.avgRemediationTimeHours} Hours</strong></div>
        </div>
      </div>

      {/* 3. TAB CONTENT: ATTACK SURFACE */}
      {activeTab === "ATTACK_SURFACE" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl text-xs">
            <div className="relative w-full sm:w-80">
              <Search size={14} className="absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="Search asset name, ID, or type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Filter Exposure:</span>
              <select
                value={exposureFilter}
                onChange={(e) => setExposureFilter(e.target.value)}
                className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="ALL">ALL EXPOSURE LEVELS</option>
                <option value="CRITICAL">CRITICAL EXPOSURE</option>
                <option value="HIGH">HIGH EXPOSURE</option>
                <option value="LOW">LOW EXPOSURE</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAssets.map((a) => (
              <div
                key={a.assetId}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl hover:border-red-500/40 transition flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 text-[11px] font-bold font-mono text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg">
                      {a.assetId}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${
                        a.exposureLevel.includes("CRITICAL")
                          ? "bg-red-500/20 text-red-400 border-red-500/30"
                          : a.exposureLevel.includes("HIGH")
                          ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                          : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                      }`}
                    >
                      {a.exposureLevel}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white font-mono truncate">{a.assetName}</h3>
                    <p className="text-[11px] text-slate-400 font-sans mt-0.5">{a.assetType}</p>
                  </div>

                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-1 text-xs font-mono">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 text-[10px] uppercase font-bold">CVSS v4.0 Score</span>
                      <strong className="text-red-400 font-bold">{a.cvssScore} / 10.0</strong>
                    </div>
                    <div className="text-purple-300 text-[11px]">EPSS: {a.epssProbability}</div>
                  </div>

                  <div className="space-y-1 text-xs font-mono">
                    <span className="text-slate-400 font-bold block">Detected Vulnerabilities:</span>
                    {a.detectedVulnerabilities?.map((vuln, idx) => (
                      <div key={idx} className="text-slate-300 text-[11px] truncate flex items-center gap-1">
                        <AlertTriangle size={11} className="text-amber-400 shrink-0" /> {vuln}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleDispatchPlaybook(a.assetId)}
                    className="flex-1 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <Zap size={13} /> Mobilize Playbook
                  </button>
                  <button
                    type="button"
                    onClick={() => setInspectAsset(a)}
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

      {/* 4. TAB CONTENT: SCANNER SANDBOX */}
      {activeTab === "SCANNER_SANDBOX" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Crosshair size={18} className="text-red-400" /> Interactive EASM Asset Discovery Scanner
            </h3>
            <p className="text-xs text-slate-400">
              Run active external attack surface discovery on domain endpoints, IP subnets, or public S3 bucket URLs to calculate real-time CVSS v4.0 scores.
            </p>

            <form onSubmit={handleTriggerScan} className="space-y-3">
              <input
                type="text"
                placeholder="Enter domain or IP (e.g. portal.medtrack-health.org or 198.51.100.42)"
                value={targetDomainInput}
                onChange={(e) => setTargetDomainInput(e.target.value)}
                className="w-full p-4 bg-slate-950 border border-slate-700 rounded-2xl text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
              />

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={scanning}
                  className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-xs transition flex items-center gap-2 shadow-lg shadow-red-600/20"
                >
                  {scanning ? <RefreshCw size={14} className="animate-spin" /> : <Radar size={14} />}
                  {scanning ? "Scanning Target..." : "Execute EASM Discovery Scan"}
                </button>
              </div>
            </form>

            {scanResult && (
              <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl text-xs space-y-3 font-mono">
                <div className="flex items-center justify-between text-emerald-400 font-bold border-b border-slate-800 pb-2">
                  <span>Target: {scanResult.targetScanned}</span>
                  <span>Latency: {scanResult.scanLatencyMs} ms</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Open Ports Discovered</span>
                  <span className="text-purple-300 font-bold">{scanResult.openPortsDiscovered.join(", ")}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Calculated CVSS v4.0 Score</span>
                  <span className="text-emerald-400 font-bold">{scanResult.cvssScoreCalculated} / 10.0</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. TAB CONTENT: FRAMEWORK */}
      {activeTab === "FRAMEWORK" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers size={18} className="text-red-400" /> Gartner CTEM 5-Phase Architecture Progress
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs font-mono">
              {[
                { stage: "1. SCOPING", desc: "Define digital business footprint & critical healthcare assets." },
                { stage: "2. DISCOVERY", desc: "Map exposed IPv4/IPv6, APIs, certificates & cloud buckets." },
                { stage: "3. PRIORITIZATION", desc: "Rank vulnerabilities using CVSS v4.0 & EPSS exploit probability." },
                { stage: "4. VALIDATION", desc: "Simulate threat actor attack vectors & validate breach risk." },
                { stage: "5. MOBILIZATION", desc: "Dispatch automated SOAR playbooks for rapid patch verification." }
              ].map((s, idx) => (
                <div key={idx} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                  <div className="text-red-400 font-bold">{s.stage}</div>
                  <p className="text-[11px] text-slate-300 font-sans leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Real-time Attack Vector Topology Map */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Flame size={18} className="text-amber-400" /> Attack Vector Topology & Exploitation Risk Matrix
            </h3>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3 font-mono text-xs">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400 uppercase font-bold">Threat Vector</span>
                <span className="text-slate-400 uppercase font-bold">Risk Impact</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-200">Public S3 Bucket Read ACL Exposure</span>
                <span className="px-2 py-0.5 text-[10px] bg-red-500/20 text-red-400 rounded-md border border-red-500/30">CRITICAL</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-200">Deprecated TLS 1.1 Ingress Listener</span>
                <span className="px-2 py-0.5 text-[10px] bg-amber-500/20 text-amber-400 rounded-md border border-amber-500/30">HIGH</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-200">Unauthenticated Edge Port 8443 Management Probe</span>
                <span className="px-2 py-0.5 text-[10px] bg-emerald-500/20 text-emerald-400 rounded-md border border-emerald-500/30">MODERATE</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scan Modal */}
      {scanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full text-slate-100 space-y-4 shadow-2xl font-sans">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Radar size={18} className="text-red-400" /> Run Full Attack Surface Discovery
              </h3>
              <button type="button" onClick={() => setScanModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Initiates an automated port scan, SSL certificate audit, and S3 bucket exposure check across all enterprise subnets.
            </p>

            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setScanModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setScanModalOpen(false);
                  setNotification({ type: "success", message: "Full EASM Attack Surface Scan initiated across all subnets!" });
                }}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-xs transition shadow-lg shadow-red-600/20"
              >
                Start Comprehensive Scan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inspect Asset Modal */}
      {inspectAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full text-slate-100 space-y-4 shadow-2xl font-mono">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white font-sans">{inspectAsset.assetId} - Details</h3>
              <button type="button" onClick={() => setInspectAsset(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs space-y-2">
              <div>Name: <strong className="text-red-300 font-sans">{inspectAsset.assetName}</strong></div>
              <div>Type: <strong className="text-purple-300">{inspectAsset.assetType}</strong></div>
              <div>CVSS: <span className="text-amber-400 font-bold">{inspectAsset.cvssScore}</span></div>
              <div>EPSS: <span className="text-emerald-400">{inspectAsset.epssProbability}</span></div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setInspectAsset(null)}
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


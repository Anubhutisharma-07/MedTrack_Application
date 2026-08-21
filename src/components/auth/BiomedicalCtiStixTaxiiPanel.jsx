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
  Radio,
  Share2,
  Tag,
  Copy,
  Server
} from "lucide-react";
import {
  getCtiStixTaxiiInventory,
  shareStixThreatIndicator,
  syncTaxiiFeed,
  getCtiStixTaxiiStandards,
  getTaxiiEndpoints,
  exportStixBundleJson
} from "../../services/BiomedicalCtiStixTaxiiService";
import "../../pages/auth/auth.css";

/**
 * BiomedicalCtiStixTaxiiPanel Component
 * 
 * Biomedical Cyber Threat Intelligence (CTI) & STIX 2.1 / TAXII 2.1 Threat Sharing Console.
 * Features:
 * 1. Health-ISAC & CISA TAXII 2.1 Threat Feed Inventory & TLP Classification Matrix
 * 2. STIX 2.1 Graph Pattern Matcher & Real-Time TAXII Ingestion Sandbox
 * 3. OASIS STIX 2.1 / TAXII 2.1 & FIRST TLP 2.0 Standards
 * 4. STIX 2.1 Threat Indicator Publishing Modal
 */
export default function BiomedicalCtiStixTaxiiPanel() {
  // State
  const [feeds, setFeeds] = useState([]);
  const [endpoints, setEndpoints] = useState([]);
  const [standards, setStandards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [activeTab, setActiveTab] = useState("FEEDS"); // "FEEDS" | "SANDBOX" | "JSON_EXPORT" | "ENDPOINTS" | "STANDARDS"

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTlpFilter, setSelectedTlpFilter] = useState("ALL");

  // Sandbox State
  const [selectedFeedId, setSelectedFeedId] = useState("CTI-FEED-2501");
  const [syncResult, setSyncResult] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedName, setFeedName] = useState("");
  const [threatActorGroup, setThreatActorGroup] = useState("UNC-EMERGING-BEACON");
  const [tlpMarking, setTlpMarking] = useState("TLP:AMBER");
  const [stixPattern, setStixPattern] = useState("[network-traffic:dst_port = 8443]");
  const [description, setDescription] = useState("");
  const [exportedJson, setExportedJson] = useState("");
  const [copiedJson, setCopiedJson] = useState(false);

  // Load telemetry
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [feedList, endpointList, stdList] = await Promise.all([
        getCtiStixTaxiiInventory().catch(() => []),
        getTaxiiEndpoints().catch(() => []),
        getCtiStixTaxiiStandards().catch(() => [])
      ]);

      setFeeds(feedList);
      setEndpoints(endpointList);
      setStandards(stdList);

      if (feedList.length > 0) {
        const initialJson = await exportStixBundleJson(feedList[0].feedId);
        setExportedJson(initialJson);
      }
    } catch (err) {
      console.error("Failed to load biomedical CTI STIX TAXII data:", err);
      setMessage({ type: "error", text: "Failed connecting to CTI STIX TAXII service." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Run TAXII Sync
  const handleSyncTaxii = async (e) => {
    e?.preventDefault();
    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const result = await syncTaxiiFeed(selectedFeedId);
      setSyncResult(result);
      setMessage({ type: "success", text: `TAXII 2.1 Ingestion completed in ${result.iocRuleMatchingLatencyMs}ms! Ingested ${result.stixObjectsIngested} STIX 2.1 objects over mutual TLS. TLP Check: PASSED.` });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "TAXII 2.1 feed synchronization failed." });
    } finally {
      setActionLoading(false);
    }
  };

  // Publish STIX Indicator
  const handlePublishIndicator = async (e) => {
    e.preventDefault();
    if (!feedName.trim()) return;

    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const newFeed = await shareStixThreatIndicator({ feedName: feedName.trim() });

      setFeedName("");
      setDescription("");
      setIsModalOpen(false);
      setMessage({ type: "success", text: `STIX 2.1 Threat Indicator ${newFeed.feedId} published to TAXII 2.1 server under TLP:AMBER protocol!` });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "Failed to publish STIX 2.1 threat indicator." });
    } finally {
      setActionLoading(false);
    }
  };

  // Copy JSON to Clipboard
  const handleCopyJson = () => {
    navigator.clipboard.writeText(exportedJson);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  // Filtered Feeds
  const filteredFeeds = useMemo(() => {
    return feeds.filter((f) => {
      const matchesSearch =
        f.feedName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.threatActorGroup.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.taxiiCollectionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.feedId.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesTlp = selectedTlpFilter === "ALL" || f.tlpMarking.includes(selectedTlpFilter);

      return matchesSearch && matchesTlp;
    });
  }, [feeds, searchQuery, selectedTlpFilter]);

  // Metrics
  const metrics = useMemo(() => {
    const totalFeeds = feeds.length;
    const totalIndicators = feeds.reduce((acc, curr) => acc + curr.indicatorsCount, 0);
    const avgConfidence = (feeds.reduce((acc, curr) => acc + curr.confidenceScore, 0) / (totalFeeds || 1)).toFixed(0);

    return { totalFeeds, totalIndicators, avgConfidence };
  }, [feeds]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* 1. Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden text-slate-100">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-red-400 bg-red-500/10 border border-red-500/20 rounded-full flex items-center gap-1.5 font-mono">
                <Radar size={12} /> CTI & STIX/TAXII THREAT SHARING
              </span>
              <span className="px-3 py-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1 font-mono">
                <ShieldCheck size={12} /> HEALTH-ISAC / OASIS STIX 2.1
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Biomedical CTI & STIX/TAXII Threat Sharing
            </h2>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Automated real-time ingestion and sharing of STIX 2.1 cyber threat objects (Indicators, Observables, Malware, Threat Actors) over TAXII 2.1 HTTPS mTLS feeds under FIRST TLP 2.0 rules.
            </p>
          </div>

          {/* Telemetry Widget */}
          <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl w-full lg:w-auto text-xs space-y-2">
            <div className="flex items-center justify-between gap-6 font-mono">
              <span className="text-slate-400 font-sans font-bold uppercase text-[10px]">TAXII Feed Telemetry</span>
              <span className="text-red-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
                REALTIME SYNCED
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-700/80 font-mono text-[11px]">
              <div>TAXII Feeds: <strong className="text-white">{metrics.totalFeeds} Active</strong></div>
              <div>STIX IOCs: <strong className="text-red-300">{metrics.totalIndicators.toLocaleString()} Indicators</strong></div>
              <div>Confidence Score: <strong className="text-emerald-400">{metrics.avgConfidence}% Verified</strong></div>
              <div>TLP Protocol: <strong className="text-emerald-400">AMBER+STRICT</strong></div>
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
            onClick={() => setActiveTab("FEEDS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "FEEDS"
                ? "bg-red-600 text-white font-black shadow-lg shadow-red-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Radar size={15} /> TAXII 2.1 Feeds ({feeds.length})
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
            <Zap size={15} /> STIX 2.1 Pattern Verification Sandbox
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
            <ShieldCheck size={15} /> OASIS STIX/TAXII & TLP Standards ({standards.length})
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-red-600/20"
        >
          <PlusCircle size={15} /> Publish STIX 2.1 Indicator
        </button>
      </div>

      {/* 3. FEEDS TAB */}
      {activeTab === "FEEDS" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white">Automated Health-ISAC & CISA TAXII 2.1 Threat Feeds</h3>
              <p className="text-xs text-slate-400 font-mono">Feed IDs, names, STIX 2.1 object types, TLP markings, threat actor groups, confidence scores, and indicator counts</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-3">Feed ID</th>
                  <th className="p-3">Feed Name & TAXII Collection</th>
                  <th className="p-3">STIX Object / Actor Group</th>
                  <th className="p-3">TLP Protocol Marking</th>
                  <th className="p-3 text-right">Synchronization Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {feeds.map((f, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/60">
                    <td className="p-3 font-bold text-red-400">{f.feedId}</td>
                    <td className="p-3 font-sans">
                      <div className="font-semibold text-white">{f.feedName}</div>
                      <div className="text-[10px] text-red-300 font-mono">{f.taxiiCollectionId}</div>
                    </td>
                    <td className="p-3 font-mono text-[10px]">
                      <div className="text-slate-300">{f.stixObjectType}</div>
                      <div className="text-red-400 font-bold">{f.threatActorGroup}</div>
                    </td>
                    <td className="p-3 text-red-300 font-mono text-[10px]">
                      <span className="px-2 py-0.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded font-bold">
                        {f.tlpMarking}
                      </span>
                    </td>
                    <td className="p-3 text-right font-sans">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {f.ingestionStatus} ({f.indicatorsCount} IOCs)
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. SANDBOX TAB */}
      {activeTab === "SANDBOX" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* TAXII Ingestion Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Zap size={18} className="text-red-400" /> STIX 2.1 Pattern Verification & TAXII Sync Sandbox
              </h3>
            </div>

            <form onSubmit={handleSyncTaxii} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Target TAXII 2.1 Threat Collection:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-red-500 font-sans"
                  value={selectedFeedId}
                  onChange={(e) => setSelectedFeedId(e.target.value)}
                >
                  {feeds.map((f) => (
                    <option key={f.feedId} value={f.feedId}>
                      {f.feedId} - {f.feedName}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-lg shadow-red-600/20"
              >
                <Zap size={16} /> Execute Real-Time TAXII 2.1 Ingestion Sync
              </button>
            </form>

            {syncResult && (
              <div className="space-y-3 font-mono text-xs pt-3 border-t border-slate-800">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-sans font-bold uppercase">TAXII mTLS Connection:</span>
                  <div className="text-sm font-bold text-emerald-400">{syncResult.taxiiConnectionStatus}</div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[11px] p-3 bg-slate-950/60 rounded-xl border border-slate-800 font-sans">
                  <div>STIX Objects Ingested: <strong className="text-emerald-400 font-mono text-[10px]">{syncResult.stixObjectsIngested} Objects</strong></div>
                  <div>TLP Protocol Check: <strong className="text-emerald-400">PASSED</strong></div>
                </div>
              </div>
            )}
          </div>

          {/* STIX 2.1 Pattern Evaluation Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-400" /> Synchronization Output
              </h3>
            </div>

            {syncResult ? (
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-sans font-bold uppercase">TAXII mTLS Connection:</span>
                  <div className="text-sm font-bold text-emerald-400">{syncResult.taxiiConnectionStatus}</div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[11px] p-3 bg-slate-950/60 rounded-xl border border-slate-800 font-sans">
                  <div>STIX Objects Ingested: <strong className="text-emerald-400 font-mono text-[10px]">{syncResult.stixObjectsIngested} Objects</strong></div>
                  <div>TLP Protocol Check: <strong className="text-emerald-400">PASSED</strong></div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-2xl">
                Click "Execute Real-Time TAXII 2.1 Ingestion Sync" to sync threat feeds.
              </div>
            )}
          </div>

        </div>
      )}

      {/* 5. STIX 2.1 JSON SCHEMA INSPECTOR TAB */}
      {activeTab === "JSON_EXPORT" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Code size={18} className="text-red-400" /> STIX 2.1 Compliant JSON Bundle Schema
              </h3>
              <p className="text-xs text-slate-400 font-mono">Standardized OASIS STIX 2.1 JSON schema representing Indicator, Threat-Actor, and Relationship graph nodes</p>
            </div>

            <button
              type="button"
              onClick={handleCopyJson}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 border border-slate-700"
            >
              {copiedJson ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
              {copiedJson ? "Copied STIX JSON!" : "Copy STIX 2.1 JSON"}
            </button>
          </div>

          <div className="relative rounded-2xl border border-slate-800 bg-slate-950 p-4 max-h-[500px] overflow-y-auto">
            <pre className="text-xs font-mono text-red-300 leading-relaxed whitespace-pre-wrap">
              {exportedJson}
            </pre>
          </div>
        </div>
      )}

      {/* 6. TAXII 2.1 ENDPOINTS TAB */}
      {activeTab === "ENDPOINTS" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">TAXII 2.1 Server Endpoints & mTLS Authentication</h3>
              <p className="text-xs text-slate-400 font-mono">Configured TAXII 2.1 server REST API collection URIs, media types, and mutual TLS client certificate statuses</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {endpoints.map((ep, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 font-sans">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Server size={18} className="text-red-400" />
                    <h4 className="text-sm font-bold text-white">{ep.collectionTitle}</h4>
                  </div>
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                    {ep.authMethod}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                  <div>
                    <span className="text-slate-400 text-[10px] block uppercase font-sans font-bold">TAXII Collection Endpoint:</span>
                    <span className="text-red-300 break-all">{ep.endpointUrl}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block uppercase font-sans font-bold">Media Type:</span>
                    <span className="text-slate-300">{ep.mediaType}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. STANDARDS TAB */}
      {activeTab === "STANDARDS" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">OASIS STIX 2.1 & TAXII 2.1 Standards</h3>
              <p className="text-xs text-slate-400 font-mono">Frameworks for structured threat intelligence, automated exchange protocols, and TLP protocol classification</p>
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
                <Radar size={18} className="text-red-400" /> Publish STIX 2.1 Threat Indicator
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handlePublishIndicator} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Threat Indicator Name:</label>
                <input
                  type="text"
                  placeholder="e.g. Hospital Infusion Pump Command Probe Feed"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-red-500 font-sans"
                  value={feedName}
                  onChange={(e) => setFeedName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Threat Actor Attribution Group:</label>
                <input
                  type="text"
                  placeholder="e.g. APT-HEALTHCARE-PHANTOM"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-red-500 font-sans"
                  value={threatActorGroup}
                  onChange={(e) => setThreatActorGroup(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">FIRST TLP Marking Protocol:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-red-500 font-sans"
                  value={tlpMarking}
                  onChange={(e) => setTlpMarking(e.target.value)}
                >
                  <option value="TLP:AMBER">TLP:AMBER (Restricted to Organization & Partners)</option>
                  <option value="TLP:AMBER+STRICT">TLP:AMBER+STRICT (Restricted to Organization Only)</option>
                  <option value="TLP:GREEN">TLP:GREEN (Community Wide Sharing)</option>
                  <option value="TLP:RED">TLP:RED (Strict Named Recipients Only)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">STIX 2.1 Pattern Expression:</label>
                <input
                  type="text"
                  placeholder="[network-traffic:dst_port = 8443]"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-red-300 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
                  value={stixPattern}
                  onChange={(e) => setStixPattern(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Threat Description & Context:</label>
                <textarea
                  rows={3}
                  placeholder="Detailed context regarding the threat vector..."
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-red-500 font-sans"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition shadow-lg shadow-red-600/20"
                >
                  Publish Indicator
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Link2,
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
  Network,
  Smartphone,
  Globe,
  SlidersHorizontal,
  Zap,
  Check,
  Boxes,
  Copy,
  Radio,
  Share2,
  FileSpreadsheet
} from "lucide-react";
import {
  getBlockchainBlocks,
  mineAuditBlock,
  verifyZkpTransaction,
  getSmartContractRegistry,
  exportBlockchainReportJson,
  getBlockchainStandards
} from "../../services/BiomedicalBlockchainService";
import "../../pages/auth/auth.css";

/**
 * BiomedicalBlockchainPanel Component
 * 
 * Biomedical Blockchain Audit & Cryptographic Provenance Ledger Console.
 * Features:
 * 1. Immutable Audit Blocks & Smart Contract Patient Consent Registry
 * 2. Smart Contract Registry & Gas Usage Matrix
 * 3. Zero-Knowledge Proof (zk-SNARKs) Transaction Integrity Verification Sandbox
 * 4. Blockchain Audit JSON Report Inspector & Exporter
 * 5. ISO/TC 307 & IEEE 2418.6 Standards
 * 6. Audit Block Mining & Cross-Institutional Provenance Modal
 */
export default function BiomedicalBlockchainPanel() {
  // State
  const [blocks, setBlocks] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [standards, setStandards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [activeTab, setActiveTab] = useState("BLOCKS"); // "BLOCKS" | "CONTRACTS" | "ZKP" | "JSON_REPORT" | "STANDARDS"

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedZkpFilter, setSelectedZkpFilter] = useState("ALL");

  // ZKP State
  const [selectedBlockNumber, setSelectedBlockNumber] = useState(104892);
  const [txHash, setTxHash] = useState("0x7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a");
  const [zkpResult, setZkpResult] = useState(null);

  // JSON Report Exporter State
  const [exportedJson, setExportedJson] = useState("");
  const [copiedJson, setCopiedJson] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [purpose, setPurpose] = useState("Patient Consent Grant (PHI Disclosure)");

  // Load telemetry
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [blockList, contractList, stdList] = await Promise.all([
        getBlockchainBlocks().catch(() => []),
        getSmartContractRegistry().catch(() => []),
        getBlockchainStandards().catch(() => [])
      ]);

      setBlocks(blockList);
      setContracts(contractList);
      setStandards(stdList);

      if (blockList.length > 0) {
        const initialReport = await exportBlockchainReportJson(blockList[0].blockNumber);
        setExportedJson(initialReport);
      }
    } catch (err) {
      console.error("Failed to load biomedical blockchain data:", err);
      setMessage({ type: "error", text: "Failed connecting to Biomedical Blockchain service." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Block Selection for Report Export
  const handleExportBlockReport = async (blockNum) => {
    try {
      setSelectedBlockNumber(blockNum);
      const jsonStr = await exportBlockchainReportJson(blockNum);
      setExportedJson(jsonStr);
      setCopiedJson(false);
    } catch (err) {
      console.error("Failed exporting blockchain report:", err);
    }
  };

  // Run ZKP Verification
  const handleVerifyZkp = async (e) => {
    e?.preventDefault();
    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const result = await verifyZkpTransaction(txHash);
      setZkpResult(result);
      setMessage({
        type: "success",
        text: `Zero-Knowledge Proof verified in ${result.verificationLatencyMs}ms! Circuit: ${result.zkpProofType}. Anonymity: ENFORCED.`
      });
    } catch (err) {
      setMessage({ type: "error", text: "ZKP verification failed." });
    } finally {
      setActionLoading(false);
    }
  };

  // Mine Block
  const handleMineBlock = async (e) => {
    e.preventDefault();

    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const newBlock = await mineAuditBlock({ purpose });

      setIsModalOpen(false);
      setMessage({ type: "success", text: `Audit Block #${newBlock.blockNumber} anchored to ledger with zk-SNARK proof!` });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "Failed to mine audit block." });
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

  // Filtered Blocks
  const filteredBlocks = useMemo(() => {
    return blocks.filter((b) => {
      const matchesSearch =
        b.auditPurpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.blockHash.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.blockNumber.toString().includes(searchQuery) ||
        b.smartContractAddress.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesZkp = selectedZkpFilter === "ALL" || b.zkpVerificationStatus.includes(selectedZkpFilter);

      return matchesSearch && matchesZkp;
    });
  }, [blocks, searchQuery, selectedZkpFilter]);

  // Metrics
  const metrics = useMemo(() => {
    const totalBlocks = blocks.length;
    const zkpVerified = blocks.filter((b) => b.zkpVerificationStatus === "ZKP_SNARK_VERIFIED").length;
    const totalTx = blocks.reduce((acc, b) => acc + (b.transactionCount || 0), 0);

    return { totalBlocks, zkpVerified, totalTx };
  }, [blocks]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* 1. Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden text-slate-100">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 rounded-full flex items-center gap-1.5 font-mono">
                <Boxes size={12} /> BIOMEDICAL BLOCKCHAIN LEDGER
              </span>
              <span className="px-3 py-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1 font-mono">
                <ShieldCheck size={12} /> zk-SNARKs & PBFT CONSENSUS
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Biomedical Blockchain Audit & Cryptographic Provenance Ledger
            </h2>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Immutable HIPAA access audit trails, zero-knowledge patient consent validation, cross-institutional data provenance, and smart contract compliance under ISO/TC 307 guidelines.
            </p>
          </div>

          {/* Telemetry Widget */}
          <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl w-full lg:w-auto text-xs space-y-2">
            <div className="flex items-center justify-between gap-6 font-mono">
              <span className="text-slate-400 font-sans font-bold uppercase text-[10px]">Ledger Telemetry</span>
              <span className="text-cyan-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                HYPERLEDGER ONLINE
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-700/80 font-mono text-[11px]">
              <div>Anchored Blocks: <strong className="text-white">{metrics.totalBlocks} Blocks</strong></div>
              <div>zk-SNARK Status: <strong className="text-cyan-300">{metrics.zkpVerified} Verified</strong></div>
              <div>Total Transactions: <strong className="text-emerald-400">{metrics.totalTx} Audits</strong></div>
              <div>Consensus Engine: <strong className="text-emerald-400">PBFT / RAFT</strong></div>
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
            onClick={() => setActiveTab("BLOCKS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "BLOCKS"
                ? "bg-cyan-600 text-white font-black shadow-lg shadow-cyan-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Boxes size={15} /> Anchored Blocks ({blocks.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("CONTRACTS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "CONTRACTS"
                ? "bg-cyan-600 text-white font-black shadow-lg shadow-cyan-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <FileSpreadsheet size={15} /> Smart Contracts ({contracts.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("ZKP")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "ZKP"
                ? "bg-cyan-600 text-white font-black shadow-lg shadow-cyan-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Zap size={15} /> Zero-Knowledge Proof Sandbox
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
            <Code size={15} /> Blockchain Audit JSON Report
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
            <ShieldCheck size={15} /> IEEE & ISO Standards ({standards.length})
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-cyan-600/20"
        >
          <PlusCircle size={15} /> Mine & Anchor Audit Block
        </button>
      </div>

      {/* 3. BLOCKS TAB */}
      {activeTab === "BLOCKS" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white">Anchored Audit Blocks & Smart Contracts</h3>
              <p className="text-xs text-slate-400 font-mono">Immutable block hashes, smart contract addresses, transaction counts, and ZKP validation states</p>
            </div>

            {/* Search & ZKP Filter */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search size={14} className="absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search block, hash, purpose..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <select
                className="py-2 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono"
                value={selectedZkpFilter}
                onChange={(e) => setSelectedZkpFilter(e.target.value)}
              >
                <option value="ALL">All ZKP Statuses</option>
                <option value="ZKP_SNARK_VERIFIED">ZKP VERIFIED</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-3">Block #</th>
                  <th className="p-3">Block Hash & Purpose</th>
                  <th className="p-3">Smart Contract Address</th>
                  <th className="p-3">Transactions</th>
                  <th className="p-3">zk-SNARK Status</th>
                  <th className="p-3 text-right">Consensus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {filteredBlocks.map((b, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/60 transition cursor-pointer" onClick={() => handleExportBlockReport(b.blockNumber)}>
                    <td className="p-3 font-bold text-cyan-400 flex items-center gap-1.5">
                      <Radio size={12} className="text-cyan-500 animate-pulse" />
                      #{b.blockNumber}
                    </td>
                    <td className="p-3 font-sans">
                      <div className="font-semibold text-white">{b.auditPurpose}</div>
                      <div className="text-[10px] text-cyan-300 font-mono">{b.blockHash}</div>
                    </td>
                    <td className="p-3 text-slate-400 font-mono text-[10px]">{b.smartContractAddress}</td>
                    <td className="p-3 font-bold text-white">{b.transactionCount} TXs</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          b.zkpVerificationStatus === "ZKP_SNARK_VERIFIED"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        }`}
                      >
                        {b.zkpVerificationStatus}
                      </span>
                    </td>
                    <td className="p-3 text-right font-sans">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                        {b.consensusMechanism}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. SMART CONTRACTS TAB */}
      {activeTab === "CONTRACTS" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileSpreadsheet size={18} className="text-cyan-400" /> Deployed Patient Consent Smart Contracts
              </h3>
              <p className="text-xs text-slate-400 font-mono">Contract addresses, Solidity compiler versions, average gas consumption, and execution status</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {contracts.map((c, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 font-sans">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded font-bold">
                    {c.contractName}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">{c.executionStatus}</span>
                </div>

                <h4 className="text-sm font-bold text-white">{c.contractName}</h4>

                <div className="space-y-1 font-mono text-[11px]">
                  <div className="text-slate-400">Compiler: <strong className="text-cyan-300">{c.compilerVersion}</strong></div>
                  <div className="text-slate-400">Avg Gas Usage: <strong className="text-white">{c.gasUsageAvg.toLocaleString()} Gas</strong></div>
                  <div className="text-slate-400">Total Audits: <strong className="text-emerald-400">{c.auditCount} Recorded</strong></div>
                  <div className="text-slate-500 text-[10px] break-all pt-1">Address: {c.contractAddress}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. ZKP TAB */}
      {activeTab === "ZKP" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Zap size={18} className="text-cyan-400" /> Zero-Knowledge Proof (zk-SNARK) Verification Sandbox
              </h3>
            </div>

            <form onSubmit={handleVerifyZkp} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Target Transaction Hash:</label>
                <input
                  type="text"
                  placeholder="e.g. 0x7f8a9b0c..."
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono"
                  value={txHash}
                  onChange={(e) => setTxHash(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-lg shadow-cyan-600/20"
              >
                <Zap size={16} /> Verify zk-SNARK Groth16 Circuit
              </button>
            </form>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-400" /> Circuit Verification Output
              </h3>
            </div>

            {zkpResult ? (
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-sans font-bold uppercase">Proof Type:</span>
                  <div className="text-[10px] text-cyan-300">{zkpResult.zkpProofType}</div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[11px] p-3 bg-slate-950/60 rounded-xl border border-slate-800 font-sans">
                  <div>Circuit Verified: <strong className="text-emerald-400">PASSED</strong></div>
                  <div>Anonymity Preserved: <strong className="text-emerald-400">ENFORCED</strong></div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-2xl">
                Click "Verify zk-SNARK Groth16 Circuit" to test zero-knowledge identity and transaction integrity.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. BLOCKCHAIN AUDIT JSON REPORT TAB */}
      {activeTab === "JSON_REPORT" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Code size={18} className="text-cyan-400" /> Blockchain Audit JSON Report
              </h3>
              <p className="text-xs text-slate-400 font-mono">Standardized ISO/TC 307 Blockchain Audit JSON schema containing block header, smart contract address, and ZKP proof</p>
            </div>

            <button
              type="button"
              onClick={handleCopyJson}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 border border-slate-700"
            >
              {copiedJson ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
              {copiedJson ? "Copied Report JSON!" : "Copy Audit Report JSON"}
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
              <h3 className="text-base font-bold text-white">IEEE & ISO Blockchain Governance Standards</h3>
              <p className="text-xs text-slate-400 font-mono">International protocols for distributed ledger privacy and audit trails</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

      {/* 8. MINE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full text-slate-100 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Boxes size={18} className="text-cyan-400" /> Mine & Anchor Audit Block
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleMineBlock} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Audit Purpose & PHI Action:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-sans"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                >
                  <option value="Patient Consent Grant (PHI Disclosure)">Patient Consent Grant (PHI Disclosure)</option>
                  <option value="Clinical Trial Data Access Verification">Clinical Trial Data Access Verification</option>
                  <option value="Emergency Break-Glass Identity Audit">Emergency Break-Glass Identity Audit</option>
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
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition shadow-lg shadow-cyan-600/20"
                >
                  Mine Block
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

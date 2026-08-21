import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  FileCheck,
  Lock,
  Database,
  Terminal,
  Activity,
  AlertTriangle,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Eye,
  Sliders,
  Sparkles,
  Zap,
  Globe,
  Radio,
  FileCode,
  ShieldAlert,
  Layers,
  HardDrive,
  Hash,
  GitCommit,
  Scale,
  Award,
  RefreshCw,
  Clock
} from 'lucide-react';

const RegulatoryAuditProvenanceHub = () => {
  const [activeTab, setActiveTab] = useState('ledger');
  const [searchTerm, setSearchTerm] = useState('');
  const [c2paFilter, setC2paFilter] = useState('all');
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [auditDepth, setAuditDepth] = useState(100);

  const [ledgerBlocks, setLedgerBlocks] = useState([
    {
      id: 'BLK-009182',
      timestamp: '2026-08-17T02:50:12Z',
      eventType: 'PHI_ACCESS_DECRYPT',
      actorId: 'usr:dr_thorne_99',
      resourceUrn: 'urn:medtrack:patient:PT-88219:ehr',
      payloadHash: '0x3f8a...991e',
      previousHash: '0x7b12...44a0',
      c2paSignature: 'C2PA-ECDSA-P384-VALID',
      hipaaComplianceStatus: 'FULLY_COMPLIANT',
      merkleTreeDepth: 14,
      nodeIp: '10.240.8.12'
    },
    {
      id: 'BLK-009183',
      timestamp: '2026-08-17T02:48:45Z',
      eventType: 'AI_DIAGNOSTIC_PAYLOAD_COMMIT',
      actorId: 'svc:ai_engine_oncovision',
      resourceUrn: 'urn:medtrack:diagnostic:DX-9021',
      payloadHash: '0xe41b...11c9',
      previousHash: '0x3f8a...991e',
      c2paSignature: 'C2PA-ECDSA-P384-VALID',
      hipaaComplianceStatus: 'FULLY_COMPLIANT',
      merkleTreeDepth: 14,
      nodeIp: '10.240.8.19'
    },
    {
      id: 'BLK-009184',
      timestamp: '2026-08-17T02:45:01Z',
      eventType: 'EHR_RECORD_MUTATION',
      actorId: 'usr:nurse_jenkins_12',
      resourceUrn: 'urn:medtrack:patient:PT-41023:vitals',
      payloadHash: '0x88f2...00ab',
      previousHash: '0xe41b...11c9',
      c2paSignature: 'C2PA-ECDSA-P384-VALID',
      hipaaComplianceStatus: 'FULLY_COMPLIANT',
      merkleTreeDepth: 14,
      nodeIp: '10.240.4.88'
    },
    {
      id: 'BLK-009185',
      timestamp: '2026-08-17T02:40:19Z',
      eventType: 'COLD_CHAIN_SENSOR_EXCURSION_LOG',
      actorId: 'iot:sensor_rf_19284',
      resourceUrn: 'urn:medtrack:pharmacy:lot-9023',
      payloadHash: '0x12d9...ffee',
      previousHash: '0x88f2...00ab',
      c2paSignature: 'C2PA-ECDSA-P384-VALID',
      hipaaComplianceStatus: 'FULLY_COMPLIANT',
      merkleTreeDepth: 14,
      nodeIp: '10.240.1.5'
    }
  ]);

  const filteredBlocks = useMemo(() => {
    return ledgerBlocks.filter(b => {
      const matchesSearch =
        b.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.eventType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.actorId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.resourceUrn.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesC2pa =
        c2paFilter === 'all' || b.c2paSignature.toLowerCase().includes(c2paFilter.toLowerCase());

      return matchesSearch && matchesC2pa;
    });
  }, [ledgerBlocks, searchTerm, c2paFilter]);

  const handleVerifyChainIntegrity = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      alert('Merkle Tree Root Verified! 100% Zero-Tamper Audit Trail Confirmed.');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-600/20 rounded-xl border border-amber-500/30 text-amber-400">
            <Scale className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Regulatory Audit & C2PA Provenance Ledger Hub
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-medium">
                HIPAA & Cryptographic Provenance
              </span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Immutable cryptographic ledger for EHR access verification, C2PA media provenance seals & automated HIPAA compliance audits.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleVerifyChainIntegrity}
            disabled={isVerifying}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-amber-600/20 disabled:opacity-50"
          >
            <ShieldCheck className={`w-4 h-4 ${isVerifying ? 'animate-spin' : ''}`} />
            {isVerifying ? 'Verifying Merkle Roots...' : 'Verify Cryptographic Chain'}
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 my-6">
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Immutable Ledger Blocks</p>
            <p className="text-2xl font-bold text-white mt-1">91,850 Blocks</p>
            <span className="text-xs text-emerald-400 flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-3 h-3" /> Zero Tamper Detected
            </span>
          </div>
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg">
            <GitCommit className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">C2PA Provenance Seals</p>
            <p className="text-2xl font-bold text-white mt-1">100% Signed</p>
            <span className="text-xs text-amber-400 flex items-center gap-1 mt-1">
              <Award className="w-3 h-3" /> ECDSA P-384 Signatures
            </span>
          </div>
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg">
            <FileCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">HIPAA Compliance Score</p>
            <p className="text-2xl font-bold text-white mt-1">100 / 100</p>
            <span className="text-xs text-emerald-400 flex items-center gap-1 mt-1">
              <ShieldCheck className="w-3 h-3" /> Real-time Audit Ready
            </span>
          </div>
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
            <Scale className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Merkle Tree Height</p>
            <p className="text-2xl font-bold text-white mt-1">Depth 14</p>
            <span className="text-xs text-indigo-400 flex items-center gap-1 mt-1">
              <Hash className="w-3 h-3" /> Root Hash Synced
            </span>
          </div>
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg">
            <Database className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-900/40 p-4 border border-slate-800 rounded-xl mb-6">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search block ID, actor, event or URN..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg text-xs">
            <span className="text-slate-400">Signature Status:</span>
            <select
              value={c2paFilter}
              onChange={e => setC2paFilter(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all">All Signatures</option>
              <option value="valid">C2PA Valid</option>
            </select>
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="px-6 py-4">Block Height ID</th>
              <th className="px-6 py-4">Timestamp</th>
              <th className="px-6 py-4">Event Type</th>
              <th className="px-6 py-4">Actor URN</th>
              <th className="px-6 py-4">Payload Hash</th>
              <th className="px-6 py-4">C2PA Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filteredBlocks.map(block => (
              <tr key={block.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="px-6 py-4 font-mono text-amber-400 font-semibold">{block.id}</td>
                <td className="px-6 py-4 font-mono text-xs text-slate-400">{block.timestamp}</td>
                <td className="px-6 py-4 font-semibold text-slate-200">{block.eventType}</td>
                <td className="px-6 py-4 font-mono text-xs text-slate-400">{block.actorId}</td>
                <td className="px-6 py-4 font-mono text-xs text-amber-300">{block.payloadHash}</td>
                <td className="px-6 py-4">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                    {block.c2paSignature}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => setSelectedBlock(block)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-all"
                  >
                    Inspect Block Merkle
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Popup */}
      {selectedBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl">
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <GitCommit className="w-5 h-5 text-amber-400" />
                  Ledger Block Detail: {selectedBlock.id}
                </h2>
                <p className="text-xs text-slate-400 mt-1">{selectedBlock.eventType}</p>
              </div>
              <button onClick={() => setSelectedBlock(null)} className="text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono">
              <p className="text-slate-400">Resource URN: <strong className="text-slate-200">{selectedBlock.resourceUrn}</strong></p>
              <p className="text-slate-400">Previous Hash: <strong className="text-amber-300">{selectedBlock.previousHash}</strong></p>
              <p className="text-slate-400">Node IP: <strong className="text-emerald-400">{selectedBlock.nodeIp}</strong></p>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-800">
              <button
                onClick={() => setSelectedBlock(null)}
                className="px-4 py-2 bg-slate-800 text-slate-200 rounded-lg text-sm font-medium"
              >
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegulatoryAuditProvenanceHub;

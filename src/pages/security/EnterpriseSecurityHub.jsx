import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  Lock,
  Key,
  Cpu,
  Database,
  Terminal,
  Activity,
  AlertTriangle,
  Server,
  RefreshCw,
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
  HardDrive
} from 'lucide-react';

const EnterpriseSecurityHub = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [enclaveFilter, setEnclaveFilter] = useState('all');
  const [selectedKey, setSelectedKey] = useState(null);
  const [isRotating, setIsRotating] = useState(false);
  const [kmsSpeed, setKmsSpeed] = useState(1);
  const [zeroTrustPolicyLevel, setZeroTrustPolicyLevel] = useState(95);

  const [enclaves, setEnclaves] = useState([
    {
      id: 'ENC-8091',
      name: 'EHR PHI Encryption Enclave 01',
      algorithm: 'Kyber-1024 / Dilithium-5',
      status: 'ACTIVE_HEALTHY',
      keysActive: 12,
      lastRotation: '2 hours ago',
      kmsHost: 'kms-us-east-1.medtrack.internal',
      threatScore: 0.02,
      quantumCompliance: '100% Post-Quantum Certified',
      ctemAlerts: 0
    },
    {
      id: 'ENC-8092',
      name: 'ICU Telemetry Stream KMS Vault',
      algorithm: 'Falcon-1024 Quantum Shield',
      status: 'ACTIVE_HEALTHY',
      keysActive: 48,
      lastRotation: '12 mins ago',
      kmsHost: 'kms-us-west-2.medtrack.internal',
      threatScore: 0.05,
      quantumCompliance: '100% Post-Quantum Certified',
      ctemAlerts: 0
    },
    {
      id: 'ENC-8093',
      name: 'Biomedical AI Neural Weights Vault',
      algorithm: 'SPHINCS+ / AES-256-GCM',
      status: 'ROTATION_QUEUED',
      keysActive: 8,
      lastRotation: '28 days ago',
      kmsHost: 'kms-eu-central-1.medtrack.internal',
      threatScore: 0.18,
      quantumCompliance: 'Pending Rotation',
      ctemAlerts: 1
    },
    {
      id: 'ENC-8094',
      name: 'Clinical Trial Genomic Anonymizer',
      algorithm: 'Kyber-768 Lattice Cipher',
      status: 'ACTIVE_HEALTHY',
      keysActive: 16,
      lastRotation: '1 day ago',
      kmsHost: 'kms-ap-southeast-1.medtrack.internal',
      threatScore: 0.01,
      quantumCompliance: '100% Post-Quantum Certified',
      ctemAlerts: 0
    },
    {
      id: 'ENC-8095',
      name: 'SIEM Log Audit Enclave',
      algorithm: 'Dilithium-3 Digital Signature',
      status: 'ACTIVE_HEALTHY',
      keysActive: 24,
      lastRotation: '4 hours ago',
      kmsHost: 'kms-sa-east-1.medtrack.internal',
      threatScore: 0.03,
      quantumCompliance: '100% Post-Quantum Certified',
      ctemAlerts: 0
    }
  ]);

  const [kmsAuditLogs, setKmsAuditLogs] = useState([
    {
      id: 'LOG-9901',
      timestamp: '2026-08-17T02:45:10Z',
      action: 'KEY_ROTATION_SUCCESS',
      enclaveId: 'ENC-8092',
      actor: 'system.kms.auto-rotator',
      ip: '10.240.12.89',
      details: 'Rotated 48 session keys using Kyber-1024 lattice parameters.'
    },
    {
      id: 'LOG-9902',
      timestamp: '2026-08-17T02:40:02Z',
      action: 'ZERO_TRUST_ATTESTATION',
      enclaveId: 'ENC-8091',
      actor: 'security.agent.v4',
      ip: '10.240.14.102',
      details: 'Hardware TPM 2.0 enclave integrity verified with 0 drift.'
    },
    {
      id: 'LOG-9903',
      timestamp: '2026-08-17T02:35:44Z',
      action: 'CTEM_VULN_SCAN',
      enclaveId: 'ENC-8093',
      actor: 'ctem.continuous-scanner',
      ip: '10.240.0.5',
      details: 'Flagged 1 key pair nearing 30-day rotation boundary.'
    }
  ]);

  const filteredEnclaves = useMemo(() => {
    return enclaves.filter(e => {
      const matchesSearch =
        e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.algorithm.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFilter =
        enclaveFilter === 'all' || e.status.toLowerCase().includes(enclaveFilter.toLowerCase());

      return matchesSearch && matchesFilter;
    });
  }, [enclaves, searchTerm, enclaveFilter]);

  const handleRotateAllKeys = () => {
    setIsRotating(true);
    setTimeout(() => {
      setEnclaves(prev =>
        prev.map(enc => ({
          ...enc,
          lastRotation: 'Just now',
          status: 'ACTIVE_HEALTHY',
          ctemAlerts: 0,
          quantumCompliance: '100% Post-Quantum Certified'
        }))
      );
      setIsRotating(false);
    }, 1800);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-600/20 rounded-xl border border-cyan-500/30 text-cyan-400">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Enterprise Security & Post-Quantum KMS Subsystem
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-medium">
                Zero-Trust Enclaves
              </span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Post-Quantum Cryptography (Kyber-1024/Dilithium), CTEM continuous threat exposure management & hardware enclave orchestration.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRotateAllKeys}
            disabled={isRotating}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-cyan-600/20 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRotating ? 'animate-spin' : ''}`} />
            {isRotating ? 'Executing Post-Quantum Rotation...' : 'Rotate All Enclave Keys'}
          </button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 my-6">
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Active Enclave Vaults</p>
            <p className="text-2xl font-bold text-white mt-1">5 Enclaves</p>
            <span className="text-xs text-emerald-400 flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-3 h-3" /> Hardware Attested
            </span>
          </div>
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg">
            <Server className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Active Key Pairs</p>
            <p className="text-2xl font-bold text-white mt-1">108 Keys</p>
            <span className="text-xs text-cyan-400 flex items-center gap-1 mt-1">
              <Lock className="w-3 h-3" /> Kyber-1024 / Dilithium-5
            </span>
          </div>
          <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-lg">
            <Key className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Zero-Trust Posture Score</p>
            <p className="text-2xl font-bold text-white mt-1">99.8 / 100</p>
            <span className="text-xs text-emerald-400 flex items-center gap-1 mt-1">
              <Sparkles className="w-3 h-3" /> Optimal Security Boundary
            </span>
          </div>
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">CTEM Vulnerability Pings</p>
            <p className="text-2xl font-bold text-white mt-1">0 Critical</p>
            <span className="text-xs text-amber-400 flex items-center gap-1 mt-1">
              <AlertTriangle className="w-3 h-3" /> 1 Minor Rotation Warning
            </span>
          </div>
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-6 mb-6">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 text-sm font-medium transition-all relative flex items-center gap-2 ${
            activeTab === 'overview'
              ? 'text-cyan-400 border-b-2 border-cyan-500'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Server className="w-4 h-4" />
          Hardware Enclaves & KMS
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 text-sm font-medium transition-all relative flex items-center gap-2 ${
            activeTab === 'audit'
              ? 'text-cyan-400 border-b-2 border-cyan-500'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Terminal className="w-4 h-4" />
          Post-Quantum SIEM Audit Log
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-900/40 p-4 border border-slate-800 rounded-xl">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="Search enclave ID, name or algorithm..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg text-xs">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-400">Enclave Status:</span>
                <select
                  value={enclaveFilter}
                  onChange={e => setEnclaveFilter(e.target.value)}
                  className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="all">All Enclaves</option>
                  <option value="active">Active Healthy</option>
                  <option value="rotation">Rotation Queued</option>
                </select>
              </div>
            </div>
          </div>

          {/* Enclaves Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEnclaves.map(enc => (
              <div
                key={enc.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 space-y-4 transition-all shadow-lg"
              >
                <div className="flex justify-between items-start">
                  <span className="font-mono text-xs text-cyan-400 bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-800">
                    {enc.id}
                  </span>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                      enc.status === 'ACTIVE_HEALTHY'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                    }`}
                  >
                    {enc.status}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-white text-base leading-snug">{enc.name}</h3>
                  <p className="text-xs text-slate-400 mt-1 font-mono">{enc.kmsHost}</p>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Algorithm Mesh:</span>
                    <span className="text-cyan-300 font-semibold">{enc.algorithm}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Active Session Keys:</span>
                    <span className="text-slate-200 font-mono">{enc.keysActive} Key Pairs</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Last Key Rotation:</span>
                    <span className="text-slate-300">{enc.lastRotation}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Quantum Assurance:</span>
                    <span className="text-emerald-400 font-medium">{enc.quantumCompliance}</span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedKey(enc)}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-all border border-slate-700"
                >
                  Inspect Hardware Attestation
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Log ID</th>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Action Event</th>
                <th className="px-6 py-4">Enclave Vault</th>
                <th className="px-6 py-4">Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {kmsAuditLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-6 py-4 font-mono text-cyan-400 text-xs">{log.id}</td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-400">{log.timestamp}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-slate-300 text-xs">{log.enclaveId}</td>
                  <td className="px-6 py-4 text-xs text-slate-300">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Popup */}
      {selectedKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl">
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-cyan-400" />
                  Hardware Attestation: {selectedKey.id}
                </h2>
                <p className="text-xs text-slate-400 mt-1">{selectedKey.name}</p>
              </div>
              <button onClick={() => setSelectedKey(null)} className="text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs bg-slate-950 p-4 rounded-xl border border-slate-800">
              <p className="text-slate-400">Quantum Cipher: <strong className="text-cyan-300">{selectedKey.algorithm}</strong></p>
              <p className="text-slate-400">KMS Host URI: <strong className="text-slate-200">{selectedKey.kmsHost}</strong></p>
              <p className="text-slate-400">Hardware TPM Signature: <strong className="text-emerald-400">VALIDATED (0 Drift)</strong></p>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-800">
              <button
                onClick={() => setSelectedKey(null)}
                className="px-4 py-2 bg-slate-800 text-slate-200 rounded-lg text-sm font-medium"
              >
                Close Attestation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnterpriseSecurityHub;

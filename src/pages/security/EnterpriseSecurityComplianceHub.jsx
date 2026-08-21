import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
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
  Layers,
  HardDrive,
  Network,
  Wifi,
  Fingerprint,
  ScanLine,
  Bug,
  Play,
  Pause,
  RotateCcw,
  Download,
  ChevronRight,
  Clock,
  BarChart3,
  Target,
  Crosshair,
  Bell,
  Settings,
  Users,
  ArrowUpRight,
  Brain,
  Binary,
  FileWarning,
  Shield,
  ZapOff
} from 'lucide-react';

const EnterpriseSecurityComplianceHub = () => {
  const [activeTab, setActiveTab] = useState('zero_trust');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);
  const [simRunning, setSimRunning] = useState(false);
  const [simSpeed, setSimSpeed] = useState(1);
  const [simTick, setSimTick] = useState(0);
  const [toasts, setToasts] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [policiesExpanded, setPoliciesExpanded] = useState({});
  const simRef = useRef(null);
  const toastId = useRef(0);

  // ──────────────────── Zero-Trust Policies ────────────────────
  const [zeroTrustPolicies, setZeroTrustPolicies] = useState([
    {
      id: 'ZT-POL-001',
      name: 'EHR PHI Access Gateway',
      scope: 'Production EHR Cluster',
      status: 'ENFORCING',
      riskLevel: 'CRITICAL',
      lastVerified: '12 seconds ago',
      mfaRequired: true,
      deviceAttest: true,
      networkMicroseg: true,
      sessionsBlocked: 3,
      sessionsAllowed: 847,
      policyEngine: 'OpenPolicyAgent v1.4',
      encryption: 'mTLS 1.3 + JWT Claims',
      lastViolation: '2026-08-18T22:14:03Z',
      violationDetail: 'Unhandled device fingerprint from 10.240.3.112'
    },
    {
      id: 'ZT-POL-002',
      name: 'Clinical AI Model API Boundary',
      scope: 'Biomedical Inference Mesh',
      status: 'ENFORCING',
      riskLevel: 'HIGH',
      lastVerified: '8 seconds ago',
      mfaRequired: true,
      deviceAttest: true,
      networkMicroseg: true,
      sessionsBlocked: 1,
      sessionsAllowed: 2340,
      policyEngine: 'Cedar Policy Engine v2.5',
      encryption: 'SPIFFE/SPIRE + mTLS',
      lastViolation: '2026-08-19T01:02:11Z',
      violationDetail: 'Rate-limit exceeded on /v2/inference/batch endpoint'
    },
    {
      id: 'ZT-POL-003',
      name: 'ICU Telemetry Sensor Auth',
      scope: 'Real-Time Bedside IoT',
      status: 'ENFORCING',
      riskLevel: 'MEDIUM',
      lastVerified: '4 seconds ago',
      mfaRequired: false,
      deviceAttest: true,
      networkMicroseg: true,
      sessionsBlocked: 0,
      sessionsAllowed: 15620,
      policyEngine: 'OpenPolicyAgent v1.4',
      encryption: 'DTLS 1.3 + X.509 Certs',
      lastViolation: null,
      violationDetail: 'No violations in observation window'
    },
    {
      id: 'ZT-POL-004',
      name: 'Pharmaceutical Supply Chain Vault',
      scope: 'Cold-Chain Order Gateway',
      status: 'ENFORCING',
      riskLevel: 'HIGH',
      lastVerified: '21 seconds ago',
      mfaRequired: true,
      deviceAttest: true,
      networkMicroseg: true,
      sessionsBlocked: 5,
      sessionsAllowed: 612,
      policyEngine: 'Cedar Policy Engine v2.5',
      encryption: 'mTLS 1.3 + API Key Rotation',
      lastViolation: '2026-08-19T03:45:19Z',
      violationDetail: 'Untrusted supplier origin IP detected on batch order'
    },
    {
      id: 'ZT-POL-005',
      name: 'Genomic Data Repository Access',
      scope: 'Precision Medicine Vault',
      status: 'ENFORCING',
      riskLevel: 'CRITICAL',
      lastVerified: '6 seconds ago',
      mfaRequired: true,
      deviceAttest: true,
      networkMicroseg: true,
      sessionsBlocked: 2,
      sessionsAllowed: 89,
      policyEngine: 'OpenPolicyAgent v1.4',
      encryption: 'Kyber-768 + Attribute-Based Encryption',
      lastViolation: '2026-08-18T19:33:07Z',
      violationDetail: 'Unverified researcher role assertion on cohort query'
    }
  ]);

  // ──────────────────── Post-Quantum KMS Vault ────────────────────
  const [kmsKeys, setKmsKeys] = useState([
    {
      id: 'KMS-KY-001',
      algorithm: 'Kyber-1024',
      purpose: 'EHR PHI Transport Encryption',
      status: 'ACTIVE',
      strength: 'Post-Quantum Lattice',
      lastRotation: '6 hours ago',
      nextRotation: '18 hours',
      hostCluster: 'kms-us-east-1.medtrack.internal',
      encryptionsHandled: 1240000,
      quantumReady: true,
      drift: 0.0,
      tpmAttestation: 'VALIDATED'
    },
    {
      id: 'KMS-DL-002',
      algorithm: 'Dilithium-5',
      purpose: 'Clinical AI Model Signing',
      status: 'ACTIVE',
      strength: 'Post-Quantum Digital Signature',
      lastRotation: '2 hours ago',
      nextRotation: '22 hours',
      hostCluster: 'kms-eu-west-1.medtrack.internal',
      encryptionsHandled: 890000,
      quantumReady: true,
      drift: 0.0,
      tpmAttestation: 'VALIDATED'
    },
    {
      id: 'KMS-FC-003',
      algorithm: 'Falcon-1024',
      purpose: 'ICU Telemetry Stream Authentication',
      status: 'ACTIVE',
      strength: 'Post-Quantum Hash-Based Signature',
      lastRotation: '45 minutes ago',
      nextRotation: '23 hours',
      hostCluster: 'kms-ap-northeast-1.medtrack.internal',
      encryptionsHandled: 4500000,
      quantumReady: true,
      drift: 0.0,
      tpmAttestation: 'VALIDATED'
    },
    {
      id: 'KMS-SP-004',
      algorithm: 'SPHINCS+',
      purpose: 'Regulatory Audit Log Signing',
      status: 'ROTATION_QUEUED',
      strength: 'Post-Quantum Stateless Signature',
      lastRotation: '29 days ago',
      nextRotation: 'NOW',
      hostCluster: 'kms-sa-east-1.medtrack.internal',
      encryptionsHandled: 670000,
      quantumReady: false,
      drift: 0.8,
      tpmAttestation: 'PENDING_REATTEST'
    },
    {
      id: 'KMS-AES-005',
      algorithm: 'AES-256-GCM + Kyber Wrap',
      purpose: 'Genomic Data-at-Rest Encryption',
      status: 'ACTIVE',
      strength: 'Hybrid Post-Quantum + Classical',
      lastRotation: '1 day ago',
      nextRotation: '7 days',
      hostCluster: 'kms-us-west-2.medtrack.internal',
      encryptionsHandled: 340000,
      quantumReady: true,
      drift: 0.0,
      tpmAttestation: 'VALIDATED'
    }
  ]);

  // ──────────────────── Hardware Enclaves ────────────────────
  const [enclaves, setEnclaves] = useState([
    {
      id: 'ENC-SGX-001',
      name: 'EHR PHI Processing Enclave',
      type: 'Intel SGX 3.0',
      status: 'ACTIVE_HEALTHY',
      region: 'us-east-1',
      memoryGb: 256,
      attestStatus: 'COLLATERAL_VERIFIED',
      workload: 'PHI De-identification Pipeline',
      lastBoot: '14 days ago',
      cpuUtilization: 67,
      sealIntegrity: 100.0
    },
    {
      id: 'ENC-SGX-002',
      name: 'Biomedical AI Inference Vault',
      type: 'AMD SEV-SNP',
      status: 'ACTIVE_HEALTHY',
      region: 'eu-west-1',
      memoryGb: 512,
      attestStatus: 'COLLATERAL_VERIFIED',
      workload: 'Neural Weight Secure Inference',
      lastBoot: '7 days ago',
      cpuUtilization: 82,
      sealIntegrity: 100.0
    },
    {
      id: 'ENC-TDX-001',
      name: 'Clinical Trial Cohort Vault',
      type: 'Intel TDX',
      status: 'MAINTENANCE',
      region: 'ap-southeast-1',
      memoryGb: 1024,
      attestStatus: 'RE_ATTESTATION_QUEUED',
      workload: 'Genomic Cohort Sandbox',
      lastBoot: '45 days ago',
      cpuUtilization: 12,
      sealIntegrity: 99.7
    }
  ]);

  // ──────────────────── CTEM Attack Surface ────────────────────
  const [ctemAssets, setCtemAssets] = useState([
    {
      id: 'CTEM-AS-001',
      asset: 'EHR API Gateway Cluster',
      exposure: 'INTERNAL',
      cveCount: 0,
      riskScore: 2,
      lastScan: '18 minutes ago',
      attackVectors: ['mTLS', 'JWT Validation', 'Rate Limiting'],
      status: 'REMEDIATED',
      remediatedBy: 'automated-patch-engine',
      patchLatency: '4 minutes'
    },
    {
      id: 'CTEM-AS-002',
      asset: 'Clinical AI Model Serving Mesh',
      exposure: 'INTERNAL',
      cveCount: 1,
      riskScore: 14,
      lastScan: '8 minutes ago',
      attackVectors: ['Model Poisoning', 'Adversarial Input', 'Data Exfiltration'],
      status: 'MONITORING',
      remediatedBy: 'N/A — behavioral baseline',
      patchLatency: 'N/A'
    },
    {
      id: 'CTEM-AS-003',
      asset: 'IoT Telemetry Collector Fleet',
      exposure: 'EDGE',
      cveCount: 0,
      riskScore: 5,
      lastScan: '2 minutes ago',
      attackVectors: ['DTLS Spoofing', 'Firmware Tampering', 'Physical Tamper'],
      status: 'REMEDIATED',
      remediatedBy: 'auto-firmware-signing',
      patchLatency: '12 minutes'
    },
    {
      id: 'CTEM-AS-004',
      asset: 'Pharmaceutical Supply Chain Portal',
      exposure: 'EXTERNAL',
      cveCount: 2,
      riskScore: 22,
      lastScan: '35 minutes ago',
      attackVectors: ['CSRF', 'Supply Chain Injection', 'API Key Leak'],
      status: 'TRIAGE',
      remediatedBy: 'security-team-manual',
      patchLatency: 'Pending review'
    },
    {
      id: 'CTEM-AS-005',
      asset: 'Telehealth WebRTC Edge Proxy',
      exposure: 'EXTERNAL',
      cveCount: 0,
      riskScore: 3,
      lastScan: '5 minutes ago',
      attackVectors: ['DTLS Bypass', 'Media Stream Intercept', 'Signaling Hijack'],
      status: 'REMEDIATED',
      remediatedBy: 'automated-config-hardening',
      patchLatency: '2 minutes'
    }
  ]);

  // ──────────────────── SIEM Events ────────────────────
  const [siemEvents, setSiemEvents] = useState([
    {
      id: 'SIEM-EVT-001',
      timestamp: '2026-08-19T07:12:03Z',
      severity: 'CRITICAL',
      source: 'Zero-Trust Policy Engine',
      category: 'Access Violation',
      message: 'Unhandled device attestation failure on EHR PHI gateway',
      sourceIp: '10.240.3.112',
      action: 'SESSION_KILLED',
      analyst: null,
      mitre: 'T1078 — Valid Accounts'
    },
    {
      id: 'SIEM-EVT-002',
      timestamp: '2026-08-19T07:08:44Z',
      severity: 'HIGH',
      source: 'Post-Quantum KMS',
      category: 'Key Lifecycle',
      message: 'SPHINCS+ audit log signing key exceeded 30-day rotation boundary',
      sourceIp: 'kms-sa-east-1.medtrack.internal',
      action: 'ROTATION_QUEUED',
      analyst: null,
      mitre: 'N/A — Compliance Drift'
    },
    {
      id: 'SIEM-EVT-003',
      timestamp: '2026-08-19T06:55:11Z',
      severity: 'MEDIUM',
      source: 'CTEM Continuous Scanner',
      category: 'Exposure Detection',
      message: '2 CVEs detected on Pharmaceutical Supply Chain Portal (OWASP Top 10)',
      sourceIp: 'scan-engine-02.medtrack.internal',
      action: 'TRIAGE_OPENED',
      analyst: null,
      mitre: 'T1190 — Exploit Public-Facing Application'
    },
    {
      id: 'SIEM-EVT-004',
      timestamp: '2026-08-19T06:42:19Z',
      severity: 'HIGH',
      source: 'Enclave Attestation Service',
      category: 'Integrity Breach',
      message: 'Clinical Trial Cohort Vault — re-attestation required after 45-day drift',
      sourceIp: 'enc-tdx-ap-se1.medtrack.internal',
      action: 'WORKLOAD_SUSPENDED',
      analyst: null,
      mitre: 'T1610 — Deploy Container'
    },
    {
      id: 'SIEM-EVT-005',
      timestamp: '2026-08-19T06:30:02Z',
      severity: 'LOW',
      source: 'SIEM Aggregator',
      category: 'Audit',
      message: 'All 5 Zero-Trust policies enforced successfully — 19,468 sessions authorized',
      sourceIp: 'siem-hub.medtrack.internal',
      action: 'LOGGED',
      analyst: null,
      mitre: 'N/A — Operational Health'
    }
  ]);

  // ──────────────────── Simulation ────────────────────
  useEffect(() => {
    if (simRunning) {
      simRef.current = setInterval(() => {
        setSimTick(t => t + 1);
        const rand = Math.random();
        if (rand > 0.85) {
          const severities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
          const sources = ['Zero-Trust Policy Engine', 'Post-Quantum KMS', 'CTEM Scanner', 'Enclave Attestation', 'SIEM Aggregator'];
          const categories = ['Access Violation', 'Key Lifecycle', 'Exposure Detection', 'Integrity Breach', 'Anomaly Detected'];
          const messages = [
            'Unauthorized lateral movement attempt detected on microsegment boundary',
            'Kyber-1024 key pair nearing max encryptions — rotation recommended',
            'New attack surface entry discovered on API edge proxy',
            'Enclave seal integrity dropped below threshold — re-attestation queued',
            'Behavioral anomaly flagged on Clinical AI inference endpoint'
          ];
          const newEvent = {
            id: `SIEM-EVT-${String(siemEvents.length + 1).padStart(3, '0')}`,
            timestamp: new Date().toISOString(),
            severity: severities[Math.floor(Math.random() * severities.length)],
            source: sources[Math.floor(Math.random() * sources.length)],
            category: categories[Math.floor(Math.random() * categories.length)],
            message: messages[Math.floor(Math.random() * messages.length)],
            sourceIp: `10.240.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
            action: 'LOGGED',
            analyst: null,
            mitre: 'Automated Detection'
          };
          setSiemEvents(prev => [newEvent, ...prev].slice(0, 50));
          addToast(`${newEvent.severity}: ${newEvent.category}`, newEvent.severity);
        }
      }, 2000 / simSpeed);
    }
    return () => clearInterval(simRef.current);
  }, [simRunning, simSpeed, siemEvents.length]);

  const addToast = useCallback((message, severity = 'INFO') => {
    const id = ++toastId.current;
    setToasts(prev => [...prev, { id, message, severity }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  // ──────────────────── Filtering ────────────────────
  const filteredZeroTrust = useMemo(() => {
    return zeroTrustPolicies.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.scope.toLowerCase().includes(searchTerm.toLowerCase());
      const matchFilter = statusFilter === 'all' || p.riskLevel.toLowerCase() === statusFilter.toLowerCase();
      return matchSearch && matchFilter;
    });
  }, [zeroTrustPolicies, searchTerm, statusFilter]);

  const filteredKmsKeys = useMemo(() => {
    return kmsKeys.filter(k => {
      const matchSearch = k.algorithm.toLowerCase().includes(searchTerm.toLowerCase()) ||
        k.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        k.purpose.toLowerCase().includes(searchTerm.toLowerCase());
      const matchFilter = statusFilter === 'all' || k.status.toLowerCase() === statusFilter.toLowerCase();
      return matchSearch && matchFilter;
    });
  }, [kmsKeys, searchTerm, statusFilter]);

  const filteredEnclaves = useMemo(() => {
    return enclaves.filter(e => {
      const matchSearch = e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.type.toLowerCase().includes(searchTerm.toLowerCase());
      const matchFilter = statusFilter === 'all' || e.status.toLowerCase().includes(statusFilter.toLowerCase());
      return matchSearch && matchFilter;
    });
  }, [enclaves, searchTerm, statusFilter]);

  const filteredCtemAssets = useMemo(() => {
    return ctemAssets.filter(a => {
      const matchSearch = a.asset.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchFilter = statusFilter === 'all' || a.status.toLowerCase() === statusFilter.toLowerCase();
      return matchSearch && matchFilter;
    });
  }, [ctemAssets, searchTerm, statusFilter]);

  const filteredSiemEvents = useMemo(() => {
    return siemEvents.filter(e => {
      const matchSearch = e.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchFilter = statusFilter === 'all' || e.severity.toLowerCase() === statusFilter.toLowerCase();
      return matchSearch && matchFilter;
    });
  }, [siemEvents, searchTerm, statusFilter]);

  // ──────────────────── CSV Export ────────────────────
  const exportCSV = (data, filename) => {
    if (!data.length) return;
    const headers = Object.keys(data[0]);
    const rows = data.map(row => headers.map(h => {
      const val = row[h];
      if (typeof val === 'object') return JSON.stringify(val);
      return String(val ?? '');
    }).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addToast(`Exported ${data.length} records to CSV`, 'INFO');
  };

  // ──────────────────── Handlers ────────────────────
  const openModal = (item, type) => {
    setModalData({ ...item, _type: type });
    setModalOpen(true);
  };

  const simulateBreach = () => {
    addToast('CRITICAL: Simulated zero-trust breach injected on policy ZT-POL-001', 'CRITICAL');
    setSiemEvents(prev => [{
      id: `SIEM-EVT-SIM-${Date.now()}`,
      timestamp: new Date().toISOString(),
      severity: 'CRITICAL',
      source: 'Simulation Sandbox',
      category: 'Simulated Breach',
      message: 'Controlled breach simulation — unauthorized lateral movement across microsegment boundary',
      sourceIp: '10.240.255.1',
      action: 'SESSION_KILLED + POLICY_ENFORCED',
      analyst: 'sandbox-agent',
      mitre: 'T1021 — Remote Services'
    }, ...prev].slice(0, 50));
  };

  const resetSim = () => {
    setSimRunning(false);
    setSimTick(0);
    addToast('Simulation sandbox reset', 'INFO');
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-500/10 border-red-500/30 text-red-400';
      case 'HIGH': return 'bg-orange-500/10 border-orange-500/30 text-orange-400';
      case 'MEDIUM': return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
      case 'LOW': return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
      default: return 'bg-slate-500/10 border-slate-500/30 text-slate-400';
    }
  };

  const getRiskColor = (risk) => {
    if (risk >= 20) return 'text-red-400';
    if (risk >= 10) return 'text-orange-400';
    if (risk >= 5) return 'text-amber-400';
    return 'text-emerald-400';
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ENFORCING': return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
      case 'ACTIVE': case 'ACTIVE_HEALTHY': return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
      case 'REMEDIATED': return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
      case 'ROTATION_QUEUED': case 'MONITORING': case 'TRIAGE': return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
      case 'MAINTENANCE': return 'bg-blue-500/10 border-blue-500/30 text-blue-400';
      default: return 'bg-slate-500/10 border-slate-500/30 text-slate-400';
    }
  };

  const tabs = [
    { key: 'zero_trust', label: 'Zero-Trust Policies', icon: ShieldCheck },
    { key: 'kms', label: 'Post-Quantum KMS', icon: Key },
    { key: 'enclaves', label: 'Hardware Enclaves', icon: Server },
    { key: 'ctem', label: 'CTEM Attack Surface', icon: Crosshair },
    { key: 'siem', label: 'SIEM Event Stream', icon: Activity }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6">
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[100] space-y-2">
        {toasts.map(t => (
          <div key={t.id} className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium shadow-2xl animate-pulse ${getSeverityColor(t.severity)}`}>
            <Bell className="w-4 h-4 shrink-0" />
            {t.message}
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-600/20 rounded-xl border border-cyan-500/30 text-cyan-400">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Enterprise Security & Compliance Hub
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-medium">
                Zero-Trust Enforced
              </span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Unified zero-trust posture, post-quantum KMS, hardware enclaves, CTEM attack surface & SIEM event stream.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => exportCSV(activeTab === 'siem' ? filteredSiemEvents : activeTab === 'ctem' ? filteredCtemAssets : activeTab === 'kms' ? filteredKmsKeys : activeTab === 'enclaves' ? filteredEnclaves : filteredZeroTrust, `sec-compliance-${activeTab}`)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium transition-all border border-slate-700"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={simulateBreach}
            className="flex items-center gap-2 px-4 py-2 bg-red-600/80 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-red-600/20"
          >
            <ZapOff className="w-4 h-4" />
            Simulate Breach
          </button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 my-6">
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Zero-Trust Policies</p>
            <p className="text-2xl font-bold text-white mt-1">5 Active</p>
            <span className="text-xs text-emerald-400 flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-3 h-3" /> All Enforcing
            </span>
          </div>
          <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-lg">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">PQ Key Pairs</p>
            <p className="text-2xl font-bold text-white mt-1">5 Active</p>
            <span className="text-xs text-cyan-400 flex items-center gap-1 mt-1">
              <Lock className="w-3 h-3" /> Kyber / Dilithium / Falcon
            </span>
          </div>
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg">
            <Key className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Secure Enclaves</p>
            <p className="text-2xl font-bold text-white mt-1">3 Vaults</p>
            <span className="text-xs text-emerald-400 flex items-center gap-1 mt-1">
              <Server className="w-3 h-3" /> Hardware Attested
            </span>
          </div>
          <div className="p-3 bg-violet-500/10 border border-violet-500/20 text-violet-400 rounded-lg">
            <HardDrive className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">CTEM Assets</p>
            <p className="text-2xl font-bold text-white mt-1">5 Scanned</p>
            <span className="text-xs text-amber-400 flex items-center gap-1 mt-1">
              <Crosshair className="w-3 h-3" /> 2 in Triage / Monitoring
            </span>
          </div>
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg">
            <Crosshair className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">SIEM Events</p>
            <p className="text-2xl font-bold text-white mt-1">{siemEvents.length} Events</p>
            <span className={`text-xs flex items-center gap-1 mt-1 ${simRunning ? 'text-emerald-400' : 'text-slate-500'}`}>
              <Radio className="w-3 h-3" /> {simRunning ? `Live Stream (${simSpeed}x)` : 'Paused'}
            </span>
          </div>
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg">
            <Activity className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Simulation Controls */}
      <div className="flex flex-col md:flex-row items-center gap-4 bg-slate-900/40 p-4 border border-slate-800 rounded-xl mb-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSimRunning(!simRunning)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border ${simRunning ? 'bg-emerald-600/20 border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/30' : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'}`}
          >
            {simRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {simRunning ? 'Pause Simulation' : 'Start Simulation'}
          </button>
          <button onClick={resetSim} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium border border-slate-700">
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="font-medium">Speed:</span>
          {[1, 2, 4].map(s => (
            <button key={s} onClick={() => setSimSpeed(s)} className={`px-3 py-1 rounded border text-xs font-mono ${simSpeed === s ? 'bg-cyan-600/20 border-cyan-500/30 text-cyan-400' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'}`}>
              {s}x
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 ml-auto">
          <Clock className="w-3 h-3" />
          Tick: {simTick} | Events: {siemEvents.length}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-1 mb-6 overflow-x-auto">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setSearchTerm(''); setStatusFilter('all'); }}
              className={`pb-3 px-4 text-sm font-medium transition-all relative flex items-center gap-2 whitespace-nowrap ${activeTab === tab.key ? 'text-cyan-400 border-b-2 border-cyan-500' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-900/40 p-4 border border-slate-800 rounded-xl mb-6">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder={`Search ${tabs.find(t => t.key === activeTab)?.label}...`}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Status:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all">All</option>
              {activeTab === 'zero_trust' && <><option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option></>}
              {activeTab === 'kms' && <><option value="active">Active</option><option value="rotation_queued">Rotation Queued</option></>}
              {activeTab === 'enclaves' && <><option value="active">Active</option><option value="maintenance">Maintenance</option></>}
              {activeTab === 'ctem' && <><option value="remediated">Remediated</option><option value="monitoring">Monitoring</option><option value="triage">Triage</option></>}
              {activeTab === 'siem' && <><option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></>}
            </select>
          </div>
        </div>
      </div>

      {/* ═══════════════ TAB: Zero-Trust Policies ═══════════════ */}
      {activeTab === 'zero_trust' && (
        <div className="space-y-4">
          {filteredZeroTrust.map(policy => (
            <div key={policy.id} className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 transition-all shadow-lg">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-xs text-cyan-400 bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-800">{policy.id}</span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${getStatusBadge(policy.status)}`}>{policy.status}</span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${getSeverityColor(policy.riskLevel)}`}>{policy.riskLevel}</span>
                  </div>
                  <h3 className="font-bold text-white text-base">{policy.name}</h3>
                  <p className="text-xs text-slate-400 mt-1">{policy.scope} • {policy.policyEngine}</p>
                </div>
                <div className="flex items-center gap-6 text-xs text-slate-400">
                  <div className="text-center">
                    <p className="text-emerald-400 font-bold text-lg">{policy.sessionsAllowed.toLocaleString()}</p>
                    <p>Allowed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-red-400 font-bold text-lg">{policy.sessionsBlocked}</p>
                    <p>Blocked</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <Fingerprint className="w-3.5 h-3.5 text-cyan-400" />
                  MFA: {policy.mfaRequired ? <span className="text-emerald-400">Required</span> : <span className="text-slate-500">N/A</span>}
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                  Device Attest: {policy.deviceAttest ? <span className="text-emerald-400">Yes</span> : <span className="text-slate-500">No</span>}
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Network className="w-3.5 h-3.5 text-cyan-400" />
                  Microseg: {policy.networkMicroseg ? <span className="text-emerald-400">Active</span> : <span className="text-slate-500">Off</span>}
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Lock className="w-3.5 h-3.5 text-cyan-400" />
                  Encryption: <span className="text-cyan-300">{policy.encryption.split(' ')[0]}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  Verified: <span className="text-slate-200">{policy.lastVerified}</span>
                </div>
              </div>
              <button
                onClick={() => openModal(policy, 'zero_trust')}
                className="mt-4 w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-all border border-slate-700 flex items-center justify-center gap-2"
              >
                <Eye className="w-3.5 h-3.5" />
                Inspect Policy Details
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {filteredZeroTrust.length === 0 && (
            <div className="text-center py-12 text-slate-500 text-sm">No zero-trust policies match your search.</div>
          )}
        </div>
      )}

      {/* ═══════════════ TAB: Post-Quantum KMS ═══════════════ */}
      {activeTab === 'kms' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredKmsKeys.map(key => (
            <div key={key.id} className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 space-y-4 transition-all shadow-lg">
              <div className="flex justify-between items-start">
                <span className="font-mono text-xs text-blue-400 bg-blue-950/50 px-2 py-0.5 rounded border border-blue-800">{key.id}</span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${getStatusBadge(key.status)}`}>{key.status}</span>
              </div>
              <div>
                <h3 className="font-bold text-white text-base">{key.algorithm}</h3>
                <p className="text-xs text-slate-400 mt-1">{key.purpose}</p>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Security Strength:</span>
                  <span className="text-cyan-300 font-semibold">{key.strength}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Encryptions Handled:</span>
                  <span className="text-slate-200 font-mono">{key.encryptionsHandled.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Last Rotation:</span>
                  <span className="text-slate-300">{key.lastRotation}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Next Rotation:</span>
                  <span className={key.nextRotation === 'NOW' ? 'text-red-400 font-bold' : 'text-slate-300'}>{key.nextRotation}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Host Cluster:</span>
                  <span className="text-slate-300 font-mono text-[10px]">{key.hostCluster}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>TPM Attestation:</span>
                  <span className={key.tpmAttestation === 'VALIDATED' ? 'text-emerald-400' : 'text-amber-400'}>{key.tpmAttestation}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Post-Quantum Ready:</span>
                  <span className={key.quantumReady ? 'text-emerald-400' : 'text-red-400'}>{key.quantumReady ? 'Yes' : 'No — Pending'}</span>
                </div>
              </div>
              {key.drift > 0 && (
                <div className="bg-red-950/30 border border-red-800/50 p-2 rounded-lg text-xs text-red-300 flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  Drift detected: {(key.drift * 100).toFixed(0)}% — rotation required
                </div>
              )}
              <button
                onClick={() => openModal(key, 'kms')}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-all border border-slate-700"
              >
                Inspect Key Vault
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ═══════════════ TAB: Hardware Enclaves ═══════════════ */}
      {activeTab === 'enclaves' && (
        <div className="space-y-4">
          {filteredEnclaves.map(enc => (
            <div key={enc.id} className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 transition-all shadow-lg">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-xs text-violet-400 bg-violet-950/50 px-2 py-0.5 rounded border border-violet-800">{enc.id}</span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${getStatusBadge(enc.status)}`}>{enc.status}</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold border bg-slate-800 border-slate-700 text-slate-300">{enc.type}</span>
                  </div>
                  <h3 className="font-bold text-white text-base">{enc.name}</h3>
                  <p className="text-xs text-slate-400 mt-1">{enc.workload} • Region: {enc.region}</p>
                </div>
                <div className="flex items-center gap-6 text-xs text-slate-400">
                  <div className="text-center">
                    <p className="text-violet-400 font-bold text-lg">{enc.memoryGb}GB</p>
                    <p>Memory</p>
                  </div>
                  <div className="text-center">
                    <p className="text-cyan-400 font-bold text-lg">{enc.cpuUtilization}%</p>
                    <p>CPU</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <Shield className="w-3.5 h-3.5 text-violet-400" />
                  Attest: <span className={enc.attestStatus === 'COLLATERAL_VERIFIED' ? 'text-emerald-400' : 'text-amber-400'}>{enc.attestStatus}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Lock className="w-3.5 h-3.5 text-violet-400" />
                  Seal Integrity: <span className={enc.sealIntegrity >= 100 ? 'text-emerald-400' : 'text-amber-400'}>{enc.sealIntegrity}%</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Clock className="w-3.5 h-3.5 text-violet-400" />
                  Last Boot: <span className="text-slate-200">{enc.lastBoot}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Radio className="w-3.5 h-3.5 text-violet-400" />
                  Region: <span className="text-slate-200">{enc.region}</span>
                </div>
              </div>
              <button
                onClick={() => openModal(enc, 'enclave')}
                className="mt-4 w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-all border border-slate-700 flex items-center justify-center gap-2"
              >
                <Eye className="w-3.5 h-3.5" />
                Inspect Enclave Telemetry
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ═══════════════ TAB: CTEM Attack Surface ═══════════════ */}
      {activeTab === 'ctem' && (
        <div className="space-y-4">
          {filteredCtemAssets.map(asset => (
            <div key={asset.id} className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 transition-all shadow-lg">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-xs text-amber-400 bg-amber-950/50 px-2 py-0.5 rounded border border-amber-800">{asset.id}</span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${getStatusBadge(asset.status)}`}>{asset.status}</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold border bg-slate-800 border-slate-700 text-slate-300">{asset.exposure}</span>
                  </div>
                  <h3 className="font-bold text-white text-base">{asset.asset}</h3>
                  <p className="text-xs text-slate-400 mt-1">Last scan: {asset.lastScan} • Remediated by: {asset.remediatedBy}</p>
                </div>
                <div className="flex items-center gap-6 text-xs text-slate-400">
                  <div className="text-center">
                    <p className={`font-bold text-lg ${getRiskColor(asset.riskScore)}`}>{asset.riskScore}</p>
                    <p>Risk Score</p>
                  </div>
                  <div className="text-center">
                    <p className={`font-bold text-lg ${asset.cveCount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{asset.cveCount}</p>
                    <p>CVEs</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {asset.attackVectors.map((v, i) => (
                  <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 flex items-center gap-1.5">
                    <Bug className="w-3 h-3 text-amber-400" />
                    {v}
                  </span>
                ))}
              </div>
              <div className="mt-3 text-xs text-slate-400 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" />
                Patch Latency: <span className={asset.patchLatency === 'Pending review' ? 'text-amber-400' : 'text-slate-200'}>{asset.patchLatency}</span>
              </div>
              <button
                onClick={() => openModal(asset, 'ctem')}
                className="mt-4 w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-all border border-slate-700 flex items-center justify-center gap-2"
              >
                <Eye className="w-3.5 h-3.5" />
                Inspect Attack Surface
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ═══════════════ TAB: SIEM Event Stream ═══════════════ */}
      {activeTab === 'siem' && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Event ID</th>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Message</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredSiemEvents.map(evt => (
                <tr
                  key={evt.id}
                  className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                  onClick={() => openModal(evt, 'siem')}
                >
                  <td className="px-4 py-3 font-mono text-cyan-400 text-xs">{evt.id}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">{evt.timestamp}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getSeverityColor(evt.severity)}`}>{evt.severity}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-300">{evt.source}</td>
                  <td className="px-4 py-3 text-xs text-slate-300">{evt.category}</td>
                  <td className="px-4 py-3 text-xs text-slate-300 max-w-xs truncate">{evt.message}</td>
                  <td className="px-4 py-3 text-xs text-slate-300 font-mono">{evt.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredSiemEvents.length === 0 && (
            <div className="text-center py-12 text-slate-500 text-sm">No SIEM events match your search.</div>
          )}
        </div>
      )}

      {/* ═══════════════ MODAL ═══════════════ */}
      {modalOpen && modalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4" onClick={() => setModalOpen(false)}>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-cyan-400" />
                  {modalData._type === 'zero_trust' && 'Zero-Trust Policy Detail'}
                  {modalData._type === 'kms' && 'Post-Quantum Key Vault'}
                  {modalData._type === 'enclave' && 'Hardware Enclave Telemetry'}
                  {modalData._type === 'ctem' && 'CTEM Attack Surface Detail'}
                  {modalData._type === 'siem' && 'SIEM Event Detail'}
                </h2>
                <p className="text-xs text-slate-400 mt-1">{modalData.id || modalData.name || modalData.asset}</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs bg-slate-950 p-4 rounded-xl border border-slate-800 max-h-80 overflow-y-auto">
              {modalData._type === 'zero_trust' && (
                <>
                  <p className="text-slate-400">Policy Engine: <strong className="text-cyan-300">{modalData.policyEngine}</strong></p>
                  <p className="text-slate-400">Scope: <strong className="text-slate-200">{modalData.scope}</strong></p>
                  <p className="text-slate-400">Encryption: <strong className="text-cyan-300">{modalData.encryption}</strong></p>
                  <p className="text-slate-400">MFA Required: <strong className={modalData.mfaRequired ? 'text-emerald-400' : 'text-slate-500'}>{modalData.mfaRequired ? 'Yes' : 'No'}</strong></p>
                  <p className="text-slate-400">Device Attestation: <strong className={modalData.deviceAttest ? 'text-emerald-400' : 'text-slate-500'}>{modalData.deviceAttest ? 'Enabled' : 'Disabled'}</strong></p>
                  <p className="text-slate-400">Microsegmentation: <strong className={modalData.networkMicroseg ? 'text-emerald-400' : 'text-slate-500'}>{modalData.networkMicroseg ? 'Active' : 'Off'}</strong></p>
                  <p className="text-slate-400">Last Violation: <strong className="text-slate-200">{modalData.lastViolation || 'None'}</strong></p>
                  <p className="text-slate-400">Violation Detail: <strong className="text-slate-200">{modalData.violationDetail}</strong></p>
                  <p className="text-slate-400">Sessions Allowed: <strong className="text-emerald-400">{modalData.sessionsAllowed?.toLocaleString()}</strong></p>
                  <p className="text-slate-400">Sessions Blocked: <strong className="text-red-400">{modalData.sessionsBlocked}</strong></p>
                </>
              )}
              {modalData._type === 'kms' && (
                <>
                  <p className="text-slate-400">Algorithm: <strong className="text-blue-300">{modalData.algorithm}</strong></p>
                  <p className="text-slate-400">Purpose: <strong className="text-slate-200">{modalData.purpose}</strong></p>
                  <p className="text-slate-400">Security Strength: <strong className="text-cyan-300">{modalData.strength}</strong></p>
                  <p className="text-slate-400">Host Cluster: <strong className="text-slate-200 font-mono">{modalData.hostCluster}</strong></p>
                  <p className="text-slate-400">Total Encryptions: <strong className="text-slate-200">{modalData.encryptionsHandled?.toLocaleString()}</strong></p>
                  <p className="text-slate-400">TPM Attestation: <strong className={modalData.tpmAttestation === 'VALIDATED' ? 'text-emerald-400' : 'text-amber-400'}>{modalData.tpmAttestation}</strong></p>
                  <p className="text-slate-400">Quantum Ready: <strong className={modalData.quantumReady ? 'text-emerald-400' : 'text-red-400'}>{modalData.quantumReady ? 'Yes' : 'No'}</strong></p>
                  <p className="text-slate-400">Key Drift: <strong className={modalData.drift > 0 ? 'text-red-400' : 'text-emerald-400'}>{(modalData.drift * 100).toFixed(1)}%</strong></p>
                </>
              )}
              {modalData._type === 'enclave' && (
                <>
                  <p className="text-slate-400">Type: <strong className="text-violet-300">{modalData.type}</strong></p>
                  <p className="text-slate-400">Region: <strong className="text-slate-200">{modalData.region}</strong></p>
                  <p className="text-slate-400">Memory: <strong className="text-slate-200">{modalData.memoryGb}GB</strong></p>
                  <p className="text-slate-400">CPU Utilization: <strong className="text-cyan-300">{modalData.cpuUtilization}%</strong></p>
                  <p className="text-slate-400">Attestation: <strong className={modalData.attestStatus === 'COLLATERAL_VERIFIED' ? 'text-emerald-400' : 'text-amber-400'}>{modalData.attestStatus}</strong></p>
                  <p className="text-slate-400">Seal Integrity: <strong className={modalData.sealIntegrity >= 100 ? 'text-emerald-400' : 'text-amber-400'}>{modalData.sealIntegrity}%</strong></p>
                  <p className="text-slate-400">Workload: <strong className="text-slate-200">{modalData.workload}</strong></p>
                  <p className="text-slate-400">Last Boot: <strong className="text-slate-200">{modalData.lastBoot}</strong></p>
                </>
              )}
              {modalData._type === 'ctem' && (
                <>
                  <p className="text-slate-400">Asset: <strong className="text-amber-300">{modalData.asset}</strong></p>
                  <p className="text-slate-400">Exposure: <strong className="text-slate-200">{modalData.exposure}</strong></p>
                  <p className="text-slate-400">Risk Score: <strong className={getRiskColor(modalData.riskScore)}>{modalData.riskScore}/100</strong></p>
                  <p className="text-slate-400">CVE Count: <strong className={modalData.cveCount > 0 ? 'text-red-400' : 'text-emerald-400'}>{modalData.cveCount}</strong></p>
                  <p className="text-slate-400">Attack Vectors: <strong className="text-slate-200">{modalData.attackVectors?.join(', ')}</strong></p>
                  <p className="text-slate-400">Status: <strong className="text-slate-200">{modalData.status}</strong></p>
                  <p className="text-slate-400">Remediated By: <strong className="text-slate-200">{modalData.remediatedBy}</strong></p>
                  <p className="text-slate-400">Patch Latency: <strong className="text-slate-200">{modalData.patchLatency}</strong></p>
                  <p className="text-slate-400">Last Scan: <strong className="text-slate-200">{modalData.lastScan}</strong></p>
                </>
              )}
              {modalData._type === 'siem' && (
                <>
                  <p className="text-slate-400">Severity: <strong className={getSeverityColor(modalData.severity).replace('bg-', 'text-').split(' ')[1]}>{modalData.severity}</strong></p>
                  <p className="text-slate-400">Source: <strong className="text-slate-200">{modalData.source}</strong></p>
                  <p className="text-slate-400">Category: <strong className="text-slate-200">{modalData.category}</strong></p>
                  <p className="text-slate-400">Message: <strong className="text-slate-200">{modalData.message}</strong></p>
                  <p className="text-slate-400">Source IP: <strong className="text-slate-200 font-mono">{modalData.sourceIp}</strong></p>
                  <p className="text-slate-400">Action Taken: <strong className="text-cyan-300">{modalData.action}</strong></p>
                  <p className="text-slate-400">MITRE ATT&CK: <strong className="text-slate-200">{modalData.mitre}</strong></p>
                  <p className="text-slate-400">Analyst: <strong className={modalData.analyst ? 'text-slate-200' : 'text-slate-500'}>{modalData.analyst || 'Unassigned'}</strong></p>
                  <p className="text-slate-400">Timestamp: <strong className="text-slate-200 font-mono">{modalData.timestamp}</strong></p>
                </>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-800">
              <button onClick={() => setModalOpen(false)} className="px-4 py-2 bg-slate-800 text-slate-200 rounded-lg text-sm font-medium hover:bg-slate-700 transition-all">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnterpriseSecurityComplianceHub;

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  FileCheck,
  Shield,
  ShieldCheck,
  Clock,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Eye,
  Play,
  Pause,
  RotateCcw,
  Download,
  ChevronRight,
  AlertTriangle,
  Bell,
  Radio,
  Lock,
  Fingerprint,
  Stamp,
  BookOpen,
  Link2,
  Hash,
  FileText,
  Users,
  Activity,
  BarChart3,
  Calendar,
  Globe,
  Database,
  Server,
  RefreshCw,
  Layers,
  Scroll,
  Key,
  Zap,
  Sparkles,
  ArrowUpRight,
  ExternalLink,
  FileWarning,
  ClipboardCheck,
  BadgeCheck,
  Landmark,
  Scale,
  NotebookPen,
  ScanLine
} from 'lucide-react';

const ComplianceProvenanceLedgerHub = () => {
  const [activeTab, setActiveTab] = useState('c2pa');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [toasts, setToasts] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [simRunning, setSimRunning] = useState(false);
  const [simSpeed, setSimSpeed] = useState(1);
  const [simTick, setSimTick] = useState(0);
  const simRef = useRef(null);
  const toastId = useRef(0);

  // ──────────────────── C2PA Provenance Assertions ────────────────────
  const [c2paAssertions, setC2paAssertions] = useState([
    {
      id: 'C2PA-AI-001',
      title: 'AI Radiology Model — Chest X-Ray Classifier v4.2',
      type: 'AI_GENERATED',
      producer: 'MedTrack Biomedical AI Lab',
      tool: 'C2PA Compliant Tool Manifest v2.1',
      status: 'VERIFIED',
      timestamp: '2026-08-19T06:12:33Z',
      hash: 'sha256:9f4e3c2a1b8d7e6f5a0c3b2d1e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1',
      parentAssertion: null,
      signatures: 2,
      manifestStore: 'C2PA-JUMBF v2.0',
      claimGenerator: 'MedTrack AI Provenance Engine',
      evidentiaryLinks: ['FDA 510(k) Pre-Submission #2026-4421', 'IEC 62304 Software Lifecycle'],
      complianceFrameworks: ['C2PA 2.1 Specification', 'ISO/IEC 42001', 'EU AI Act Art. 52']
    },
    {
      id: 'C2PA-DI-002',
      title: 'Pathology Slide — H&E Stained Biopsy Sample #8841',
      type: 'DIGITAL_CAPTURE',
      producer: 'Dr. Sarah Chen — Digital Pathology Suite',
      tool: 'Hamamatsu NanoZoomer S360 + C2PA Module',
      status: 'VERIFIED',
      timestamp: '2026-08-19T04:30:15Z',
      hash: 'sha256:a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
      parentAssertion: null,
      signatures: 3,
      manifestStore: 'C2PA-JUMBF v2.0',
      claimGenerator: 'Hamamatsu C2PA Capture Module v3.1',
      evidentiaryLinks: ['CAP Laboratory Accreditation #2026-881', 'CLIA Certification #NYC-9920'],
      complianceFrameworks: ['C2PA 2.1 Specification', 'DICOM SR', 'FDA 21 CFR Part 58']
    },
    {
      id: 'C2PA-ED-003',
      title: 'Clinical Trial Consent Form — Phase III OncoTrial',
      type: 'EDITED_DOCUMENT',
      producer: 'IRB Review Board — MedTrack Clinical Research',
      tool: 'Adobe Acrobat C2PA Plugin v1.8',
      status: 'VERIFIED',
      timestamp: '2026-08-18T22:45:09Z',
      hash: 'sha256:b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3',
      parentAssertion: 'C2PA-ED-002',
      signatures: 4,
      manifestStore: 'C2PA-JUMBF v2.0',
      claimGenerator: 'Adobe Acrobat C2PA Signer v1.8.2',
      evidentiaryLinks: ['IRB Protocol #2026-ONCO-003', 'ICH-GCP E6(R2) Compliance'],
      complianceFrameworks: ['C2PA 2.1 Specification', '21 CFR Part 312', 'ICH E6(R2)']
    },
    {
      id: 'C2PA-AI-004',
      title: 'Genomic Variant Caller — WGS Pipeline v7.0',
      type: 'AI_GENERATED',
      producer: 'MedTrack Precision Genomics Division',
      tool: 'C2PA Compliant Tool Manifest v2.1',
      status: 'VERIFIED',
      timestamp: '2026-08-19T01:22:44Z',
      hash: 'sha256:c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4',
      parentAssertion: null,
      signatures: 2,
      manifestStore: 'C2PA-JUMBF v2.0',
      claimGenerator: 'GATK-C2PA Provenance Wrapper v1.3',
      evidentiaryLinks: ['CLIA Certification #PHG-7701', 'ISO 15189:2022 Accreditation'],
      complianceFrameworks: ['C2PA 2.1 Specification', 'ISO/IEC 42001', 'GINA Compliance']
    },
    {
      id: 'C2PA-VI-005',
      title: 'Telehealth Consult Recording — Patient Encounter #9941',
      type: 'VIDEO_CAPTURE',
      producer: 'Dr. Marcus Holloway — Neurology',
      tool: 'MedTrack Telehealth C2PA Recorder v2.0',
      status: 'PENDING_REVIEW',
      timestamp: '2026-08-19T05:55:18Z',
      hash: 'sha256:d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5',
      parentAssertion: null,
      signatures: 1,
      manifestStore: 'C2PA-JUMBF v2.0',
      claimGenerator: 'MedTrack Telehealth C2PA Recorder v2.0',
      evidentiaryLinks: ['HITRUST CSF v11 Assessment', 'SOC 2 Type II Report'],
      complianceFrameworks: ['C2PA 2.1 Specification', 'HIPAA §164.312', 'HITECH Act']
    }
  ]);

  // ──────────────────── HIPAA Audit Logs ────────────────────
  const [hipaaLogs, setHipaaLogs] = useState([
    {
      id: 'HIPAA-LOG-001',
      timestamp: '2026-08-19T07:15:03Z',
      eventType: 'ACCESS_PHI',
      actor: 'dr.connor@medtrack.health',
      role: 'Physician',
      resource: 'PatientRecord PT-4421',
      action: 'VIEW_EHR',
      patientId: 'PT-4421',
      destination: 'EHR Module — Tab: Lab Results',
      ipAddress: '10.240.12.89',
      mfaMethod: 'FIDO2/WebAuthn',
      outcome: 'SUCCESS',
      hipaaRule: '§164.312(a)(1) — Access Control',
      minimumNecessary: true,
      breakGlass: false
    },
    {
      id: 'HIPAA-LOG-002',
      timestamp: '2026-08-19T07:10:44Z',
      eventType: 'MODIFY_PHI',
      actor: 'nurse.holloway@medtrack.health',
      role: 'Nurse',
      resource: 'PatientRecord PT-9921',
      action: 'UPDATE_VITALS',
      patientId: 'PT-9921',
      destination: 'EHR Module — Tab: Vitals',
      ipAddress: '10.240.14.22',
      mfaMethod: 'FIDO2/WebAuthn',
      outcome: 'SUCCESS',
      hipaaRule: '§164.312(a)(2)(iv) — Encryption & Decryption',
      minimumNecessary: true,
      breakGlass: false
    },
    {
      id: 'HIPAA-LOG-003',
      timestamp: '2026-08-19T07:05:21Z',
      eventType: 'ACCESS_PHI',
      actor: 'admin.system@medtrack.health',
      role: 'System Admin',
      resource: 'BulkExportJob #EXP-2201',
      action: 'EXPORT_PHI',
      patientId: 'MULTI (342 patients)',
      destination: 'Data Warehouse — De-identified Tier',
      ipAddress: '10.240.0.5',
      mfaMethod: 'HOTP TOTP',
      outcome: 'SUCCESS',
      hipaaRule: '§164.514(b) — De-identification Standard',
      minimumNecessary: true,
      breakGlass: false
    },
    {
      id: 'HIPAA-LOG-004',
      timestamp: '2026-08-19T06:58:11Z',
      eventType: 'ACCESS_PHI',
      actor: 'researcher.thorne@medtrack.health',
      role: 'Researcher',
      resource: 'PatientRecord PT-7712',
      action: 'VIEW_GENOMIC',
      patientId: 'PT-7712',
      destination: 'Precision Medicine Vault — Genomic Viewer',
      ipAddress: '10.240.18.101',
      mfaMethod: 'FIDO2/WebAuthn',
      outcome: 'DENIED_MINIMUM_NECESSARY',
      hipaaRule: '§164.502(b) — Minimum Necessary Standard',
      minimumNecessary: false,
      breakGlass: false
    },
    {
      id: 'HIPAA-LOG-005',
      timestamp: '2026-08-19T06:45:09Z',
      eventType: 'BREAK_GLASS',
      actor: 'dr.oswald@medtrack.health',
      role: 'Emergency Physician',
      resource: 'PatientRecord PT-1039',
      action: 'EMERGENCY_ACCESS',
      patientId: 'PT-1039',
      destination: 'EHR Module — Full Record Access',
      ipAddress: '10.240.22.55',
      mfaMethod: 'Emergency Override + Biometric',
      outcome: 'SUCCESS',
      hipaaRule: '§164.312(a)(2)(ii) — Emergency Access Procedure',
      minimumNecessary: false,
      breakGlass: true
    },
    {
      id: 'HIPAA-LOG-006',
      timestamp: '2026-08-19T06:30:02Z',
      eventType: 'DISCLOSE_PHI',
      actor: 'integration.hl7@medtrack.health',
      role: 'System Integration',
      resource: 'HL7 FHIR Bundle #FHIR-8841',
      action: 'OUTBOUND_DISCLOSURE',
      patientId: 'PT-4421',
      destination: 'Partner Hospital — Regional HIE',
      ipAddress: '10.240.1.10',
      mfaMethod: 'mTLS + OAuth2 Client Credentials',
      outcome: 'SUCCESS',
      hipaaRule: '§164.506(c) — Uses and Disclosures for Treatment',
      minimumNecessary: true,
      breakGlass: false
    }
  ]);

  // ──────────────────── Provenance Chain ────────────────────
  const [provenanceChain, setProvenanceChain] = useState([
    {
      id: 'PC-001',
      title: 'Radiology AI Model Provenance Chain',
      links: 4,
      status: 'COMPLETE',
      rootHash: 'sha256:e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6',
      lastVerified: '3 minutes ago',
      tamperScore: 0.0,
      linkedAssertions: ['C2PA-AI-001', 'C2PA-AI-004'],
      chainIntegrity: 100.0,
      merkleRoot: 'MERKLE-ROOT-001'
    },
    {
      id: 'PC-002',
      title: 'Pathology Digital Slide Provenance',
      links: 3,
      status: 'COMPLETE',
      rootHash: 'sha256:f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7',
      lastVerified: '8 minutes ago',
      tamperScore: 0.0,
      linkedAssertions: ['C2PA-DI-002'],
      chainIntegrity: 100.0,
      merkleRoot: 'MERKLE-ROOT-002'
    },
    {
      id: 'PC-003',
      title: 'Clinical Trial Consent Provenance',
      links: 6,
      status: 'INTEGRITY_WARNING',
      rootHash: 'sha256:a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8',
      lastVerified: '42 minutes ago',
      tamperScore: 0.3,
      linkedAssertions: ['C2PA-ED-003'],
      chainIntegrity: 99.7,
      merkleRoot: 'MERKLE-ROOT-003'
    }
  ]);

  // ──────────────────── Compliance Frameworks ────────────────────
  const [frameworks, setFrameworks] = useState([
    { name: 'HIPAA Privacy Rule', code: '§164.500-534', status: 'COMPLIANT', score: 99.8, lastAudit: '2026-08-15', nextAudit: '2026-11-15', findings: 0 },
    { name: 'HIPAA Security Rule', code: '§164.302-318', status: 'COMPLIANT', score: 99.6, lastAudit: '2026-08-12', nextAudit: '2026-11-12', findings: 1 },
    { name: 'HITECH Act', code: '42 USC §17932', status: 'COMPLIANT', score: 100.0, lastAudit: '2026-08-10', nextAudit: '2026-11-10', findings: 0 },
    { name: 'C2PA 2.1 Specification', code: 'C2PA-2026-04', status: 'COMPLIANT', score: 98.2, lastAudit: '2026-08-18', nextAudit: '2026-11-18', findings: 2 },
    { name: 'ISO/IEC 42001', code: 'AI Management System', status: 'COMPLIANT', score: 97.5, lastAudit: '2026-08-05', nextAudit: '2026-11-05', findings: 3 },
    { name: 'EU AI Act', code: 'Regulation (EU) 2024/1689', status: 'COMPLIANT', score: 96.8, lastAudit: '2026-08-01', nextAudit: '2026-11-01', findings: 4 },
    { name: 'FDA 21 CFR Part 11', code: 'Electronic Records', status: 'COMPLIANT', score: 99.9, lastAudit: '2026-08-14', nextAudit: '2026-11-14', findings: 0 },
    { name: 'SOC 2 Type II', code: 'Trust Services Criteria', status: 'COMPLIANT', score: 99.1, lastAudit: '2026-07-20', nextAudit: '2027-07-20', findings: 1 }
  ]);

  // ──────────────────── Simulation ────────────────────
  useEffect(() => {
    if (simRunning) {
      simRef.current = setInterval(() => {
        setSimTick(t => t + 1);
        if (Math.random() > 0.7) {
          const types = ['ACCESS_PHI', 'MODIFY_PHI', 'DISCLOSE_PHI', 'BREAK_GLASS', 'ACCESS_PHI', 'EXPORT_PHI'];
          const actors = ['dr.connor@medtrack.health', 'nurse.holloway@medtrack.health', 'researcher.thorne@medtrack.health', 'admin.system@medtrack.health'];
          const roles = ['Physician', 'Nurse', 'Researcher', 'System Admin'];
          const actions = ['VIEW_EHR', 'UPDATE_VITALS', 'VIEW_GENOMIC', 'EXPORT_PHI', 'EMERGENCY_ACCESS', 'OUTBOUND_DISCLOSURE'];
          const idx = Math.floor(Math.random() * actors.length);
          const newLog = {
            id: `HIPAA-LOG-${String(hipaaLogs.length + 1).padStart(3, '0')}`,
            timestamp: new Date().toISOString(),
            eventType: types[Math.floor(Math.random() * types.length)],
            actor: actors[idx],
            role: roles[idx],
            resource: `PatientRecord PT-${1000 + Math.floor(Math.random() * 9000)}`,
            action: actions[Math.floor(Math.random() * actions.length)],
            patientId: `PT-${1000 + Math.floor(Math.random() * 9000)}`,
            destination: 'EHR Module',
            ipAddress: `10.240.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
            mfaMethod: 'FIDO2/WebAuthn',
            outcome: Math.random() > 0.15 ? 'SUCCESS' : 'DENIED',
            hipaaRule: '§164.312(a)(1) — Access Control',
            minimumNecessary: Math.random() > 0.1,
            breakGlass: Math.random() > 0.9
          };
          setHipaaLogs(prev => [newLog, ...prev].slice(0, 100));
          addToast(`${newLog.eventType}: ${newLog.outcome}`, newLog.outcome === 'SUCCESS' ? 'INFO' : 'WARNING');
        }
      }, 2500 / simSpeed);
    }
    return () => clearInterval(simRef.current);
  }, [simRunning, simSpeed, hipaaLogs.length]);

  const addToast = useCallback((message, severity = 'INFO') => {
    const id = ++toastId.current;
    setToasts(prev => [...prev, { id, message, severity }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  // ──────────────────── Filtering ────────────────────
  const filteredC2pa = useMemo(() => {
    return c2paAssertions.filter(a => {
      const matchSearch = a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.producer.toLowerCase().includes(searchTerm.toLowerCase());
      const matchFilter = statusFilter === 'all' || a.status.toLowerCase().includes(statusFilter.toLowerCase()) ||
        a.type.toLowerCase().includes(statusFilter.toLowerCase());
      return matchSearch && matchFilter;
    });
  }, [c2paAssertions, searchTerm, statusFilter]);

  const filteredHipaa = useMemo(() => {
    return hipaaLogs.filter(l => {
      const matchSearch = l.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.action.toLowerCase().includes(searchTerm.toLowerCase());
      const matchFilter = statusFilter === 'all' ||
        l.eventType.toLowerCase().includes(statusFilter.toLowerCase()) ||
        l.outcome.toLowerCase().includes(statusFilter.toLowerCase());
      return matchSearch && matchFilter;
    });
  }, [hipaaLogs, searchTerm, statusFilter]);

  const filteredChains = useMemo(() => {
    return provenanceChain.filter(c => {
      const matchSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchFilter = statusFilter === 'all' || c.status.toLowerCase().includes(statusFilter.toLowerCase());
      return matchSearch && matchFilter;
    });
  }, [provenanceChain, searchTerm, statusFilter]);

  // ──────────────────── CSV Export ────────────────────
  const exportCSV = (data, filename) => {
    if (!data.length) return;
    const headers = Object.keys(data[0]);
    const rows = data.map(row => headers.map(h => {
      const val = row[h];
      if (Array.isArray(val)) return `"${val.join('; ')}"`;
      if (typeof val === 'object' && val !== null) return JSON.stringify(val);
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

  const openModal = (item, type) => {
    setModalData({ ...item, _type: type });
    setModalOpen(true);
  };

  const resetSim = () => {
    setSimRunning(false);
    setSimTick(0);
    addToast('HIPAA audit simulation reset', 'INFO');
  };

  const getSeverityColor = (outcome) => {
    switch (outcome) {
      case 'SUCCESS': return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
      case 'DENIED': case 'DENIED_MINIMUM_NECESSARY': return 'bg-red-500/10 border-red-500/30 text-red-400';
      case 'WARNING': return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
      default: return 'bg-slate-500/10 border-slate-500/30 text-slate-400';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'VERIFIED': case 'COMPLETE': case 'COMPLIANT': return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
      case 'PENDING_REVIEW': case 'INTEGRITY_WARNING': return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
      case 'REVOKED': case 'FAILED': return 'bg-red-500/10 border-red-500/30 text-red-400';
      default: return 'bg-slate-500/10 border-slate-500/30 text-slate-400';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'AI_GENERATED': return 'bg-violet-500/10 border-violet-500/30 text-violet-400';
      case 'DIGITAL_CAPTURE': return 'bg-blue-500/10 border-blue-500/30 text-blue-400';
      case 'EDITED_DOCUMENT': return 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400';
      case 'VIDEO_CAPTURE': return 'bg-rose-500/10 border-rose-500/30 text-rose-400';
      default: return 'bg-slate-500/10 border-slate-500/30 text-slate-400';
    }
  };

  const tabs = [
    { key: 'c2pa', label: 'C2PA Provenance', icon: Stamp },
    { key: 'hipaa', label: 'HIPAA Audit Logs', icon: Shield },
    { key: 'chains', label: 'Provenance Chains', icon: Link2 },
    { key: 'frameworks', label: 'Compliance Frameworks', icon: Landmark }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6">
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[100] space-y-2">
        {toasts.map(t => (
          <div key={t.id} className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium shadow-2xl animate-pulse ${t.severity === 'WARNING' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'}`}>
            <Bell className="w-4 h-4 shrink-0" />
            {t.message}
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600/20 rounded-xl border border-indigo-500/30 text-indigo-400">
            <Landmark className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Regulatory Audit & Provenance Ledger
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-medium">
                C2PA + HIPAA
              </span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              C2PA content provenance assertions, HIPAA audit trail logging, provenance chain verification & multi-framework compliance scoring.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => exportCSV(
              activeTab === 'c2pa' ? filteredC2pa : activeTab === 'hipaa' ? filteredHipaa : activeTab === 'chains' ? filteredChains : frameworks,
              `regulatory-audit-${activeTab}`
            )}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium transition-all border border-slate-700"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 my-6">
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">C2PA Assertions</p>
            <p className="text-2xl font-bold text-white mt-1">{c2paAssertions.length} Verified</p>
            <span className="text-xs text-emerald-400 flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-3 h-3" /> Content Authentic
            </span>
          </div>
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg">
            <Stamp className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">HIPAA Events</p>
            <p className="text-2xl font-bold text-white mt-1">{hipaaLogs.length} Events</p>
            <span className={`text-xs flex items-center gap-1 mt-1 ${simRunning ? 'text-emerald-400' : 'text-slate-500'}`}>
              <Radio className="w-3 h-3" /> {simRunning ? `Live (${simSpeed}x)` : 'Paused'}
            </span>
          </div>
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
            <Shield className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Provenance Chains</p>
            <p className="text-2xl font-bold text-white mt-1">{provenanceChain.length} Active</p>
            <span className="text-xs text-emerald-400 flex items-center gap-1 mt-1">
              <Link2 className="w-3 h-3" /> Merkle-Verified
            </span>
          </div>
          <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-lg">
            <Link2 className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Compliance Score</p>
            <p className="text-2xl font-bold text-white mt-1">99.0 / 100</p>
            <span className="text-xs text-emerald-400 flex items-center gap-1 mt-1">
              <BadgeCheck className="w-3 h-3" /> 8 Frameworks
            </span>
          </div>
          <div className="p-3 bg-violet-500/10 border border-violet-500/20 text-violet-400 rounded-lg">
            <Scale className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Findings</p>
            <p className="text-2xl font-bold text-white mt-1">11 Open</p>
            <span className="text-xs text-amber-400 flex items-center gap-1 mt-1">
              <AlertTriangle className="w-3 h-3" /> Across All Frameworks
            </span>
          </div>
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg">
            <FileWarning className="w-5 h-5" />
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
            {simRunning ? 'Pause Audit Stream' : 'Start Audit Stream'}
          </button>
          <button onClick={resetSim} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium border border-slate-700">
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="font-medium">Speed:</span>
          {[1, 2, 4].map(s => (
            <button key={s} onClick={() => setSimSpeed(s)} className={`px-3 py-1 rounded border text-xs font-mono ${simSpeed === s ? 'bg-indigo-600/20 border-indigo-500/30 text-indigo-400' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'}`}>
              {s}x
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 ml-auto">
          <Clock className="w-3 h-3" />
          Tick: {simTick} | Events: {hipaaLogs.length}
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
              className={`pb-3 px-4 text-sm font-medium transition-all relative flex items-center gap-2 whitespace-nowrap ${activeTab === tab.key ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-900/40 p-4 border border-slate-800 rounded-xl mb-6">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder={`Search ${tabs.find(t => t.key === activeTab)?.label}...`}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
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
              {activeTab === 'c2pa' && <><option value="verified">Verified</option><option value="pending_review">Pending Review</option><option value="ai_generated">AI Generated</option><option value="digital_capture">Digital Capture</option></>}
              {activeTab === 'hipaa' && <><option value="access_phi">Access PHI</option><option value="modify_phi">Modify PHI</option><option value="disclose_phi">Disclose PHI</option><option value="break_glass">Break Glass</option><option value="success">Success</option><option value="denied">Denied</option></>}
              {activeTab === 'chains' && <><option value="complete">Complete</option><option value="integrity_warning">Integrity Warning</option></>}
              {activeTab === 'frameworks' && <><option value="compliant">Compliant</option></>}
            </select>
          </div>
        </div>
      </div>

      {/* ═══════════════ TAB: C2PA Provenance ═══════════════ */}
      {activeTab === 'c2pa' && (
        <div className="space-y-4">
          {filteredC2pa.map(assertion => (
            <div key={assertion.id} className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 transition-all shadow-lg">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-xs text-indigo-400 bg-indigo-950/50 px-2 py-0.5 rounded border border-indigo-800">{assertion.id}</span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${getStatusBadge(assertion.status)}`}>{assertion.status}</span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${getTypeColor(assertion.type)}`}>{assertion.type.replace('_', ' ')}</span>
                  </div>
                  <h3 className="font-bold text-white text-base">{assertion.title}</h3>
                  <p className="text-xs text-slate-400 mt-1">Producer: {assertion.producer} • Tool: {assertion.tool}</p>
                </div>
                <div className="flex items-center gap-6 text-xs text-slate-400">
                  <div className="text-center">
                    <p className="text-indigo-400 font-bold text-lg">{assertion.signatures}</p>
                    <p>Signatures</p>
                  </div>
                  <div className="text-center">
                    <p className="text-emerald-400 font-bold text-lg">{assertion.complianceFrameworks.length}</p>
                    <p>Frameworks</p>
                  </div>
                </div>
              </div>
              <div className="mt-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <p className="text-xs text-slate-400 font-mono truncate">Hash: {assertion.hash}</p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {assertion.complianceFrameworks.map((fw, i) => (
                  <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-indigo-950/50 border border-indigo-800/50 text-indigo-300 flex items-center gap-1.5">
                    <Scale className="w-3 h-3" />
                    {fw}
                  </span>
                ))}
              </div>
              <button
                onClick={() => openModal(assertion, 'c2pa')}
                className="mt-4 w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-all border border-slate-700 flex items-center justify-center gap-2"
              >
                <Eye className="w-3.5 h-3.5" />
                Inspect C2PA Manifest
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {filteredC2pa.length === 0 && (
            <div className="text-center py-12 text-slate-500 text-sm">No C2PA assertions match your search.</div>
          )}
        </div>
      )}

      {/* ═══════════════ TAB: HIPAA Audit Logs ═══════════════ */}
      {activeTab === 'hipaa' && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Log ID</th>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">HIPAA Rule</th>
                <th className="px-4 py-3">Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredHipaa.map(log => (
                <tr
                  key={log.id}
                  className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                  onClick={() => openModal(log, 'hipaa')}
                >
                  <td className="px-4 py-3 font-mono text-indigo-400 text-xs">{log.id}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">{log.timestamp}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-slate-800 border-slate-700 text-slate-300">{log.eventType.replace('_', ' ')}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-300">{log.actor}</td>
                  <td className="px-4 py-3 text-xs text-slate-300 font-mono">{log.patientId}</td>
                  <td className="px-4 py-3 text-xs text-slate-300">{log.action}</td>
                  <td className="px-4 py-3 text-xs text-slate-400 font-mono">{log.hipaaRule.split('—')[0]}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getSeverityColor(log.outcome)}`}>{log.outcome.replace('_', ' ')}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredHipaa.length === 0 && (
            <div className="text-center py-12 text-slate-500 text-sm">No HIPAA events match your search.</div>
          )}
        </div>
      )}

      {/* ═══════════════ TAB: Provenance Chains ═══════════════ */}
      {activeTab === 'chains' && (
        <div className="space-y-4">
          {filteredChains.map(chain => (
            <div key={chain.id} className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 transition-all shadow-lg">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-xs text-cyan-400 bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-800">{chain.id}</span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${getStatusBadge(chain.status)}`}>{chain.status.replace('_', ' ')}</span>
                  </div>
                  <h3 className="font-bold text-white text-base">{chain.title}</h3>
                  <p className="text-xs text-slate-400 mt-1">Merkle Root: {chain.merkleRoot} • Links: {chain.links} • Last Verified: {chain.lastVerified}</p>
                </div>
                <div className="flex items-center gap-6 text-xs text-slate-400">
                  <div className="text-center">
                    <p className="text-cyan-400 font-bold text-lg">{chain.chainIntegrity}%</p>
                    <p>Integrity</p>
                  </div>
                  <div className="text-center">
                    <p className={`font-bold text-lg ${chain.tamperScore > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>{chain.tamperScore}</p>
                    <p>Tamper Score</p>
                  </div>
                </div>
              </div>
              <div className="mt-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <p className="text-xs text-slate-400 font-mono truncate">Root Hash: {chain.rootHash}</p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {chain.linkedAssertions.map((a, i) => (
                  <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-cyan-950/50 border border-cyan-800/50 text-cyan-300 flex items-center gap-1.5">
                    <Hash className="w-3 h-3" />
                    {a}
                  </span>
                ))}
              </div>
              <button
                onClick={() => openModal(chain, 'chain')}
                className="mt-4 w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-all border border-slate-700 flex items-center justify-center gap-2"
              >
                <Eye className="w-3.5 h-3.5" />
                Inspect Chain Integrity
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ═══════════════ TAB: Compliance Frameworks ═══════════════ */}
      {activeTab === 'frameworks' && (
        <div className="space-y-4">
          {frameworks.map(fw => (
            <div key={fw.name} className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 transition-all shadow-lg">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${getStatusBadge(fw.status)}`}>{fw.status}</span>
                    {fw.findings > 0 && (
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold border bg-amber-500/10 border-amber-500/30 text-amber-400">{fw.findings} Findings</span>
                    )}
                  </div>
                  <h3 className="font-bold text-white text-base">{fw.name}</h3>
                  <p className="text-xs text-slate-400 mt-1">{fw.code} • Last Audit: {fw.lastAudit} • Next Audit: {fw.nextAudit}</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <div className="w-32 bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${fw.score}%` }} />
                  </div>
                  <span className="text-indigo-400 font-bold text-lg min-w-[3rem] text-right">{fw.score}</span>
                </div>
              </div>
              <button
                onClick={() => openModal(fw, 'framework')}
                className="mt-4 w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-all border border-slate-700 flex items-center justify-center gap-2"
              >
                <Eye className="w-3.5 h-3.5" />
                Inspect Framework Details
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ═══════════════ MODAL ═══════════════ */}
      {modalOpen && modalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4" onClick={() => setModalOpen(false)}>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  {modalData._type === 'c2pa' && <Stamp className="w-5 h-5 text-indigo-400" />}
                  {modalData._type === 'hipaa' && <Shield className="w-5 h-5 text-emerald-400" />}
                  {modalData._type === 'chain' && <Link2 className="w-5 h-5 text-cyan-400" />}
                  {modalData._type === 'framework' && <Scale className="w-5 h-5 text-violet-400" />}
                  {modalData._type === 'c2pa' && 'C2PA Provenance Detail'}
                  {modalData._type === 'hipaa' && 'HIPAA Audit Event Detail'}
                  {modalData._type === 'chain' && 'Provenance Chain Detail'}
                  {modalData._type === 'framework' && 'Compliance Framework Detail'}
                </h2>
                <p className="text-xs text-slate-400 mt-1">{modalData.id || modalData.name || modalData.title}</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs bg-slate-950 p-4 rounded-xl border border-slate-800 max-h-80 overflow-y-auto">
              {modalData._type === 'c2pa' && (
                <>
                  <p className="text-slate-400">Assertion ID: <strong className="text-indigo-300">{modalData.id}</strong></p>
                  <p className="text-slate-400">Type: <strong className="text-slate-200">{modalData.type.replace('_', ' ')}</strong></p>
                  <p className="text-slate-400">Producer: <strong className="text-slate-200">{modalData.producer}</strong></p>
                  <p className="text-slate-400">Tool: <strong className="text-slate-200">{modalData.tool}</strong></p>
                  <p className="text-slate-400">Status: <strong className="text-emerald-400">{modalData.status}</strong></p>
                  <p className="text-slate-400">Timestamp: <strong className="text-slate-200 font-mono">{modalData.timestamp}</strong></p>
                  <p className="text-slate-400">Hash: <strong className="text-slate-200 font-mono">{modalData.hash}</strong></p>
                  <p className="text-slate-400">Manifest Store: <strong className="text-slate-200">{modalData.manifestStore}</strong></p>
                  <p className="text-slate-400">Claim Generator: <strong className="text-slate-200">{modalData.claimGenerator}</strong></p>
                  <p className="text-slate-400">Signatures: <strong className="text-indigo-300">{modalData.signatures}</strong></p>
                  <p className="text-slate-400">Parent Assertion: <strong className="text-slate-200">{modalData.parentAssertion || 'Root (none)'}</strong></p>
                  <p className="text-slate-400">Evidentiary Links:</p>
                  <ul className="ml-4 space-y-1">{modalData.evidentiaryLinks?.map((l, i) => <li key={i} className="text-slate-300">• {l}</li>)}</ul>
                  <p className="text-slate-400">Compliance Frameworks:</p>
                  <ul className="ml-4 space-y-1">{modalData.complianceFrameworks?.map((f, i) => <li key={i} className="text-indigo-300">• {f}</li>)}</ul>
                </>
              )}
              {modalData._type === 'hipaa' && (
                <>
                  <p className="text-slate-400">Log ID: <strong className="text-indigo-300">{modalData.id}</strong></p>
                  <p className="text-slate-400">Timestamp: <strong className="text-slate-200 font-mono">{modalData.timestamp}</strong></p>
                  <p className="text-slate-400">Event Type: <strong className="text-slate-200">{modalData.eventType.replace('_', ' ')}</strong></p>
                  <p className="text-slate-400">Actor: <strong className="text-slate-200">{modalData.actor}</strong></p>
                  <p className="text-slate-400">Role: <strong className="text-slate-200">{modalData.role}</strong></p>
                  <p className="text-slate-400">Resource: <strong className="text-slate-200">{modalData.resource}</strong></p>
                  <p className="text-slate-400">Action: <strong className="text-slate-200">{modalData.action}</strong></p>
                  <p className="text-slate-400">Patient: <strong className="text-slate-200 font-mono">{modalData.patientId}</strong></p>
                  <p className="text-slate-400">Destination: <strong className="text-slate-200">{modalData.destination}</strong></p>
                  <p className="text-slate-400">IP Address: <strong className="text-slate-200 font-mono">{modalData.ipAddress}</strong></p>
                  <p className="text-slate-400">MFA Method: <strong className="text-slate-200">{modalData.mfaMethod}</strong></p>
                  <p className="text-slate-400">Outcome: <strong className={modalData.outcome === 'SUCCESS' ? 'text-emerald-400' : 'text-red-400'}>{modalData.outcome.replace('_', ' ')}</strong></p>
                  <p className="text-slate-400">HIPAA Rule: <strong className="text-indigo-300">{modalData.hipaaRule}</strong></p>
                  <p className="text-slate-400">Minimum Necessary: <strong className={modalData.minimumNecessary ? 'text-emerald-400' : 'text-red-400'}>{modalData.minimumNecessary ? 'Yes' : 'No'}</strong></p>
                  <p className="text-slate-400">Break Glass: <strong className={modalData.breakGlass ? 'text-amber-400' : 'text-slate-500'}>{modalData.breakGlass ? 'Yes' : 'No'}</strong></p>
                </>
              )}
              {modalData._type === 'chain' && (
                <>
                  <p className="text-slate-400">Chain ID: <strong className="text-cyan-300">{modalData.id}</strong></p>
                  <p className="text-slate-400">Title: <strong className="text-slate-200">{modalData.title}</strong></p>
                  <p className="text-slate-400">Status: <strong className={modalData.status === 'COMPLETE' ? 'text-emerald-400' : 'text-amber-400'}>{modalData.status.replace('_', ' ')}</strong></p>
                  <p className="text-slate-400">Links: <strong className="text-slate-200">{modalData.links}</strong></p>
                  <p className="text-slate-400">Chain Integrity: <strong className="text-cyan-300">{modalData.chainIntegrity}%</strong></p>
                  <p className="text-slate-400">Tamper Score: <strong className={modalData.tamperScore > 0 ? 'text-amber-400' : 'text-emerald-400'}>{modalData.tamperScore}</strong></p>
                  <p className="text-slate-400">Merkle Root: <strong className="text-slate-200 font-mono">{modalData.merkleRoot}</strong></p>
                  <p className="text-slate-400">Root Hash: <strong className="text-slate-200 font-mono">{modalData.rootHash}</strong></p>
                  <p className="text-slate-400">Last Verified: <strong className="text-slate-200">{modalData.lastVerified}</strong></p>
                  <p className="text-slate-400">Linked Assertions:</p>
                  <ul className="ml-4 space-y-1">{modalData.linkedAssertions?.map((a, i) => <li key={i} className="text-cyan-300">• {a}</li>)}</ul>
                </>
              )}
              {modalData._type === 'framework' && (
                <>
                  <p className="text-slate-400">Framework: <strong className="text-violet-300">{modalData.name}</strong></p>
                  <p className="text-slate-400">Code: <strong className="text-slate-200">{modalData.code}</strong></p>
                  <p className="text-slate-400">Status: <strong className="text-emerald-400">{modalData.status}</strong></p>
                  <p className="text-slate-400">Score: <strong className="text-indigo-300">{modalData.score}/100</strong></p>
                  <p className="text-slate-400">Last Audit: <strong className="text-slate-200">{modalData.lastAudit}</strong></p>
                  <p className="text-slate-400">Next Audit: <strong className="text-slate-200">{modalData.nextAudit}</strong></p>
                  <p className="text-slate-400">Open Findings: <strong className={modalData.findings > 0 ? 'text-amber-400' : 'text-emerald-400'}>{modalData.findings}</strong></p>
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

export default ComplianceProvenanceLedgerHub;

import React, { useState, useEffect, useMemo } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  Key,
  Fingerprint,
  Radio,
  Wifi,
  Server,
  Terminal,
  Activity,
  AlertTriangle,
  Zap,
  Gauge,
  Sliders,
  FileText,
  Download,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  User,
  Users,
  Eye,
  Layers,
  ChevronRight,
  Siren,
  X,
  Plus,
  Play,
  Pause,
  Flame,
  Award,
  Cpu,
  RefreshCw,
  FileSpreadsheet
} from "lucide-react";
import { downloadCsv } from "../../utils/csv";
import { useKindToasts, KindToastTray } from "../../components/common/HubToasts";
import { DetailRow as Row, AlertStatCard as StatCard, MiniStat as Vital } from "../../components/common/HubCards";

const SEED_SECURITY_IDENTITIES = [
  {
    id: "SEC-ID-301",
    principal: "dr.sarah.connor@medtrack.org",
    role: "Attending Cardiothoracic Surgeon / Privileged EHR",
    department: "Surgical Suites & Hybrid Cath Lab",
    device: "Encrypted iOS iPad Pro (EPIC Canto / MDM Verified)",
    ipAddress: "10.240.18.42 (Internal Medical VLAN 104)",
    riskScore: 12.4, // Low Risk
    authFactors: ["FIDO2 WebAuthn Passkey", "Hardware YubiKey 5Ci", "Location Geofence"],
    accessScope: "EHR_FULL_CHART + SURGICAL_ROBOTICS_TELEMETRY",
    microsegmentation: "ENCLAVE_OR_SUITE_04",
    lastHeartbeat: "2026-08-20 03:08:45",
    encryptionStatus: "TLS 1.3 + Quantum-Resistant ML-KEM-768 Enclave",
    status: "TRUSTED",
    anomalies: []
  },
  {
    id: "SEC-ID-302",
    principal: "svc-telemetry-pump-gateway@medtrack.internal",
    role: "Automated Med-Pump Telemetry Ingestion Service Account",
    department: "Biomedical Engineering IoT Network",
    device: "Linux Edge Gateway (TPM 2.0 Attested / Secure Boot)",
    ipAddress: "10.120.4.110 (IoT Isolated Segment)",
    riskScore: 84.6, // Critical Risk Anomaly
    authFactors: ["mTLS Certificate (X.509)", "SPIFFE / SPIRE Workload ID"],
    accessScope: "DEVICE_TELEMETRY_WRITE",
    microsegmentation: "ISOLATION_QUARANTINE_CELL",
    lastHeartbeat: "2026-08-20 03:09:12",
    encryptionStatus: "mTLS Mutual Auth",
    status: "COMPROMISE_SUSPECTED",
    anomalies: [
      "Impossible Travel / Geo-velocity jump from Chicago to Eastern Europe in 4 mins",
      "Attempted unauthorized privilege escalation to EHR Master Patient Index"
    ]
  },
  {
    id: "SEC-ID-303",
    principal: "nurse.marcus.vance@medtrack.org",
    role: "PICU Senior Staff Nurse",
    department: "Pediatric Intensive Care Unit",
    device: "Hospital Workstation (ThinClient Zebra TC52-HC)",
    ipAddress: "10.240.22.18 (PICU Wi-Fi 6E SSID: MedSecure)",
    riskScore: 32.0, // Mild Warning
    authFactors: ["Smart Card (PIV-I)", "Biometric Facial Recognition"],
    accessScope: "PICU_MED_ADMIN + MAR_RECORDING",
    microsegmentation: "ENCLAVE_PICU_POD_02",
    lastHeartbeat: "2026-08-20 03:07:30",
    encryptionStatus: "AES-256-GCM Session",
    status: "ELEVATED_MONITORING",
    anomalies: [
      "Accessing high-alert narcotic dispense record outside scheduled shift window"
    ]
  },
  {
    id: "SEC-ID-304",
    principal: "external.radiology.consultant@telerad-global.net",
    role: "Remote PACS Diagnostic Reader",
    department: "Teleradiology Diagnostic Group",
    device: "External macOS Workstation (CrowdStrike Falcon Verified)",
    ipAddress: "198.51.100.89 (ZTNA App Connector Enclave)",
    riskScore: 18.5,
    authFactors: ["Push MFA with Number Matching", "Device Health Attestation"],
    accessScope: "DICOM_VIEW_ONLY (Watermarked)",
    microsegmentation: "ENCLAVE_PACS_REMOTE_DMZ",
    lastHeartbeat: "2026-08-20 03:06:15",
    encryptionStatus: "WireGuard ZTNA Tunnel",
    status: "TRUSTED",
    anomalies: []
  }
];

export default function EnterpriseZeroTrustSecurityGovernancePage() {
  const { toasts, toast } = useKindToasts();
  const [identities, setIdentities] = useState(SEED_SECURITY_IDENTITIES);
  const [selectedId, setSelectedId] = useState(SEED_SECURITY_IDENTITIES[0].id);
  const [activeTab, setActiveTab] = useState("overview"); // overview, microseg, crypto, simulator, response
  const [isLiveMonitor, setIsLiveMonitor] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTrust, setFilterTrust] = useState("ALL");
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [incidentModal, setIncidentModal] = useState(null);

  // Dynamic Simulator State
  const [simPostureAnomaly, setSimPostureAnomaly] = useState(15);
  const [simGeoRisk, setSimGeoRisk] = useState(10);
  const [simPrivilegeElev, setSimPrivilegeElev] = useState(20);
  const [simUnknownEndpoint, setSimUnknownEndpoint] = useState(false);

  const selectedIdentity = useMemo(() => {
    return identities.find((i) => i.id === selectedId) || identities[0];
  }, [identities, selectedId]);

  // Live heartbeats simulator
  useEffect(() => {
    if (!isLiveMonitor) return;
    const interval = setInterval(() => {
      setIdentities((prev) =>
        prev.map((ident) => {
          const delta = (Math.random() * 2 - 1);
          return {
            ...ident,
            riskScore: Number(Math.max(1, Math.min(99, ident.riskScore + delta)).toFixed(1))
          };
        })
      );
    }, 3000);
    return () => clearInterval(interval);
  }, [isLiveMonitor]);

  // Filtered identities
  const filteredIdentities = useMemo(() => {
    return identities.filter((i) => {
      const matchesSearch =
        i.principal.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.department.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTrust =
        filterTrust === "ALL" ||
        (filterTrust === "TRUSTED" && i.status === "TRUSTED") ||
        (filterTrust === "ALERT" && i.status.includes("COMPROMISE")) ||
        (filterTrust === "ELEVATED" && i.status.includes("ELEVATED"));
      return matchesSearch && matchesTrust;
    });
  }, [identities, searchQuery, filterTrust]);

  // Simulated Risk Calculation
  const computedSimulatedRisk = useMemo(() => {
    let score = simPostureAnomaly * 0.30 + simGeoRisk * 0.25 + simPrivilegeElev * 0.25;
    if (simUnknownEndpoint) score += 35;
    return Number(Math.min(100, score).toFixed(1));
  }, [simPostureAnomaly, simGeoRisk, simPrivilegeElev, simUnknownEndpoint]);

  const handleExportCsv = () => {
    const headers = [
      "Identity ID",
      "Principal Email / Name",
      "Assigned Role",
      "Department",
      "Device Posture",
      "IP Address",
      "Dynamic Risk Score",
      "Authentication Factors",
      "Microsegmentation Enclave",
      "Trust Status"
    ];
    const rows = identities.map((i) => [
      i.id,
      i.principal,
      i.role,
      i.department,
      i.device,
      i.ipAddress,
      i.riskScore,
      i.authFactors.join("; "),
      i.microsegmentation,
      i.status
    ]);
    downloadCsv("zero_trust_security_audit_manifest.csv", headers, rows);
    toast.success("Zero-Trust Security & Identity Manifest exported to CSV.");
  };

  const triggerSecurityContainment = (actionName) => {
    setIncidentModal(actionName);
    toast.error(`SECURITY INTERLOCK: ${actionName} applied to ${selectedIdentity.principal}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 font-sans">
      <KindToastTray toasts={toasts} />

      {/* HEADER COMMAND BAR */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 shadow-lg shadow-cyan-950/50">
              <Lock className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                Enterprise Zero-Trust Clinical Security Guard
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/40 text-cyan-300 font-semibold tracking-normal uppercase">
                  NIST SP 800-207 / HIPAA / ML-KEM-768
                </span>
              </h1>
              <p className="text-sm text-slate-400">
                Continuous identity verification, microsegmentation blast-radius containment, post-quantum cryptographic enclaves, and adaptive clinical privilege authorization.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-stretch md:self-auto justify-end">
          <button
            onClick={() => setIsLiveMonitor(!isLiveMonitor)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all border ${
              isLiveMonitor
                ? "bg-rose-950/60 border-rose-500/40 text-rose-300 hover:bg-rose-900/60"
                : "bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800"
            }`}
          >
            {isLiveMonitor ? <Pause className="w-3.5 h-3.5 animate-pulse" /> : <Play className="w-3.5 h-3.5" />}
            {isLiveMonitor ? "ZTNA TELEMETRY ACTIVE" : "MONITOR PAUSED"}
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold bg-slate-900 border border-slate-700 text-slate-200 hover:bg-slate-800 transition-all"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            EXPORT CSV
          </button>

          <button
            onClick={() => triggerSecurityContainment("IMMEDIATE IDENTITY REVOCATION & SESSION KILL")}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-extrabold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950 transition-all"
          >
            <Siren className="w-4 h-4 animate-bounce" />
            KILL SESSION
          </button>
        </div>
      </div>

      {/* QUICK STATS HEADER */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
        <StatCard icon={Users} label="Monitored Principals" value={`${identities.length} Active`} subtext="100% ZTNA Gated" color="cyan" />
        <StatCard icon={ShieldAlert} label="High Risk / Compromised" value={identities.filter((i) => i.riskScore >= 70).length.toString()} subtext="Quarantined" color="rose" />
        <StatCard icon={Fingerprint} label="Hardware FIDO2 Auth" value="100% Active" subtext="Phish-Proof MFA" color="emerald" />
        <StatCard icon={Lock} label="Post-Quantum Enclaves" value="ML-KEM-768" subtext="NIST PQC Ready" color="purple" />
        <StatCard icon={Server} label="Microsegmented Zones" value="14 Isolated" subtext="Blast Radius < 5%" color="indigo" />
        <StatCard icon={ShieldCheck} label="HIPAA Security Rule" value="100% Compliant" subtext="FDA 21 CFR Pt 11" color="amber" />
      </div>

      {/* MAIN WORKSPACE GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* LEFT COLUMN: IDENTITY LIST */}
        <div className="xl:col-span-4 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between gap-2 mb-3">
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                Active Clinical Sessions ({filteredIdentities.length})
              </h2>
              <span className="text-xs text-slate-500 font-mono">Live ZTNA Stream</span>
            </div>

            {/* SEARCH & FILTERS */}
            <div className="space-y-2 mb-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search principal, role, device..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {["ALL", "TRUSTED", "ALERT", "ELEVATED"].map((flt) => (
                  <button
                    key={flt}
                    onClick={() => setFilterTrust(flt)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                      filterTrust === flt
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50"
                        : "bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200"
                    }`}
                  >
                    {flt}
                  </button>
                ))}
              </div>
            </div>

            {/* IDENTITY LIST */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {filteredIdentities.map((i) => {
                const isSelected = i.id === selectedIdentity.id;
                const isCrit = i.riskScore >= 70;
                return (
                  <div
                    key={i.id}
                    onClick={() => setSelectedId(i.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-slate-800/90 border-cyan-500/60 shadow-lg shadow-cyan-950/30 ring-1 ring-cyan-500/30"
                        : "bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/40 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-100">{i.principal.split("@")[0]}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-cyan-400">
                            {i.id}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-1">{i.role}</p>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          isCrit
                            ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                            : i.status === "ELEVATED_MONITORING"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                            : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        }`}
                      >
                        Risk {i.riskScore}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1 pt-2 border-t border-slate-800/80 text-center text-[10px]">
                      <div className="bg-slate-900/60 rounded p-1">
                        <span className="text-slate-500 block">Enclave</span>
                        <span className="font-bold text-slate-300 truncate block">{i.microsegmentation.split("_")[1] || "ZONE"}</span>
                      </div>
                      <div className="bg-slate-900/60 rounded p-1">
                        <span className="text-slate-500 block">IP Addr</span>
                        <span className="font-mono text-cyan-300 truncate block">{i.ipAddress.split(" ")[0]}</span>
                      </div>
                      <div className="bg-slate-900/60 rounded p-1">
                        <span className="text-slate-500 block">Trust</span>
                        <span className={`font-bold ${isCrit ? "text-rose-400" : "text-emerald-400"}`}>{i.status.split("_")[0]}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: DETAILED SECURITY CONSOLE */}
        <div className="xl:col-span-8 space-y-4">
          <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-xl md:text-2xl font-black text-white">{selectedIdentity.principal}</span>
                  <span className="text-xs px-2.5 py-1 rounded-md bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-mono font-bold">
                    {selectedIdentity.id}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-3 flex-wrap">
                  <span>Role: <b className="text-slate-200">{selectedIdentity.role}</b></span>
                  <span>•</span>
                  <span>Dept: <b className="text-slate-200">{selectedIdentity.department}</b></span>
                  <span>•</span>
                  <span>Device: <b className="text-cyan-400">{selectedIdentity.device}</b></span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setInspectModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/40 flex items-center gap-1.5 transition-all shadow-lg"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Full Security Dossier
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 mt-5 pt-4 border-t border-slate-800/80">
              <Vital label="Adaptive Risk Score" value={selectedIdentity.riskScore.toString()} status={selectedIdentity.riskScore >= 70 ? "critical" : "normal"} />
              <Vital label="FIDO2 Phish-Proof" value="Verified" status="normal" />
              <Vital label="Crypto Enclave" value="Quantum-Safe" status="normal" />
              <Vital label="Microsegment" value="Active" status="normal" />
              <Vital label="Session Health" value="Attested" status="normal" />
              <Vital label="NIST SP 800-207" value="Compliant" status="normal" />
            </div>
          </div>

          <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
            {[
              { id: "overview", label: "Identity & Device Posture", icon: Fingerprint },
              { id: "microseg", label: "Microsegmentation & Blast Radius", icon: Layers },
              { id: "crypto", label: "Post-Quantum Cryptography Enclave", icon: Lock },
              { id: "simulator", label: "Continuous Risk Score Workbench", icon: Sliders },
              { id: "response", label: "Automated Incident Containment", icon: Siren }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-md shadow-cyan-950/40"
                      : "bg-slate-900/60 text-slate-400 border border-slate-800/80 hover:text-slate-200 hover:bg-slate-800/60"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {activeTab === "overview" && (
            <div className="space-y-4">
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
                <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Fingerprint className="w-4 h-4 text-cyan-400" />
                    Continuous Multi-Factor Authentication & Device Signals
                  </span>
                  <span className="text-[11px] font-mono text-cyan-400 font-semibold">{selectedIdentity.lastHeartbeat}</span>
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-400">Authenticated Factors:</span>
                    <span className="font-semibold text-emerald-400">{selectedIdentity.authFactors.join(" • ")}</span>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-400">Granular Access Scope:</span>
                    <span className="font-mono font-bold text-cyan-300">{selectedIdentity.accessScope}</span>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-400">Cryptographic Protocol:</span>
                    <span className="font-mono text-purple-300">{selectedIdentity.encryptionStatus}</span>
                  </div>
                </div>
              </div>

              {selectedIdentity.anomalies.length > 0 && (
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
                  <h3 className="text-sm font-bold text-rose-400 mb-3 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4" />
                    Real-Time Threat Detection & Behavioral Anomalies
                  </h3>
                  <div className="space-y-2">
                    {selectedIdentity.anomalies.map((anom, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-2.5 rounded-lg bg-rose-950/30 border border-rose-500/30 text-xs text-rose-200">
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>{anom}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "microseg" && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-purple-400" />
                Microsegmentation & Blast-Radius Containment
              </h3>
              <p className="text-xs text-slate-400">
                Workloads and clinical data streams are strictly isolated into ephemeral microsegments. Lateral movement is mathematically constrained.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="font-bold text-purple-400 block">Assigned Isolation Zone</span>
                  <span className="text-sm font-mono font-bold text-white block">{selectedIdentity.microsegmentation}</span>
                  <p className="text-slate-400 text-[11px]">Strict east-west firewall rules enforce zero communication with unauthorized medical database enclaves.</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="font-bold text-emerald-400 block">Blast Radius Assessment</span>
                  <span className="text-sm font-mono font-bold text-emerald-300 block">&lt; 0.5% Hospital Subsystem Scope</span>
                  <p className="text-slate-400 text-[11px]">Any identity compromise is immediately walled off within the isolated container sandbox.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "crypto" && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-cyan-400" />
                Post-Quantum Cryptography & Attestation
              </h3>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Key Encapsulation Mechanism (KEM):</span>
                  <span className="font-mono font-bold text-cyan-300">NIST FIPS 203 (ML-KEM-768 / Kyber)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Digital Signature Algorithm:</span>
                  <span className="font-mono font-bold text-purple-300">NIST FIPS 204 (ML-DSA-65 / Dilithium)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Hardware Root of Trust:</span>
                  <span className="font-semibold text-emerald-300">TPM 2.0 / Apple Secure Enclave Attested</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "simulator" && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-cyan-400" />
                  Real-Time Contextual Risk Engine Workbench
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Simulate dynamic threat factors to evaluate automated zero-trust policy enforcement.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Device & Location Factors</h4>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Device Posture Anomaly: {simPostureAnomaly}%</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={simPostureAnomaly}
                      onChange={(e) => setSimPostureAnomaly(parseInt(e.target.value))}
                      className="w-full accent-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Geo-Velocity Inconsistency: {simGeoRisk}%</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={simGeoRisk}
                      onChange={(e) => setSimGeoRisk(parseInt(e.target.value))}
                      className="w-full accent-cyan-400"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider">Privilege & Network</h4>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Privilege Elevation Factor: {simPrivilegeElev}%</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={simPrivilegeElev}
                      onChange={(e) => setSimPrivilegeElev(parseInt(e.target.value))}
                      className="w-full accent-purple-400"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="unknownEp"
                      checked={simUnknownEndpoint}
                      onChange={(e) => setSimUnknownEndpoint(e.target.checked)}
                      className="rounded accent-cyan-400"
                    />
                    <label htmlFor="unknownEp" className="text-xs text-slate-300">Untrusted / Unknown Network Segment (+35 Risk)</label>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">Simulated Policy Decision</h4>
                    <div className="space-y-2 text-xs">
                      <div className="p-2 rounded bg-slate-900 border border-slate-800 flex justify-between">
                        <span className="text-slate-400">Total Computed Risk:</span>
                        <span className={`font-mono font-bold ${computedSimulatedRisk >= 70 ? "text-rose-400" : "text-cyan-300"}`}>
                          {computedSimulatedRisk} / 100
                        </span>
                      </div>
                      <div className="p-2 rounded bg-slate-900 border border-slate-800 flex justify-between">
                        <span className="text-slate-400">Enforcement Action:</span>
                        <span className="font-bold text-rose-300">
                          {computedSimulatedRisk >= 70 ? "STEP-UP MFA & ISOLATE" : "ALLOW ACCESS"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => toast.success("Simulated security policy parameters tested successfully.")}
                    className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg text-xs transition-all shadow-md mt-4"
                  >
                    Apply Test Policy
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "response" && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
              <h3 className="text-sm font-bold text-rose-400 flex items-center gap-2">
                <Siren className="w-4 h-4" />
                Automated Incident Containment Playbooks
              </h3>
              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white block">Immediate Session Kill & Credential Invalidation</span>
                    <span className="text-slate-400">Terminates active WebSocket session, flushes OAuth tokens, and revokes Kerberos ticket.</span>
                  </div>
                  <button
                    onClick={() => triggerSecurityContainment("SESSION KILL & CREDENTIAL FLUSH")}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold"
                  >
                    Execute Kill
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white block">Microsegmentation Firewall Quarantine</span>
                    <span className="text-slate-400">Isolates workstation into a honeynet honeypot inspection sandbox.</span>
                  </div>
                  <button
                    onClick={() => triggerSecurityContainment("WORKSTATION HONEYNET QUARANTINE")}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold"
                  >
                    Execute Quarantine
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {inspectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setInspectModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Full Zero-Trust Dossier: {selectedIdentity.principal}</h2>
                <p className="text-xs text-slate-400">ID: {selectedIdentity.id} | Enclave: {selectedIdentity.microsegmentation}</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <Row label="Principal Role" value={selectedIdentity.role} />
              <Row label="Assigned Department" value={selectedIdentity.department} />
              <Row label="Hardware Device" value={selectedIdentity.device} />
              <Row label="IP Address & VLAN" value={selectedIdentity.ipAddress} />
              <Row label="Continuous Risk Score" value={`${selectedIdentity.riskScore} / 100`} />
              <Row label="Access Scope" value={selectedIdentity.accessScope} />
              <Row label="Encryption Enclave" value={selectedIdentity.encryptionStatus} />
              <Row label="Last Telemetry Attestation" value={selectedIdentity.lastHeartbeat} />
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setInspectModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-all"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {incidentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-rose-950/90 border border-rose-500/60 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative text-rose-100">
            <button
              onClick={() => setIncidentModal(null)}
              className="absolute top-4 right-4 text-rose-300 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <Siren className="w-8 h-8 text-rose-400 animate-bounce" />
              <div>
                <h2 className="text-xl font-black text-white">{incidentModal}</h2>
                <p className="text-xs text-rose-200">Principal: {selectedIdentity.principal}</p>
              </div>
            </div>
            <p className="text-sm text-rose-100 mb-4">
              Zero-trust continuous policy interlock applied. Access tokens revoked and SIEM audit log generated.
            </p>
            <div className="p-3 bg-black/40 rounded-xl border border-rose-500/30 text-xs space-y-2 mb-6">
              <div>• Session ID: <b>{selectedIdentity.id}</b></div>
              <div>• Dynamic Risk Score: <b>{selectedIdentity.riskScore}</b></div>
              <div>• IP Address: <b>{selectedIdentity.ipAddress}</b></div>
            </div>
            <button
              onClick={() => {
                toast.success(`Interlock ${incidentModal} executed successfully.`);
                setIncidentModal(null);
              }}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold rounded-xl text-xs transition-all shadow-lg"
            >
              Acknowledge & Confirm Interlock
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

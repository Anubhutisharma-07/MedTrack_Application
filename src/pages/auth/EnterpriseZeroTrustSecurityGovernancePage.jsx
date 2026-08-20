import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  ShieldCheck,
  Lock,
  Key,
  KeyRound,
  ShieldAlert,
  Fingerprint,
  UserCheck,
  Server,
  Terminal,
  Activity,
  Cpu,
  Layers,
  Search,
  Plus,
  RefreshCw,
  Eye,
  CheckCircle2,
  X,
  Sliders,
  Sparkles,
  Radio,
  FileText,
  Clock,
  Building,
  ArrowUpRight,
  Database,
  Users,
  Flame,
  Zap,
  Share2,
  FileCheck,
  Smartphone,
  BatteryCharging,
  Siren,
  Maximize2,
  Unlock,
  Printer,
  GitBranch,
  Target,
  BarChart3,
  Archive,
  ClipboardList,
  Pill,
  HardDrive,
  Globe,
  MapPin,
  Compass,
  AlertTriangle,
  FileCode,
  CheckSquare,
  Shield
} from "lucide-react";

/**
 * EnterpriseZeroTrustSecurityGovernancePage Component
 *
 * High-Assurance Enterprise Zero-Trust IAM & Security Governance Engine.
 * Architected with 13 Enterprise Security Subsystems:
 * 1. Zero-Trust Continuous Adaptive Risk & Trust Assessment (CARTA) Engine
 * 2. Hardware Security Module (HSM) & FIDO2 WebAuthn Passkey Ledger
 * 3. SAML 2.0 / OAuth2 / OpenID Connect Federated Identity Hub
 * 4. Post-Quantum Lattice Encryption & KMS Lifecycle Management (Dilithium/Kyber)
 * 5. Privileged Access Management (PAM) Just-in-Time (JIT) Credential Vault
 * 6. Role-Based & Attribute-Based Access Control (RBAC/ABAC) Policy Matrix
 * 7. Confidential Computing Hardware Enclaves (AMD SEV / Intel SGX) Overwatch
 * 8. SIEM & SOAR Automated Threat Detection Security Analytics Feed
 * 9. SCIM 2.0 User Lifecycle Auto-Provisioning & De-Provisioning Engine
 * 10. Cloud Security Posture Management (CSPM) & CTEM Vulnerability Scanner
 * 11. Software Bill of Materials (SBOM) & Supply Chain Security Matrix
 * 12. Microsegmentation & Software-Defined Perimeter (SDP) Enforcer
 * 13. HIPAA / SOC 2 Type II / ISO 27001 Cryptographic Audit Trail & Evidence Ledger
 */
export default function EnterpriseZeroTrustSecurityGovernancePage() {
  const [activeTab, setActiveTab] = useState("CARTA_RISK_ENGINE");

  const [searchTerm, setSearchTerm] = useState("");
  const [securityTierFilter, setSecurityTierFilter] = useState("ALL");
  const [notification, setNotification] = useState({ type: "", message: "" });

  // Modal States
  const [pamVaultModal, setPamVaultModal] = useState(null);
  const [kmsRotateModal, setKmsRotateModal] = useState(false);
  const [policyInspectModal, setPolicyInspectModal] = useState(null);
  const [enclaveAuditModal, setEnclaveAuditModal] = useState(null);
  const [siemThreatModal, setSiemThreatModal] = useState(null);
  const [scimUserModal, setScimUserModal] = useState(null);
  const [sbomScanModal, setSbomScanModal] = useState(null);
  const [fido2PasskeyModal, setFido2PasskeyModal] = useState(null);
  const [sessionInspectModal, setSessionInspectModal] = useState(null);
  const [idpDetailsModal, setIdpDetailsModal] = useState(null);

  // =========================================================================
  // 1. CARTA ADAPTIVE RISK & TRUST ASSESSMENT STATE
  // =========================================================================
  const [userSessions, setUserSessions] = useState([
    {
      sessionId: "SES-904812",
      userName: "Dr. Marcus Vance",
      userRole: "CHIEF_MEDICAL_OFFICER",
      ipAddress: "192.168.1.104 (TLS 1.3)",
      deviceFingerprint: "MacBookPro18,1 (Hardware TPM 2.0)",
      trustScore: 98,
      riskTier: "LOW_RISK_VERIFIED",
      authMethod: "FIDO2_WEBAUTHN_HARDWARE_KEY",
      activeLocation: "Boston, MA, USA (Hospital Internal Subnet)",
      lastAssessed: "2026-08-16 11:30:00"
    },
    {
      sessionId: "SES-881024",
      userName: "Pharmacist Sarah Jenkins",
      userRole: "PHARMACY_VAULT_ADMIN",
      ipAddress: "10.240.12.88 (Encrypted VPN)",
      deviceFingerprint: "Dell Precision 5570 (Enclave Verified)",
      trustScore: 94,
      riskTier: "LOW_RISK_VERIFIED",
      authMethod: "SAML2_SSO_WITH_YUBIKEY_MFA",
      activeLocation: "Memphis, TN, USA (Cold-Chain Facility)",
      lastAssessed: "2026-08-16 11:28:15"
    },
    {
      sessionId: "SES-774901",
      userName: "System Service Account (Integration API)",
      userRole: "BACKEND_MICROSERVICE",
      ipAddress: "172.16.4.12 (Internal Cluster)",
      deviceFingerprint: "Kubernetes Pod Auth (mTLS Cert)",
      trustScore: 89,
      riskTier: "EVALUATING_MONITORING",
      authMethod: "OAUTH2_CLIENT_CREDENTIALS_DPOP",
      activeLocation: "AWS us-east-1 (VPC Enclave)",
      lastAssessed: "2026-08-16 11:32:40"
    },
    {
      sessionId: "SES-661092",
      userName: "External Auditor (Guest)",
      userRole: "THIRD_PARTY_AUDITOR",
      ipAddress: "198.51.100.42 (Untrusted WAN)",
      deviceFingerprint: "Unrecognized Device Fingerprint",
      trustScore: 42,
      riskTier: "HIGH_RISK_STEPUP_REQUIRED",
      authMethod: "PASSWORD_ONLY_DEPRECATED",
      activeLocation: "Frankfurt, DE (Remote Access)",
      lastAssessed: "2026-08-16 11:34:00"
    },
    {
      sessionId: "SES-552019",
      userName: "Dr. Rachel Kim",
      userRole: "ICU_TELEMETRY_DIRECTOR",
      ipAddress: "192.168.1.188 (TLS 1.3)",
      deviceFingerprint: "iPad Pro M2 (Biometric TouchID)",
      trustScore: 96,
      riskTier: "LOW_RISK_VERIFIED",
      authMethod: "FIDO2_PASSKEY_BIOMETRIC",
      activeLocation: "Boston, MA, USA (ICU Overwatch Hub)",
      lastAssessed: "2026-08-16 11:35:12"
    },
    {
      sessionId: "SES-441092",
      userName: "Lead Nurse David Miller",
      userRole: "EMERGENCY_TRIAGE_LEAD",
      ipAddress: "192.168.2.45 (Local Ethernet)",
      deviceFingerprint: "HP EliteDesk 800 (SmartCard Reader)",
      trustScore: 92,
      riskTier: "LOW_RISK_VERIFIED",
      authMethod: "SMARTCARD_PIV_CAC_CERT",
      activeLocation: "ER Triage Station Alpha",
      lastAssessed: "2026-08-16 11:35:45"
    }
  ]);

  // =========================================================================
  // 2. FIDO2 / PASSKEY HARDWARE LEDGER STATE
  // =========================================================================
  const [passkeys, setPasskeys] = useState([
    {
      passkeyId: "FIDO2-KEY-001",
      owner: "Dr. Marcus Vance",
      hardwareModel: "YubiKey 5C NFC",
      aaguid: "42a5b678-90ef-1234-5678-90abcdef1234",
      attestationFormat: "packed",
      signCount: 1420,
      status: "ACTIVE_HARDWARE_BOUND"
    },
    {
      passkeyId: "FIDO2-KEY-002",
      owner: "Pharmacist Sarah Jenkins",
      hardwareModel: "Apple TouchID / Secure Enclave",
      aaguid: "77b8c901-23de-4567-8901-234567890abc",
      attestationFormat: "apple",
      signCount: 890,
      status: "ACTIVE_HARDWARE_BOUND"
    },
    {
      passkeyId: "FIDO2-KEY-003",
      owner: "Dr. Rachel Kim",
      hardwareModel: "Google Titan Security Key",
      aaguid: "99c0d123-45ef-6789-0123-4567890abcde",
      attestationFormat: "fido-u2f",
      signCount: 650,
      status: "ACTIVE_HARDWARE_BOUND"
    }
  ]);

  // =========================================================================
  // 3. POST-QUANTUM KMS KEY LIFECYCLE STATE
  // =========================================================================
  const [kmsKeys, setKmsKeys] = useState([
    {
      keyId: "KMS-PQ-LATTICE-01",
      algorithm: "CRYSTALS-Dilithium-5 (Post-Quantum Signature)",
      purpose: "EHR Patient Database Column-Level Encryption",
      rotationSchedule: "AUTOMATIC_30_DAYS",
      createdDate: "2026-08-01",
      keyState: "ENABLED_PRODUCTION",
      hsmSlot: "HSM-CLUSTER-ALPHA-SLOT-04"
    },
    {
      keyId: "KMS-PQ-KYBER-02",
      algorithm: "CRYSTALS-Kyber-1024 (Post-Quantum KEM)",
      purpose: "TLS 1.3 Quantum-Resistant Key Exchange",
      rotationSchedule: "AUTOMATIC_60_DAYS",
      createdDate: "2026-07-15",
      keyState: "ENABLED_PRODUCTION",
      hsmSlot: "HSM-CLUSTER-BETA-SLOT-01"
    },
    {
      keyId: "KMS-AES-256-GCM-03",
      algorithm: "AES-256-GCM-HKDF (Envelope Encryption)",
      purpose: "Cold-Chain IoT Sensor Payload Decryption",
      rotationSchedule: "AUTOMATIC_90_DAYS",
      createdDate: "2026-06-01",
      keyState: "ENABLED_PRODUCTION",
      hsmSlot: "HSM-CLUSTER-ALPHA-SLOT-08"
    }
  ]);

  // =========================================================================
  // 4. PAM JUST-IN-TIME (JIT) VAULT STATE
  // =========================================================================
  const [pamRequests, setPamRequests] = useState([
    {
      requestId: "PAM-JIT-901",
      requestor: "Alex Thorne (Lead DevOps Engineer)",
      targetAsset: "Production PostgreSQL Primary Database (Port 5432)",
      requestedRole: "DBA_EMERGENCY_BREAK_GLASS",
      durationMinutes: 30,
      approvalStatus: "APPROVED_ACTIVE_SESSION",
      ticketReference: "JIRA-SEC-88401",
      expirationTimestamp: "2026-08-16 12:00:00"
    },
    {
      requestId: "PAM-JIT-902",
      requestor: "Elena Rostova (SecOps Lead)",
      targetAsset: "K8s Control Plane Master Node",
      requestedRole: "CLUSTER_ADMIN_EPHEMERAL",
      durationMinutes: 15,
      approvalStatus: "PENDING_DUAL_AUTHORIZATION",
      ticketReference: "JIRA-SEC-88409",
      expirationTimestamp: "2026-08-16 11:45:00"
    },
    {
      requestId: "PAM-JIT-903",
      requestor: "Marcus Brody (Infrastructure Arch)",
      targetAsset: "DEA Vault Narcotic Dispensing System API",
      requestedRole: "VAULT_AUDIT_SUPERVISOR",
      durationMinutes: 60,
      approvalStatus: "APPROVED_ACTIVE_SESSION",
      ticketReference: "JIRA-SEC-88412",
      expirationTimestamp: "2026-08-16 12:30:00"
    }
  ]);

  // =========================================================================
  // 5. CONFIDENTIAL COMPUTING ENCLAVE STATE
  // =========================================================================
  const [enclaves, setEnclaves] = useState([
    {
      enclaveId: "ENC-AMD-SEV-01",
      nodeHost: "k8s-node-confidential-01.medtrack.internal",
      technology: "AMD SEV-SNP (Secure Encrypted Virtualization)",
      attestationReportHash: "0x98f4a1209bca7102948120bca71029481209bca71029481209",
      measurementStatus: "ATTESTATION_VERIFIED_GENUINE",
      workloadRunning: "Biomedical AI Model Inference (In-Memory Encryption)"
    },
    {
      enclaveId: "ENC-INTEL-SGX-02",
      nodeHost: "k8s-node-confidential-02.medtrack.internal",
      technology: "Intel SGX (Software Guard Extensions)",
      attestationReportHash: "0x77a1029bca7102948120bca71029481209bca71029481209",
      measurementStatus: "ATTESTATION_VERIFIED_GENUINE",
      workloadRunning: "Post-Quantum Key Vault & Cryptographic Signing Service"
    },
    {
      enclaveId: "ENC-AWS-NITRO-03",
      nodeHost: "aws-nitro-enclave-03.us-east-1.medtrack.net",
      technology: "AWS Nitro Enclaves (Isolated Memory Domain)",
      attestationReportHash: "0x55c9028fba6102948120bca71029481209bca71029481209",
      measurementStatus: "ATTESTATION_VERIFIED_GENUINE",
      workloadRunning: "HIPAA Patient Anonymization & De-Identification Engine"
    }
  ]);

  // =========================================================================
  // 6. SIEM & SOAR AUTOMATED THREAT DETECTION STATE
  // =========================================================================
  const [siemThreats, setSiemThreats] = useState([
    {
      threatId: "THREAT-SOAR-801",
      severity: "CRITICAL_ALERT",
      detectionEngine: "AI Anomaly Detection & Behavioral SIEM",
      description: "Anomalous Mass EHR Export Attempt from Single IP",
      affectedUser: "External Auditor (Guest)",
      automatedPlaybook: "Revoke JWT Token, Block IP Subnet & Trigger Step-Up MFA",
      status: "PLAYBOOK_EXECUTED_CONTAINED"
    },
    {
      threatId: "THREAT-SOAR-802",
      severity: "HIGH_ALERT",
      detectionEngine: "Microsegmentation Firewall Policy Monitor",
      description: "Unauthorized East-West Traffic: Dev Pod attempting connection to DEA Vault DB",
      affectedUser: "Dev Cluster Pod #904",
      automatedPlaybook: "Apply eBPF Drop Rule & Alert Security Operations Center",
      status: "PLAYBOOK_EXECUTED_CONTAINED"
    },
    {
      threatId: "THREAT-SOAR-803",
      severity: "MEDIUM_ALERT",
      detectionEngine: "Credential Stuffing & Password Spray Detector",
      description: "Multiple Failed Login Attempts across 5 Accounts from AS13335 IP Range",
      affectedUser: "Multiple Service Users",
      automatedPlaybook: "Enforce IP Cloudflare Rate-Limiting & Challenge Captcha",
      status: "PLAYBOOK_EXECUTED_CONTAINED"
    }
  ]);

  // =========================================================================
  // 7. SCIM 2.0 USER LIFECYCLE STATE
  // =========================================================================
  const [scimLogs, setScimLogs] = useState([
    {
      scimId: "SCIM-EVENT-401",
      identityProvider: "Okta Enterprise IDP",
      action: "USER_PROVISIONED",
      userPrincipal: "dr.rachel.kim@medtrack.org",
      assignedGroups: ["Physicians", "ICU_Overwatch_Admins", "DSCSA_Signers"],
      timestamp: "2026-08-16 10:15:00"
    },
    {
      scimId: "SCIM-EVENT-402",
      identityProvider: "Azure AD / Entra ID",
      action: "USER_DEPROVISIONED_OFFBOARDING",
      userPrincipal: "temp.contractor@medtrack.org",
      assignedGroups: [],
      timestamp: "2026-08-16 09:30:00"
    },
    {
      scimId: "SCIM-EVENT-403",
      identityProvider: "PingIdentity IDP",
      action: "GROUP_MEMBERSHIP_UPDATED",
      userPrincipal: "pharmacist.jenkins@medtrack.org",
      assignedGroups: ["Pharmacists", "DEA_Narcotic_Vault_Managers"],
      timestamp: "2026-08-16 08:45:00"
    }
  ]);

  // =========================================================================
  // 8. SBOM & SUPPLY CHAIN SECURITY STATE
  // =========================================================================
  const [sbomPackages, setSbomPackages] = useState([
    {
      packageId: "PKG-NPM-LUCIDE-REACT",
      packageName: "lucide-react",
      version: "0.344.0",
      license: "MIT",
      cveStatus: "ZERO_KNOWN_VULNERABILITIES",
      cryptographicSignature: "COSIGN_VERIFIED_npm_provenance"
    },
    {
      packageId: "PKG-MAVEN-SPRING-SECURITY",
      packageName: "org.springframework.security:spring-security-web",
      version: "6.2.2",
      license: "Apache-2.0",
      cveStatus: "ZERO_KNOWN_VULNERABILITIES",
      cryptographicSignature: "MAVEN_CENTRAL_PGP_SIGNED"
    },
    {
      packageId: "PKG-DOCKER-DISTROLESS-JAVA21",
      packageName: "gcr.io/distroless/java21-debian12",
      version: "sha256:4a80912f...",
      license: "Debian Free Software Guidelines",
      cveStatus: "ZERO_KNOWN_VULNERABILITIES",
      cryptographicSignature: "SIGSTORE_COSIGN_SIGNED"
    }
  ]);

  // Handlers
  const handleRevokeSession = (sessionId) => {
    setUserSessions((prev) =>
      prev.map((s) =>
        s.sessionId === sessionId
          ? { ...s, trustScore: 0, riskTier: "REVOKED_TERMINATED" }
          : s
      )
    );
    setNotification({
      type: "error",
      message: `Session ${sessionId} has been cryptographically revoked. JWT invalidation broadcasted across all nodes.`
    });
  };

  const handleApprovePam = (requestId) => {
    setPamRequests((prev) =>
      prev.map((p) =>
        p.requestId === requestId
          ? { ...p, approvalStatus: "APPROVED_ACTIVE_SESSION" }
          : p
      )
    );
    setNotification({
      type: "success",
      message: `PAM Just-in-Time access request ${requestId} approved with dual-authorization signature!`
    });
  };

  // Filtered Sessions List
  const filteredSessions = useMemo(() => {
    return userSessions.filter((s) => {
      const matchSearch =
        s.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.sessionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.userRole.toLowerCase().includes(searchTerm.toLowerCase());

      const matchTier =
        securityTierFilter === "ALL" ||
        (securityTierFilter === "LOW" && s.riskTier.includes("LOW")) ||
        (securityTierFilter === "HIGH" && s.riskTier.includes("HIGH"));

      return matchSearch && matchTier;
    });
  }, [userSessions, searchTerm, securityTierFilter]);

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-8 space-y-6">
      
      {/* 1. Page Header */}
      <div className="max-w-7xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 rounded-full flex items-center gap-1.5 font-mono">
                <ShieldCheck size={13} className="animate-pulse" /> ENTERPRISE ZERO-TRUST GOVERNANCE
              </span>
              <span className="px-3 py-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1">
                <Lock size={13} /> POST-QUANTUM ENCRYPTION
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Zero-Trust IAM, KMS & Security Governance Command Station
            </h1>
            <p className="text-slate-400 text-sm max-w-3xl leading-relaxed">
              Centralized continuous adaptive risk assessment (CARTA), Hardware Security Module (HSM) key lifecycle management, post-quantum lattice encryption, PAM break-glass vaults, and confidential computing enclave attestation.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto">
            <button
              type="button"
              onClick={() => setKmsRotateModal(true)}
              className="w-full lg:w-auto px-5 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-2xl transition shadow-lg shadow-cyan-600/25 flex items-center justify-center gap-2"
            >
              <RefreshCw size={16} /> Rotate Post-Quantum Keys
            </button>
          </div>
        </div>

        {/* Global Notifications */}
        {notification.message && (
          <div className="mt-6 p-4 rounded-2xl text-xs font-bold flex items-center justify-between bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
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

      {/* 2. Subsystem Navigation Tabs */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          {[
            { id: "CARTA_RISK_ENGINE", label: "CARTA Risk Engine", icon: Activity },
            { id: "FIDO2_PASSKEYS", label: "FIDO2 Passkeys & HSM", icon: Fingerprint },
            { id: "FEDERATED_IDP", label: "SAML2 / OAuth2 Identity", icon: Key },
            { id: "POST_QUANTUM_KMS", label: "Post-Quantum KMS", icon: Lock },
            { id: "PAM_JIT_VAULT", label: "PAM Break-Glass Vault", icon: KeyRound },
            { id: "RBAC_ABAC_MATRIX", label: "RBAC / ABAC Policies", icon: Shield },
            { id: "CONFIDENTIAL_ENCLAVES", label: "Confidential Enclaves", icon: Cpu },
            { id: "SIEM_SOAR_ANALYTICS", label: "SIEM / SOAR Analytics", icon: ShieldAlert },
            { id: "SCIM_PROVISIONING", label: "SCIM 2.0 Auto-Sync", icon: Users },
            { id: "CSPM_CTEM_POSTURE", label: "CSPM & CTEM Posture", icon: Target },
            { id: "SBOM_SUPPLY_CHAIN", label: "SBOM Supply Chain", icon: FileCode },
            { id: "MICROSEGMENTATION", label: "SDP Microsegmentation", icon: Layers },
            { id: "AUDIT_EVIDENCE", label: "Cryptographic Audit", icon: FileCheck }
          ].map((tab) => {
            const IconComp = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/20"
                    : "bg-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <IconComp size={15} /> {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          MODULE 1: CARTA ADAPTIVE RISK & TRUST ASSESSMENT
          ========================================================================= */}
      {activeTab === "CARTA_RISK_ENGINE" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl text-xs">
            <div className="relative w-full sm:w-80">
              <Search size={14} className="absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="Search user, session ID, role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Filter Risk Tier:</span>
              <select
                value={securityTierFilter}
                onChange={(e) => setSecurityTierFilter(e.target.value)}
                className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="ALL">ALL RISK TIERS</option>
                <option value="LOW">LOW RISK VERIFIED</option>
                <option value="HIGH">HIGH RISK ALERTS</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSessions.map((s) => (
              <div
                key={s.sessionId}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl hover:border-cyan-500/40 transition flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 text-[11px] font-bold font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
                      {s.sessionId}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${
                        s.riskTier.includes("HIGH") || s.riskTier.includes("REVOKED")
                          ? "bg-rose-500/20 text-rose-400 border-rose-500/30 animate-pulse"
                          : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                      }`}
                    >
                      {s.riskTier}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white font-mono leading-snug">{s.userName}</h3>
                    <p className="text-[11px] text-slate-400 font-sans mt-0.5">{s.userRole}</p>
                  </div>

                  {/* Trust Score Box */}
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-1 text-xs font-mono">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 text-[10px]">Trust Score:</span>
                      <strong
                        className={`font-bold ${
                          s.trustScore < 50 ? "text-rose-400" : "text-emerald-400"
                        }`}
                      >
                        {s.trustScore} / 100
                      </strong>
                    </div>
                    <div className="flex justify-between items-center text-slate-400 text-[11px]">
                      <span>Auth Method:</span>
                      <span className="text-cyan-300">{s.authMethod}</span>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs font-mono">
                    <div className="flex justify-between text-slate-400">
                      <span>IP Address:</span>
                      <span className="text-slate-200">{s.ipAddress}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Device:</span>
                      <span className="text-slate-300">{s.deviceFingerprint}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setSessionInspectModal(s)}
                    className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs flex items-center gap-1 transition"
                  >
                    <Eye size={13} /> Inspect Session
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRevokeSession(s.sessionId)}
                    className="py-2 px-3 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-xl font-bold text-xs flex items-center gap-1 transition"
                  >
                    <ShieldAlert size={13} /> Revoke JWT
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 2: FIDO2 PASSKEYS & HSM
          ========================================================================= */}
      {activeTab === "FIDO2_PASSKEYS" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 font-mono text-xs">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-sans">
                <Fingerprint size={18} className="text-cyan-400" /> FIDO2 WebAuthn Passkeys & Hardware Security Module Ledger
              </h3>
              <button
                type="button"
                onClick={() => setFido2PasskeyModal({ passkeyId: "FIDO2-KEY-001" })}
                className="px-3 py-1.5 bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 rounded-xl font-bold font-sans text-xs"
              >
                Register New FIDO2 Hardware Key
              </button>
            </div>

            <div className="space-y-3">
              {passkeys.map((pk) => (
                <div key={pk.passkeyId} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex justify-between items-center">
                  <div>
                    <span className="text-cyan-300 font-bold text-sm">{pk.passkeyId} • {pk.owner}</span>
                    <p className="text-slate-300 text-[11px] font-sans mt-0.5">Hardware Model: {pk.hardwareModel} | Format: {pk.attestationFormat}</p>
                    <p className="text-slate-500 text-[10px]">AAGUID: {pk.aaguid}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-400 font-bold block">{pk.status}</span>
                    <span className="text-slate-400 text-[10px]">Signature Count: {pk.signCount}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 3: FEDERATED IDENTITY
          ========================================================================= */}
      {activeTab === "FEDERATED_IDP" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 font-mono text-xs">
            <h3 className="text-base font-bold text-white flex items-center gap-2 font-sans">
              <Key size={18} className="text-amber-400" /> SAML 2.0 / OAuth2 / OpenID Connect Federated Identity Hub
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                <div className="text-amber-400 font-bold">Okta Enterprise IDP</div>
                <div className="text-slate-300 text-[11px]">SAML 2.0 Metadata Certificate Verified</div>
                <div className="text-emerald-400 text-[10px]">STATUS: SYNCED & ACTIVE</div>
                <button
                  type="button"
                  onClick={() => setIdpDetailsModal({ name: "Okta Enterprise IDP" })}
                  className="px-2.5 py-1 bg-amber-600/20 text-amber-300 border border-amber-500/30 rounded-lg text-[10px] font-bold mt-1"
                >
                  Inspect IDP Certs
                </button>
              </div>
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                <div className="text-cyan-300 font-bold">Azure AD / Entra ID</div>
                <div className="text-slate-300 text-[11px]">OpenID Connect PKCE Flow</div>
                <div className="text-emerald-400 text-[10px]">STATUS: SYNCED & ACTIVE</div>
                <button
                  type="button"
                  onClick={() => setIdpDetailsModal({ name: "Azure AD / Entra ID" })}
                  className="px-2.5 py-1 bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 rounded-lg text-[10px] font-bold mt-1"
                >
                  Inspect OIDC Endpoints
                </button>
              </div>
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                <div className="text-purple-400 font-bold">PingIdentity OAuth2 Server</div>
                <div className="text-slate-300 text-[11px]">DPoP Demonstration of Proof-of-Possession</div>
                <div className="text-emerald-400 text-[10px]">STATUS: SYNCED & ACTIVE</div>
                <button
                  type="button"
                  onClick={() => setIdpDetailsModal({ name: "PingIdentity OAuth2 Server" })}
                  className="px-2.5 py-1 bg-purple-600/20 text-purple-300 border border-purple-500/30 rounded-lg text-[10px] font-bold mt-1"
                >
                  Inspect DPoP Tokens
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 4: POST-QUANTUM KMS
          ========================================================================= */}
      {activeTab === "POST_QUANTUM_KMS" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 font-mono text-xs">
            <h3 className="text-base font-bold text-white flex items-center gap-2 font-sans">
              <Lock size={18} className="text-cyan-400" /> Post-Quantum Lattice Encryption & KMS Lifecycle Management
            </h3>

            <div className="space-y-3">
              {kmsKeys.map((k) => (
                <div key={k.keyId} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex justify-between items-center">
                  <div>
                    <span className="text-cyan-300 font-bold text-sm">{k.keyId}</span>
                    <p className="text-slate-300 text-[11px] font-sans mt-0.5">Algorithm: {k.algorithm}</p>
                    <p className="text-slate-500 text-[10px]">Purpose: {k.purpose}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-400 font-bold block">{k.keyState}</span>
                    <span className="text-slate-400 text-[10px]">HSM Slot: {k.hsmSlot}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 5: PAM JIT VAULT
          ========================================================================= */}
      {activeTab === "PAM_JIT_VAULT" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 font-mono text-xs">
            <h3 className="text-base font-bold text-white flex items-center gap-2 font-sans">
              <KeyRound size={18} className="text-rose-400" /> Privileged Access Management (PAM) Just-in-Time Break-Glass Vault
            </h3>

            <div className="space-y-3">
              {pamRequests.map((p) => (
                <div key={p.requestId} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex justify-between items-center">
                  <div>
                    <span className="text-rose-400 font-bold">{p.requestId} • {p.requestor}</span>
                    <p className="text-slate-300 text-[11px] font-sans mt-0.5">Target Asset: {p.targetAsset} | Role: {p.requestedRole}</p>
                    <p className="text-slate-500 text-[10px]">Ticket Ref: {p.ticketReference}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-400 font-bold block">{p.approvalStatus}</span>
                    {p.approvalStatus.includes("PENDING") && (
                      <button
                        type="button"
                        onClick={() => handleApprovePam(p.requestId)}
                        className="px-3 py-1 bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-[10px] font-bold mt-1"
                      >
                        Approve Break-Glass Access
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 6: RBAC ABAC MATRIX
          ========================================================================= */}
      {activeTab === "RBAC_ABAC_MATRIX" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 font-mono text-xs">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-sans">
                <Shield size={18} className="text-indigo-400" /> Role-Based & Attribute-Based Access Control (RBAC/ABAC) Policy Matrix
              </h3>
              <button
                type="button"
                onClick={() => setPolicyInspectModal({ policyName: "POL-EHR-RESTRICT-01" })}
                className="px-3 py-1.5 bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 rounded-xl font-bold font-sans text-xs"
              >
                Simulate ABAC Policy Rule
              </button>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex justify-between border-b border-slate-800 pb-2 text-slate-400">
                <span>Policy Name</span>
                <span>Attribute Condition</span>
                <span>Enforcement Action</span>
              </div>
              <div className="flex justify-between text-white">
                <span>POL-EHR-RESTRICT-01</span>
                {/* Rendered from a string literal rather than as JSX text: these are policy
                    expressions, and a relational operator in JSX text is a parse error, not an
                    escaping nicety. See the sibling DEA-VAULT policy below. */}
                <span>{"user.role == 'PHYSICIAN' && patient.assignedFacility == user.facility"}</span>
                <span className="text-emerald-400 font-bold">PERMIT_READ_WRITE</span>
              </div>
              <div className="flex justify-between text-white">
                <span>POL-DEA-VAULT-02</span>
                <span>{"user.clearanceLevel >= 4 && device.isHardwareTpm == true"}</span>
                <span className="text-emerald-400 font-bold">PERMIT_DISPENSE_NARCOTICS</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 7: CONFIDENTIAL ENCLAVES
          ========================================================================= */}
      {activeTab === "CONFIDENTIAL_ENCLAVES" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 font-mono text-xs">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-sans">
                <Cpu size={18} className="text-purple-400" /> Confidential Computing Hardware Enclaves (AMD SEV / Intel SGX)
              </h3>
              <button
                type="button"
                onClick={() => setEnclaveAuditModal({ enclaveId: "ENC-AMD-SEV-01" })}
                className="px-3 py-1.5 bg-purple-600/20 text-purple-300 border border-purple-500/30 rounded-xl font-bold font-sans text-xs"
              >
                Verify Remote Attestation Hash
              </button>
            </div>

            <div className="space-y-3">
              {enclaves.map((e) => (
                <div key={e.enclaveId} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex justify-between items-center">
                  <div>
                    <span className="text-purple-400 font-bold text-sm">{e.enclaveId} • {e.nodeHost}</span>
                    <p className="text-slate-300 text-[11px] font-sans mt-0.5">Technology: {e.technology}</p>
                    <p className="text-slate-500 text-[10px]">Workload: {e.workloadRunning}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-400 font-bold block">{e.measurementStatus}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 8: SIEM SOAR ANALYTICS
          ========================================================================= */}
      {activeTab === "SIEM_SOAR_ANALYTICS" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 font-mono text-xs">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-sans">
                <ShieldAlert size={18} className="text-rose-400" /> SIEM & SOAR Automated Threat Detection Security Analytics
              </h3>
              <button
                type="button"
                onClick={() => setSiemThreatModal({ threatId: "THREAT-SOAR-801" })}
                className="px-3 py-1.5 bg-rose-600/20 text-rose-300 border border-rose-500/30 rounded-xl font-bold font-sans text-xs"
              >
                Trigger Automated SOAR Playbook
              </button>
            </div>

            <div className="space-y-3">
              {siemThreats.map((t) => (
                <div key={t.threatId} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                  <div className="flex justify-between items-center text-rose-400 font-bold">
                    <span>{t.threatId} • {t.severity}</span>
                    <span className="text-emerald-400">{t.status}</span>
                  </div>
                  <div className="text-slate-200 text-xs font-sans">Detection: {t.description}</div>
                  <div className="text-slate-400 text-[11px]">Automated Playbook: {t.automatedPlaybook}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 9: SCIM PROVISIONING
          ========================================================================= */}
      {activeTab === "SCIM_PROVISIONING" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 font-mono text-xs">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-sans">
                <Users size={18} className="text-cyan-400" /> SCIM 2.0 User Lifecycle Auto-Provisioning & De-Provisioning
              </h3>
              <button
                type="button"
                onClick={() => setScimUserModal({ scimId: "SCIM-EVENT-401" })}
                className="px-3 py-1.5 bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 rounded-xl font-bold font-sans text-xs"
              >
                Force SCIM Re-Sync from Okta
              </button>
            </div>

            <div className="space-y-3">
              {scimLogs.map((s) => (
                <div key={s.scimId} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex justify-between items-center">
                  <div>
                    <span className="text-cyan-300 font-bold">{s.scimId} • {s.userPrincipal}</span>
                    <p className="text-slate-300 text-[11px] font-sans mt-0.5">IDP Source: {s.identityProvider}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-400 font-bold block">{s.action}</span>
                    <span className="text-slate-500 text-[10px]">{s.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 10: CSPM CTEM POSTURE
          ========================================================================= */}
      {activeTab === "CSPM_CTEM_POSTURE" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 font-mono text-xs">
            <h3 className="text-base font-bold text-white flex items-center gap-2 font-sans">
              <Target size={18} className="text-emerald-400" /> Cloud Security Posture Management (CSPM) & CTEM Vulnerability Scanner
            </h3>

            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
                <span className="text-slate-400 text-[10px]">Cloud Compliance Rating</span>
                <div className="text-xl font-bold text-emerald-400">99.4% (HIPAA & CIS Benchmark)</div>
              </div>
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
                <span className="text-slate-400 text-[10px]">Active Critical Misconfigurations</span>
                <div className="text-xl font-bold text-emerald-400">0 DETECTED</div>
              </div>
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
                <span className="text-slate-400 text-[10px]">CTEM Exposure Management Score</span>
                <div className="text-xl font-bold text-cyan-300">GRADE A+ OPTIMAL</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 11: SBOM SUPPLY CHAIN
          ========================================================================= */}
      {activeTab === "SBOM_SUPPLY_CHAIN" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 font-mono text-xs">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-sans">
                <FileCode size={18} className="text-amber-400" /> Software Bill of Materials (SBOM) & Supply Chain Security Matrix
              </h3>
              <button
                type="button"
                onClick={() => setSbomScanModal({ packageId: "PKG-NPM-LUCIDE-REACT" })}
                className="px-3 py-1.5 bg-amber-600/20 text-amber-300 border border-amber-500/30 rounded-xl font-bold font-sans text-xs"
              >
                Scan CycloneDX / SPDX SBOM Feed
              </button>
            </div>

            <div className="space-y-3">
              {sbomPackages.map((pkg) => (
                <div key={pkg.packageId} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex justify-between items-center">
                  <div>
                    <span className="text-amber-400 font-bold">{pkg.packageId} • {pkg.packageName} (v{pkg.version})</span>
                    <p className="text-slate-300 text-[11px] font-sans mt-0.5">License: {pkg.license}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-400 font-bold block">{pkg.cveStatus}</span>
                    <span className="text-cyan-300 text-[10px]">{pkg.cryptographicSignature}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 12: MICROSEGMENTATION
          ========================================================================= */}
      {activeTab === "MICROSEGMENTATION" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 font-mono text-xs">
            <h3 className="text-base font-bold text-white flex items-center gap-2 font-sans">
              <Layers size={18} className="text-cyan-400" /> Microsegmentation & Software-Defined Perimeter (SDP) Enforcer
            </h3>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex justify-between"><span>eBPF Microsegmentation Firewall:</span><strong className="text-emerald-400">ENFORCING_ZERO_TRUST_DEFAULT_DENY</strong></div>
              <div className="flex justify-between"><span>mTLS Pod-to-Pod SPIFFE Identity:</span><strong className="text-cyan-300">100% Cryptographically Verified</strong></div>
              <div className="flex justify-between"><span>EHR Database Perimeter:</span><strong className="text-emerald-400">ISOLATED IN PRIVATE SUBNET ENCLAVE</strong></div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 13: AUDIT EVIDENCE
          ========================================================================= */}
      {activeTab === "AUDIT_EVIDENCE" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 font-mono text-xs">
            <h3 className="text-base font-bold text-white flex items-center gap-2 font-sans">
              <FileCheck size={18} className="text-emerald-400" /> HIPAA / SOC 2 Type II / ISO 27001 Cryptographic Audit Trail
            </h3>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex justify-between text-slate-400 border-b border-slate-800 pb-2">
                <span>Timestamp</span>
                <span>AuditEvent</span>
                <span>Integrity Seal</span>
              </div>
              <div className="flex justify-between text-white">
                <span>2026-08-16 11:34:00</span>
                <span className="text-emerald-400 font-bold">Post-Quantum Dilithium-5 Signature Verified</span>
                <span>0x88f91024bca7102948</span>
              </div>
              <div className="flex justify-between text-white">
                <span>2026-08-16 11:30:00</span>
                <span className="text-cyan-300 font-bold">FIDO2 Hardware Key Authentication Succeeded</span>
                <span>0x77a1029bca71029481</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rotate KMS Key Modal */}
      {kmsRotateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full text-slate-100 space-y-4 shadow-2xl font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-cyan-400 font-sans">Rotate Post-Quantum Cryptographic Keys</h3>
              <button type="button" onClick={() => setKmsRotateModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div>Target Algorithm: <strong className="text-white">CRYSTALS-Dilithium-5</strong></div>
              <div>Hardware Security Module: <span className="text-cyan-300">HSM-CLUSTER-ALPHA-SLOT-04</span></div>
              <div>Key State: <span className="text-emerald-400">READY_FOR_REKEYING</span></div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setKmsRotateModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs font-sans"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setKmsRotateModal(false);
                  setNotification({ type: "success", message: "Post-Quantum Cryptographic Keys rotated and re-sealed in HSM Cluster!" });
                }}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold text-xs font-sans shadow-lg shadow-cyan-600/20"
              >
                Execute Key Rotation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Session Inspect Modal */}
      {sessionInspectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full text-slate-100 space-y-4 shadow-2xl font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white font-sans">Session Inspection - {sessionInspectModal.sessionId}</h3>
              <button type="button" onClick={() => setSessionInspectModal(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div>User: <strong className="text-white">{sessionInspectModal.userName}</strong></div>
              <div>Role: <span className="text-cyan-300">{sessionInspectModal.userRole}</span></div>
              <div>Trust Score: <span className="text-emerald-400">{sessionInspectModal.trustScore} / 100</span></div>
              <div>IP / Location: <span className="text-slate-300">{sessionInspectModal.ipAddress} ({sessionInspectModal.activeLocation})</span></div>
              <div>Auth Method: <span className="text-amber-300">{sessionInspectModal.authMethod}</span></div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSessionInspectModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs font-sans"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IDP Details Modal */}
      {idpDetailsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full text-slate-100 space-y-4 shadow-2xl font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-amber-400 font-sans">Identity Provider Audit - {idpDetailsModal.name}</h3>
              <button type="button" onClick={() => setIdpDetailsModal(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div>Provider: <strong className="text-white">{idpDetailsModal.name}</strong></div>
              <div>SAML / OIDC Signature: <span className="text-emerald-400 font-bold">RSA 4096-bit SHA-256 VALID</span></div>
              <div>Issuer URL: <span className="text-cyan-300">https://medtrack.okta.com/oauth2/v1/authorize</span></div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIdpDetailsModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs font-sans"
              >
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FIDO2 Passkey Modal */}
      {fido2PasskeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full text-slate-100 space-y-4 shadow-2xl font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-cyan-400 font-sans">Register Hardware FIDO2 Security Key</h3>
              <button type="button" onClick={() => setFido2PasskeyModal(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div>WebAuthn Challenge: <span className="text-cyan-300">0x88f91024bca710294812</span></div>
              <div>User Verification: <span className="text-emerald-400">REQUIRED (PIN / Biometric)</span></div>
              <div>Attestation: <span className="text-amber-300">DIRECT (Yubico Root CA Verified)</span></div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setFido2PasskeyModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs font-sans"
              >
                Cancel Registration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Policy Inspect Modal */}
      {policyInspectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full text-slate-100 space-y-4 shadow-2xl font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-indigo-400 font-sans">ABAC Policy Simulation Engine</h3>
              <button type="button" onClick={() => setPolicyInspectModal(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div>Policy Name: <strong className="text-white">{policyInspectModal.policyName}</strong></div>
              <div>Evaluated Decision: <span className="text-emerald-400 font-bold">PERMIT (0.42ms Evaluation Time)</span></div>
              <div>Obligations: <span className="text-cyan-300">AuditLogEvent, EnforceTLS13</span></div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setPolicyInspectModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs font-sans"
              >
                Close Simulator
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enclave Audit Modal */}
      {enclaveAuditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full text-slate-100 space-y-4 shadow-2xl font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-purple-400 font-sans">Hardware Enclave Attestation Report</h3>
              <button type="button" onClick={() => setEnclaveAuditModal(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div>Enclave: <strong className="text-white">{enclaveAuditModal.enclaveId}</strong></div>
              <div>Measurement: <span className="text-purple-300">AMD SEV-SNP Firmware v1.52.02</span></div>
              <div>Attestation Result: <span className="text-emerald-400 font-bold">GENUINE HARDWARE ENCLAVE</span></div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setEnclaveAuditModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs font-sans"
              >
                Close Attestation View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SIEM Threat Modal */}
      {siemThreatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full text-slate-100 space-y-4 shadow-2xl font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-rose-400 font-sans">SOAR Playbook Execution - {siemThreatModal.threatId}</h3>
              <button type="button" onClick={() => setSiemThreatModal(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div>Threat ID: <strong className="text-rose-400">{siemThreatModal.threatId}</strong></div>
              <div>Playbook Step 1: <span className="text-emerald-400">Invalidate User JWT Token (COMPLETED)</span></div>
              <div>Playbook Step 2: <span className="text-emerald-400">Apply eBPF Drop Rule on Ingress Router (COMPLETED)</span></div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSiemThreatModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs font-sans"
              >
                Close Playbook View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SCIM User Modal */}
      {scimUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full text-slate-100 space-y-4 shadow-2xl font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-cyan-400 font-sans">SCIM 2.0 Synchronization Engine</h3>
              <button type="button" onClick={() => setScimUserModal(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div>Event: <strong className="text-white">{scimUserModal.scimId}</strong></div>
              <div>Sync Protocol: <span className="text-cyan-300">RFC 7644 SCIM REST Protocol</span></div>
              <div>Status: <span className="text-emerald-400">100% IN-SYNC WITH OKTA</span></div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setScimUserModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs font-sans"
              >
                Close SCIM View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SBOM Scan Modal */}
      {sbomScanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full text-slate-100 space-y-4 shadow-2xl font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-amber-400 font-sans">CycloneDX SBOM Analysis</h3>
              <button type="button" onClick={() => setSbomScanModal(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div>Package: <strong className="text-white">{sbomScanModal.packageId}</strong></div>
              <div>Vulnerability Scan: <span className="text-emerald-400 font-bold">PASSED (0 CVEs Found)</span></div>
              <div>Cryptographic Provenance: <span className="text-cyan-300">Cosign Signed npm provenance</span></div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSbomScanModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs font-sans"
              >
                Close SBOM View
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

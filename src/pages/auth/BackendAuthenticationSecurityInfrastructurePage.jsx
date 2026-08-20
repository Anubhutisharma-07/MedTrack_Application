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
 * BackendAuthenticationSecurityInfrastructurePage Component
 *
 * High-Assurance Enterprise Backend Authentication & IAM Security Infrastructure Hub.
 * Architected with 13 Enterprise Authentication Subsystems:
 * 1. OAuth2 / OIDC Token Lifecycle & DPoP Verification Engine
 * 2. FIDO2 WebAuthn & Passkey Authentication Matrix
 * 3. Multi-Factor Authentication (MFA) & Step-Up Escalation Engine
 * 4. Privileged Access Management (PAM) Ephemeral JIT Vault
 * 5. Zero-Trust Continuous Adaptive Risk Assessment (CARTA) Engine
 * 6. SAML 2.0 Enterprise Identity Provider (IdP) Broker
 * 7. RBAC & ABAC Policy Evaluation Engine
 * 8. SCIM 2.0 Automated User Provisioning Ledger
 * 9. Post-Quantum Cryptographic Key Vault (KMS) & HSM Manager
 * 10. Hardware Enclave Confidential Authentication (AMD SEV / Intel SGX)
 * 11. SIEM & SOAR Automated Threat Containment Feed
 * 12. Microsegmentation & SPIFFE mTLS Identity Enforcer
 * 13. HIPAA & 21 CFR Part 11 Cryptographic Audit Trail
 */
export default function BackendAuthenticationSecurityInfrastructurePage() {
  const [activeTab, setActiveTab] = useState("OAUTH2_TOKENS");

  const [searchTerm, setSearchTerm] = useState("");
  const [authStatusFilter, setAuthStatusFilter] = useState("ALL");
  const [notification, setNotification] = useState({ type: "", message: "" });

  // Modal States
  const [tokenInspectModal, setTokenInspectModal] = useState(null);
  const [fido2RegisterModal, setFido2RegisterModal] = useState(null);
  const [mfaConfigModal, setMfaConfigModal] = useState(null);
  const [pamVaultModal, setPamVaultModal] = useState(null);
  const [cartaRiskModal, setCartaRiskModal] = useState(null);
  const [samlIdpModal, setSamlIdpModal] = useState(null);
  const [policyEvalModal, setPolicyEvalModal] = useState(null);
  const [scimSyncModal, setScimSyncModal] = useState(null);
  const [kmsRotateModal, setKmsRotateModal] = useState(false);
  const [enclaveAuditModal, setEnclaveAuditModal] = useState(null);
  const [siemPlaybookModal, setSiemPlaybookModal] = useState(null);

  // =========================================================================
  // 1. OAUTH2 / OIDC TOKEN LIFECYCLE STATE
  // =========================================================================
  const [activeTokens, setActiveTokens] = useState([
    {
      tokenId: "JTI-904812-JWT",
      subject: "dr.marcus.vance@medtrack.org",
      clientApp: "MedTrack ICU Overwatch Dashboard v4.2",
      tokenType: "DPoP Bound Bearer Access Token",
      algorithm: "RS256 with Post-Quantum Dilithium-5 Dual Signature",
      issuedAt: "2026-08-16 11:00:00",
      expiresAt: "2026-08-16 12:00:00",
      status: "VALID_ACTIVE",
      dpopProofHash: "0x88f91024bca7102948120bca71029481"
    },
    {
      tokenId: "JTI-881024-JWT",
      subject: "pharmacist.jenkins@medtrack.org",
      clientApp: "Cold-Chain Narcotics Dispensing Station",
      tokenType: "OAuth2 Refresh Token (Rotated)",
      algorithm: "ES256 (ECDSA P-256)",
      issuedAt: "2026-08-16 10:30:00",
      expiresAt: "2026-08-16 18:30:00",
      status: "VALID_ACTIVE",
      dpopProofHash: "0x77a1029bca7102948120bca71029482"
    },
    {
      tokenId: "JTI-774901-JWT",
      subject: "service-account-telemetry-api@medtrack.internal",
      clientApp: "ICU Bedside Telemetry Receiver Service",
      tokenType: "Client Credentials mTLS Token",
      algorithm: "Ed25519 High-Speed Signature",
      issuedAt: "2026-08-16 08:00:00",
      expiresAt: "2026-08-17 08:00:00",
      status: "VALID_ACTIVE",
      dpopProofHash: "0x55c9028fba6102948120bca71029483"
    },
    {
      tokenId: "JTI-661092-JWT",
      subject: "external.auditor@thirdparty.com",
      clientApp: "Guest Compliance Auditor Portal",
      tokenType: "Deprecated Passcode Bearer Token",
      algorithm: "HS256 (Symmetric Secret)",
      issuedAt: "2026-08-16 11:15:00",
      expiresAt: "2026-08-16 11:45:00",
      status: "REVOKED_SECURITY_VIOLATION",
      dpopProofHash: "NONE_UNBOUND"
    },
    {
      tokenId: "JTI-552019-JWT",
      subject: "dr.rachel.kim@medtrack.org",
      clientApp: "Neonatal Telemetry Overwatch iOS App",
      tokenType: "DPoP Bound Access Token",
      algorithm: "CRYSTALS-Dilithium-5 Signature",
      issuedAt: "2026-08-16 11:20:00",
      expiresAt: "2026-08-16 12:20:00",
      status: "VALID_ACTIVE",
      dpopProofHash: "0x44b8017eaa5102948120bca71029484"
    },
    {
      tokenId: "JTI-441092-JWT",
      subject: "nurse.david.miller@medtrack.org",
      clientApp: "ER Triage Station Workstation #04",
      tokenType: "SmartCard PIV/CAC Session Token",
      algorithm: "RS4096-bit RSA Signature",
      issuedAt: "2026-08-16 07:00:00",
      expiresAt: "2026-08-16 19:00:00",
      status: "VALID_ACTIVE",
      dpopProofHash: "0x33a7006d994102948120bca71029485"
    }
  ]);

  // =========================================================================
  // 2. FIDO2 WEBAUTHN PASSKEY MATRIX STATE
  // =========================================================================
  const [fido2Passkeys, setFido2Passkeys] = useState([
    {
      credentialId: "WEBAUTHN-CRED-01",
      userPrincipal: "dr.marcus.vance@medtrack.org",
      authenticatorAttachment: "cross-platform (Hardware Security Key)",
      aaguidName: "Yubico YubiKey 5 Series (FIPS 140-2)",
      counter: 1420,
      userVerified: true,
      registrationDate: "2026-01-15",
      status: "HARDWARE_ATTESTED_ACTIVE"
    },
    {
      credentialId: "WEBAUTHN-CRED-02",
      userPrincipal: "pharmacist.jenkins@medtrack.org",
      authenticatorAttachment: "platform (Apple TouchID / Secure Enclave)",
      aaguidName: "Apple Enterprise Device Enclave",
      counter: 890,
      userVerified: true,
      registrationDate: "2026-03-01",
      status: "HARDWARE_ATTESTED_ACTIVE"
    },
    {
      credentialId: "WEBAUTHN-CRED-03",
      userPrincipal: "dr.rachel.kim@medtrack.org",
      authenticatorAttachment: "cross-platform (Google Titan Key)",
      aaguidName: "Google Titan Security Chip v2",
      counter: 650,
      userVerified: true,
      registrationDate: "2026-04-10",
      status: "HARDWARE_ATTESTED_ACTIVE"
    }
  ]);

  // =========================================================================
  // 3. MFA & STEP-UP ENGINE STATE
  // =========================================================================
  const [mfaPolicies, setMfaPolicies] = useState([
    {
      policyId: "MFA-POL-001",
      name: "High-Risk EHR Access Step-Up",
      triggerCondition: "RiskScore > 70 OR Accessing High-Acuity ICU Telemetry",
      requiredFactors: ["FIDO2_PASSKEY", "HARDWARE_TOTP"],
      enforcementMode: "MANDATORY_STRICT",
      status: "ENFORCING"
    },
    {
      policyId: "MFA-POL-002",
      name: "DEA Narcotics Dispensing Dual-Auth",
      triggerCondition: "Accessing Schedule II Controlled Substance Dispenser",
      requiredFactors: ["FIDO2_PASSKEY", "BIOMETRIC_TOUCHID", "SUPERVISOR_CO_SIGN"],
      enforcementMode: "MANDATORY_STRICT",
      status: "ENFORCING"
    }
  ]);

  // =========================================================================
  // 4. PAM EPHEMERAL JIT VAULT STATE
  // =========================================================================
  const [pamVaultItems, setPamVaultItems] = useState([
    {
      vaultId: "PAM-JIT-901",
      requestor: "Alex Thorne (Lead DevOps Engineer)",
      targetAsset: "Production PostgreSQL Primary Database (Port 5432)",
      requestedRole: "DBA_EMERGENCY_BREAK_GLASS",
      durationMinutes: 30,
      approvalStatus: "APPROVED_ACTIVE_SESSION",
      ticketReference: "JIRA-SEC-88401",
      expirationTimestamp: "2026-08-16 12:00:00"
    },
    {
      vaultId: "PAM-JIT-902",
      requestor: "Elena Rostova (SecOps Lead)",
      targetAsset: "K8s Control Plane Master Node",
      requestedRole: "CLUSTER_ADMIN_EPHEMERAL",
      durationMinutes: 15,
      approvalStatus: "PENDING_DUAL_AUTHORIZATION",
      ticketReference: "JIRA-SEC-88409",
      expirationTimestamp: "2026-08-16 11:45:00"
    }
  ]);

  // =========================================================================
  // 5. CARTA RISK ENGINE STATE
  // =========================================================================
  const [cartaSessions, setCartaSessions] = useState([
    {
      sessionId: "CARTA-SES-101",
      user: "Dr. Marcus Vance",
      trustScore: 98,
      riskLevel: "LOW_RISK",
      anomalyFlags: "None (Internal Hospital Subnet)",
      lastAssessed: "2026-08-16 11:35:00"
    },
    {
      sessionId: "CARTA-SES-102",
      user: "External Auditor (Guest)",
      trustScore: 42,
      riskLevel: "HIGH_RISK_ALERT",
      anomalyFlags: "Unrecognized Device Fingerprint + Geolocation Velocity Anomaly",
      lastAssessed: "2026-08-16 11:34:12"
    }
  ]);

  // =========================================================================
  // 6. SAML 2.0 IDP BROKER STATE
  // =========================================================================
  const [samlProviders, setSamlProviders] = useState([
    {
      idpId: "SAML-IDP-OKTA",
      name: "Okta Enterprise Workforce Identity",
      entityId: "https://medtrack.okta.com/saml2/service-provider",
      ssoUrl: "https://medtrack.okta.com/app/medtrack/exk12345/sso/saml",
      certFingerprint: "SHA256: 4A:80:91:2F:55:BC...",
      status: "CONNECTED_ACTIVE"
    },
    {
      idpId: "SAML-IDP-ENTRA",
      name: "Microsoft Azure AD / Entra ID",
      entityId: "https://sts.windows.net/72f988bf-86f1-41af-91ab-2d7cd011db47/",
      ssoUrl: "https://login.microsoftonline.com/medtrack.onmicrosoft.com/saml2",
      certFingerprint: "SHA256: 77:B8:C9:01:23:DE...",
      status: "CONNECTED_ACTIVE"
    }
  ]);

  // Handlers
  const handleRevokeToken = (tokenId) => {
    setActiveTokens((prev) =>
      prev.map((t) =>
        t.tokenId === tokenId
          ? { ...t, status: "REVOKED_MANUAL_ADMIN" }
          : t
      )
    );
    setNotification({
      type: "error",
      message: `Token ${tokenId} cryptographically revoked. Blacklist broadcasted to API Gateways.`
    });
  };

  const handleApprovePamVault = (vaultId) => {
    setPamVaultItems((prev) =>
      prev.map((v) =>
        v.vaultId === vaultId
          ? { ...v, approvalStatus: "APPROVED_ACTIVE_SESSION" }
          : v
      )
    );
    setNotification({
      type: "success",
      message: `PAM Break-Glass vault item ${vaultId} authorized with dual security keys!`
    });
  };

  // Filtered Tokens List
  const filteredTokens = useMemo(() => {
    return activeTokens.filter((t) => {
      const matchSearch =
        t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.tokenId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.clientApp.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus =
        authStatusFilter === "ALL" ||
        (authStatusFilter === "VALID" && t.status.includes("VALID")) ||
        (authStatusFilter === "REVOKED" && t.status.includes("REVOKED"));

      return matchSearch && matchStatus;
    });
  }, [activeTokens, searchTerm, authStatusFilter]);

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-8 space-y-6">
      
      {/* 1. Page Header */}
      <div className="max-w-7xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 rounded-full flex items-center gap-1.5 font-mono">
                <ShieldCheck size={13} className="animate-pulse" /> BACKEND AUTHENTICATION INFRASTRUCTURE
              </span>
              <span className="px-3 py-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1">
                <Lock size={13} /> DPoP & POST-QUANTUM KEY VAULT
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Backend Authentication & Identity Security Command Station
            </h1>
            <p className="text-slate-400 text-sm max-w-3xl leading-relaxed">
              Enterprise OAuth2 / OIDC token lifecycle management, DPoP proof-of-possession verification, FIDO2 WebAuthn passkeys, PAM break-glass vaults, and post-quantum cryptographic key rotation.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto">
            <button
              type="button"
              onClick={() => setKmsRotateModal(true)}
              className="w-full lg:w-auto px-5 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-2xl transition shadow-lg shadow-cyan-600/25 flex items-center justify-center gap-2"
            >
              <RefreshCw size={16} /> Rotate Master Auth Keys
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
            { id: "OAUTH2_TOKENS", label: "OAuth2 & DPoP Tokens", icon: Key },
            { id: "FIDO2_WEBAUTHN", label: "FIDO2 Passkeys", icon: Fingerprint },
            { id: "MFA_STEPUP", label: "MFA Step-Up Engine", icon: ShieldCheck },
            { id: "PAM_JIT_VAULT", label: "PAM Break-Glass Vault", icon: KeyRound },
            { id: "CARTA_RISK", label: "CARTA Risk Assessor", icon: Activity },
            { id: "SAML_IDP_BROKER", label: "SAML 2.0 IdP Broker", icon: Server },
            { id: "RBAC_ABAC_EVAL", label: "RBAC / ABAC Policies", icon: Shield },
            { id: "SCIM_PROVISIONING", label: "SCIM 2.0 User Sync", icon: Users },
            { id: "POST_QUANTUM_KMS", label: "Post-Quantum KMS", icon: Lock },
            { id: "ENCLAVE_AUTH", label: "Hardware Enclaves", icon: Cpu },
            { id: "SIEM_SOAR_THREATS", label: "SIEM / SOAR Playbooks", icon: ShieldAlert },
            { id: "MICROSEGMENTATION", label: "SPIFFE mTLS Mesh", icon: Layers },
            { id: "AUDIT_LEDGER", label: "Cryptographic Audit Log", icon: FileCheck }
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
          MODULE 1: OAUTH2 & DPoP TOKENS
          ========================================================================= */}
      {activeTab === "OAUTH2_TOKENS" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl text-xs">
            <div className="relative w-full sm:w-80">
              <Search size={14} className="absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="Search subject, JTI token ID, app..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Filter Status:</span>
              <select
                value={authStatusFilter}
                onChange={(e) => setAuthStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="ALL">ALL TOKENS</option>
                <option value="VALID">VALID ACTIVE</option>
                <option value="REVOKED">REVOKED</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTokens.map((t) => (
              <div
                key={t.tokenId}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl hover:border-cyan-500/40 transition flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 text-[11px] font-bold font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
                      {t.tokenId}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${
                        t.status.includes("VALID")
                          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                          : "bg-rose-500/20 text-rose-400 border-rose-500/30 animate-pulse"
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white font-mono leading-snug">{t.subject}</h3>
                    <p className="text-[11px] text-slate-400 font-sans mt-0.5">{t.clientApp}</p>
                  </div>

                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-1 text-xs font-mono">
                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span>Type:</span>
                      <span className="text-cyan-300">{t.tokenType}</span>
                    </div>
                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span>Algorithm:</span>
                      <span className="text-amber-300">{t.algorithm}</span>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs font-mono">
                    <div className="flex justify-between text-slate-400">
                      <span>Issued:</span>
                      <span className="text-slate-300">{t.issuedAt}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Expires:</span>
                      <span className="text-slate-300">{t.expiresAt}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setTokenInspectModal(t)}
                    className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs flex items-center gap-1 transition"
                  >
                    <Eye size={13} /> Inspect JWT Claims
                  </button>
                  {t.status.includes("VALID") && (
                    <button
                      type="button"
                      onClick={() => handleRevokeToken(t.tokenId)}
                      className="py-2 px-3 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-xl font-bold text-xs flex items-center gap-1 transition"
                    >
                      <ShieldAlert size={13} /> Revoke JWT
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 2: FIDO2 WEBAUTHN MATRIX
          ========================================================================= */}
      {activeTab === "FIDO2_WEBAUTHN" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 font-mono text-xs">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-sans">
                <Fingerprint size={18} className="text-cyan-400" /> FIDO2 WebAuthn & Passkey Authentication Matrix
              </h3>
              <button
                type="button"
                onClick={() => setFido2RegisterModal({ credentialId: "WEBAUTHN-NEW-01" })}
                className="px-3 py-1.5 bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 rounded-xl font-bold font-sans text-xs"
              >
                Register Hardware Security Passkey
              </button>
            </div>

            <div className="space-y-3">
              {fido2Passkeys.map((pk) => (
                <div key={pk.credentialId} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex justify-between items-center">
                  <div>
                    <span className="text-cyan-300 font-bold text-sm">{pk.credentialId} • {pk.userPrincipal}</span>
                    <p className="text-slate-300 text-[11px] font-sans mt-0.5">Attachment: {pk.authenticatorAttachment} | Model: {pk.aaguidName}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-400 font-bold block">{pk.status}</span>
                    <span className="text-slate-400 text-[10px]">Sign Counter: {pk.counter}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 3: MFA STEPUP ENGINE
          ========================================================================= */}
      {activeTab === "MFA_STEPUP" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 font-mono text-xs">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-sans">
                <ShieldCheck size={18} className="text-emerald-400" /> Multi-Factor Authentication (MFA) & Step-Up Escalation Engine
              </h3>
              <button
                type="button"
                onClick={() => setMfaConfigModal({ policyId: "MFA-POL-001" })}
                className="px-3 py-1.5 bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 rounded-xl font-bold font-sans text-xs"
              >
                Add Custom Step-Up Rule
              </button>
            </div>

            <div className="space-y-3">
              {mfaPolicies.map((pol) => (
                <div key={pol.policyId} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                  <div className="flex justify-between items-center text-emerald-400 font-bold">
                    <span>{pol.policyId} • {pol.name}</span>
                    <span className="bg-emerald-500/20 px-2.5 py-0.5 rounded-lg border border-emerald-500/30 text-[10px]">{pol.status}</span>
                  </div>
                  <div className="text-slate-300 text-xs font-sans">Condition: {pol.triggerCondition}</div>
                  <div className="text-cyan-300 text-[11px]">Required Factors: {pol.requiredFactors.join(" + ")}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 4: PAM JIT VAULT
          ========================================================================= */}
      {activeTab === "PAM_JIT_VAULT" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 font-mono text-xs">
            <h3 className="text-base font-bold text-white flex items-center gap-2 font-sans">
              <KeyRound size={18} className="text-rose-400" /> Privileged Access Management (PAM) Ephemeral Break-Glass Vault
            </h3>

            <div className="space-y-3">
              {pamVaultItems.map((v) => (
                <div key={v.vaultId} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex justify-between items-center">
                  <div>
                    <span className="text-rose-400 font-bold">{v.vaultId} • {v.requestor}</span>
                    <p className="text-slate-300 text-[11px] font-sans mt-0.5">Asset: {v.targetAsset} | Role: {v.requestedRole}</p>
                    <p className="text-slate-500 text-[10px]">Ticket Ref: {v.ticketReference}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-400 font-bold block">{v.approvalStatus}</span>
                    {v.approvalStatus.includes("PENDING") && (
                      <button
                        type="button"
                        onClick={() => handleApprovePamVault(v.vaultId)}
                        className="px-3 py-1 bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-[10px] font-bold mt-1"
                      >
                        Authorize Break-Glass Session
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
          MODULE 5: CARTA RISK
          ========================================================================= */}
      {activeTab === "CARTA_RISK" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 font-mono text-xs">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-sans">
                <Activity size={18} className="text-cyan-400" /> Zero-Trust Continuous Adaptive Risk & Trust Assessment (CARTA)
              </h3>
              <button
                type="button"
                onClick={() => setCartaRiskModal({ sessionId: "CARTA-SES-102" })}
                className="px-3 py-1.5 bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 rounded-xl font-bold font-sans text-xs"
              >
                Inspect AI Anomaly Score Engine
              </button>
            </div>

            <div className="space-y-3">
              {cartaSessions.map((c) => (
                <div key={c.sessionId} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex justify-between items-center">
                  <div>
                    <span className="text-cyan-300 font-bold">{c.sessionId} • {c.user}</span>
                    <p className="text-slate-300 text-[11px] font-sans mt-0.5">Anomaly Flags: {c.anomalyFlags}</p>
                  </div>
                  <div className="text-right">
                    <span className={`font-bold block ${c.trustScore < 50 ? "text-rose-400" : "text-emerald-400"}`}>
                      Trust Score: {c.trustScore} / 100
                    </span>
                    <span className="text-slate-400 text-[10px]">{c.riskLevel}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 6: SAML IDP BROKER
          ========================================================================= */}
      {activeTab === "SAML_IDP_BROKER" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 font-mono text-xs">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-sans">
                <Server size={18} className="text-amber-400" /> SAML 2.0 Enterprise Identity Provider (IdP) Broker
              </h3>
              <button
                type="button"
                onClick={() => setSamlIdpModal({ idpId: "SAML-IDP-OKTA" })}
                className="px-3 py-1.5 bg-amber-600/20 text-amber-300 border border-amber-500/30 rounded-xl font-bold font-sans text-xs"
              >
                Re-Verify Metadata XML Certs
              </button>
            </div>

            <div className="space-y-3">
              {samlProviders.map((idp) => (
                <div key={idp.idpId} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex justify-between items-center">
                  <div>
                    <span className="text-amber-400 font-bold">{idp.idpId} • {idp.name}</span>
                    <p className="text-slate-300 text-[11px] font-sans mt-0.5">Entity ID: {idp.entityId}</p>
                    <p className="text-slate-500 text-[10px]">Fingerprint: {idp.certFingerprint}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-400 font-bold block">{idp.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 7: RBAC ABAC EVAL
          ========================================================================= */}
      {activeTab === "RBAC_ABAC_EVAL" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 font-mono text-xs">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-sans">
                <Shield size={18} className="text-indigo-400" /> Role-Based & Attribute-Based Access Control (RBAC/ABAC) Engine
              </h3>
              <button
                type="button"
                onClick={() => setPolicyEvalModal({ ruleId: "RULE-ABAC-ICU-01" })}
                className="px-3 py-1.5 bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 rounded-xl font-bold font-sans text-xs"
              >
                Run ABAC Dry-Run Evaluation
              </button>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex justify-between border-b border-slate-800 pb-2 text-slate-400">
                <span>Rule Identifier</span>
                <span>Attribute Condition</span>
                <span>Evaluation Result</span>
              </div>
              <div className="flex justify-between text-white">
                <span>RULE-ABAC-ICU-01</span>
                {/* Rendered from a string literal rather than as JSX text: these are ABAC
                    expressions, and a relational operator in JSX text is a parse error, not an
                    escaping nicety. See the sibling NARCOTIC rule below. */}
                <span>{"user.role == 'INTENSIVIST' && request.resource == 'HEMODYNAMIC_STREAM'"}</span>
                <span className="text-emerald-400 font-bold">PERMIT (0.28ms)</span>
              </div>
              <div className="flex justify-between text-white">
                <span>RULE-ABAC-NARCOTIC-02</span>
                <span>{"user.clearanceLevel >= 4 && device.isTpmVerified == true"}</span>
                <span className="text-emerald-400 font-bold">PERMIT (0.35ms)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 8: SCIM PROVISIONING
          ========================================================================= */}
      {activeTab === "SCIM_PROVISIONING" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 font-mono text-xs">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-sans">
                <Users size={18} className="text-cyan-400" /> SCIM 2.0 Automated User Provisioning & De-Provisioning
              </h3>
              <button
                type="button"
                onClick={() => setScimSyncModal({ syncId: "SCIM-FORCE-SYNC" })}
                className="px-3 py-1.5 bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 rounded-xl font-bold font-sans text-xs"
              >
                Trigger Complete Identity Sync
              </button>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex justify-between"><span>SCIM 2.0 Endpoint:</span><strong className="text-cyan-300">https://api.medtrack.org/scim/v2/Users</strong></div>
              <div className="flex justify-between"><span>Active Sync Connections:</span><strong className="text-emerald-400">Okta (Sync OK), Entra ID (Sync OK)</strong></div>
              <div className="flex justify-between"><span>Reconciliation Audit Status:</span><strong className="text-emerald-400">100% IDENTITIES RECONCILED</strong></div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 9: POST QUANTUM KMS
          ========================================================================= */}
      {activeTab === "POST_QUANTUM_KMS" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 font-mono text-xs">
            <h3 className="text-base font-bold text-white flex items-center gap-2 font-sans">
              <Lock size={18} className="text-cyan-400" /> Post-Quantum Cryptographic Key Vault (KMS) & HSM Manager
            </h3>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex justify-between"><span>Primary Signature Algorithm:</span><strong className="text-cyan-300">CRYSTALS-Dilithium-5 (Post-Quantum)</strong></div>
              <div className="flex justify-between"><span>Key Encapsulation Mechanism (KEM):</span><strong className="text-cyan-300">CRYSTALS-Kyber-1024</strong></div>
              <div className="flex justify-between"><span>HSM Hardware Cluster Status:</span><strong className="text-emerald-400">FIPS 140-3 LEVEL 4 ATTESTED</strong></div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 10: ENCLAVE AUTH
          ========================================================================= */}
      {activeTab === "ENCLAVE_AUTH" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 font-mono text-xs">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-sans">
                <Cpu size={18} className="text-purple-400" /> Hardware Enclave Confidential Authentication (AMD SEV / Intel SGX)
              </h3>
              <button
                type="button"
                onClick={() => setEnclaveAuditModal({ enclaveId: "ENC-AMD-SEV-01" })}
                className="px-3 py-1.5 bg-purple-600/20 text-purple-300 border border-purple-500/30 rounded-xl font-bold font-sans text-xs"
              >
                Verify Hardware Attestation Measurement
              </button>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex justify-between"><span>Confidential Enclave Node #01:</span><strong className="text-purple-300">AMD SEV-SNP (Attestation Valid)</strong></div>
              <div className="flex justify-between"><span>Confidential Enclave Node #02:</span><strong className="text-purple-300">Intel SGX (Attestation Valid)</strong></div>
              <div className="flex justify-between"><span>In-Memory JWT Secret Protection:</span><strong className="text-emerald-400">ENCRYPTED MEMORY DOMAIN ACTIVE</strong></div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 11: SIEM SOAR THREATS
          ========================================================================= */}
      {activeTab === "SIEM_SOAR_THREATS" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 font-mono text-xs">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-sans">
                <ShieldAlert size={18} className="text-rose-400" /> SIEM & SOAR Automated Threat Containment Feed
              </h3>
              <button
                type="button"
                onClick={() => setSiemPlaybookModal({ threatId: "THREAT-SOAR-801" })}
                className="px-3 py-1.5 bg-rose-600/20 text-rose-300 border border-rose-500/30 rounded-xl font-bold font-sans text-xs"
              >
                Execute Emergency Drop Playbook
              </button>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex justify-between"><span>Active Containment Rule #01:</span><strong className="text-rose-400">Revoke Token on Brute Force Attempt (ACTIVE)</strong></div>
              <div className="flex justify-between"><span>Active Containment Rule #02:</span><strong className="text-emerald-400">eBPF Drop Rule on Untrusted WAN IPs (ENFORCING)</strong></div>
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
              <Layers size={18} className="text-cyan-400" /> Microsegmentation & SPIFFE mTLS Identity Enforcer
            </h3>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex justify-between"><span>SPIFFE ID Domain:</span><strong className="text-cyan-300">spiffe://medtrack.internal/ns/prod/sa/auth-service</strong></div>
              <div className="flex justify-between"><span>mTLS Certificate Renewal:</span><strong className="text-emerald-400">AUTOMATIC 1-HOUR ROTATION (ACTIVE)</strong></div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 13: AUDIT LEDGER
          ========================================================================= */}
      {activeTab === "AUDIT_LEDGER" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 font-mono text-xs">
            <h3 className="text-base font-bold text-white flex items-center gap-2 font-sans">
              <FileCheck size={18} className="text-emerald-400" /> HIPAA & 21 CFR Part 11 Cryptographic Audit Trail
            </h3>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex justify-between text-slate-400 border-b border-slate-800 pb-2">
                <span>Timestamp</span>
                <span>Event Action</span>
                <span>Cryptographic Hash</span>
              </div>
              <div className="flex justify-between text-white">
                <span>2026-08-16 11:35:00</span>
                <span className="text-emerald-400 font-bold">DPoP Bound JWT Token Issued</span>
                <span>0x98f4a1209bca71029481</span>
              </div>
              <div className="flex justify-between text-white">
                <span>2026-08-16 11:30:00</span>
                <span className="text-cyan-300 font-bold">FIDO2 Hardware Passkey Assertion Verified</span>
                <span>0x77a1029bca710294812</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rotate Master Auth Keys Modal */}
      {kmsRotateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full text-slate-100 space-y-4 shadow-2xl font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-cyan-400 font-sans">Rotate Master Authentication Keys</h3>
              <button type="button" onClick={() => setKmsRotateModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div>Key Cluster: <strong className="text-white">HSM-CLUSTER-ALPHA</strong></div>
              <div>Algorithm: <span className="text-cyan-300">Dilithium-5 / Kyber-1024</span></div>
              <div>Action: <span className="text-emerald-400">GENERATE_NEW_KEYPAIR_AND_RESEAL</span></div>
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
                  setNotification({ type: "success", message: "Master authentication keys rotated and re-bound across API Gateways!" });
                }}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold text-xs font-sans shadow-lg shadow-cyan-600/20"
              >
                Execute Master Key Rotation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Token Inspect Modal */}
      {tokenInspectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full text-slate-100 space-y-4 shadow-2xl font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white font-sans">JWT Token Claims Inspection</h3>
              <button type="button" onClick={() => setTokenInspectModal(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div>JTI Token ID: <strong className="text-white">{tokenInspectModal.tokenId}</strong></div>
              <div>Subject: <span className="text-cyan-300">{tokenInspectModal.subject}</span></div>
              <div>DPoP Proof Hash: <span className="text-amber-300">{tokenInspectModal.dpopProofHash}</span></div>
              <div>Algorithm: <span className="text-emerald-400">{tokenInspectModal.algorithm}</span></div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setTokenInspectModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs font-sans"
              >
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FIDO2 Register Modal */}
      {fido2RegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full text-slate-100 space-y-4 shadow-2xl font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-cyan-400 font-sans">Register Hardware FIDO2 Passkey</h3>
              <button type="button" onClick={() => setFido2RegisterModal(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div>WebAuthn Challenge: <span className="text-cyan-300">0x99f0124bca7102948120</span></div>
              <div>User Verification: <span className="text-emerald-400">REQUIRED (PIN / Biometric)</span></div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setFido2RegisterModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs font-sans"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MFA Config Modal */}
      {mfaConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full text-slate-100 space-y-4 shadow-2xl font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-emerald-400 font-sans">Configure MFA Step-Up Policy</h3>
              <button type="button" onClick={() => setMfaConfigModal(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div>Policy ID: <strong className="text-white">{mfaConfigModal.policyId}</strong></div>
              <div>Rule Enforcement: <span className="text-emerald-400 font-bold">MANDATORY_STRICT_MFA</span></div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setMfaConfigModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs font-sans"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CARTA Risk Modal */}
      {cartaRiskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full text-slate-100 space-y-4 shadow-2xl font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-cyan-400 font-sans">CARTA AI Anomaly Inspection</h3>
              <button type="button" onClick={() => setCartaRiskModal(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div>Target Session: <strong className="text-white">{cartaRiskModal.sessionId}</strong></div>
              <div>AI Anomaly Predictor: <span className="text-rose-400 font-bold">UNUSUAL_GEO_VELOCITY_ALERT</span></div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setCartaRiskModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs font-sans"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SAML IDP Modal */}
      {samlIdpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full text-slate-100 space-y-4 shadow-2xl font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-amber-400 font-sans">SAML IdP Metadata Certificate Audit</h3>
              <button type="button" onClick={() => setSamlIdpModal(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div>IDP Identifier: <strong className="text-white">{samlIdpModal.idpId}</strong></div>
              <div>X.509 Signature: <span className="text-emerald-400 font-bold">VALID RSA-SHA256 (Expires 2029)</span></div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSamlIdpModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs font-sans"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Policy Eval Modal */}
      {policyEvalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full text-slate-100 space-y-4 shadow-2xl font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-indigo-400 font-sans">ABAC Policy Evaluation Engine</h3>
              <button type="button" onClick={() => setPolicyEvalModal(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div>Rule: <strong className="text-white">{policyEvalModal.ruleId}</strong></div>
              <div>Evaluation Decision: <span className="text-emerald-400 font-bold">PERMIT (0.28ms Execution Time)</span></div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setPolicyEvalModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs font-sans"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SCIM Sync Modal */}
      {scimSyncModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full text-slate-100 space-y-4 shadow-2xl font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-cyan-400 font-sans">SCIM 2.0 Identity Reconciliation</h3>
              <button type="button" onClick={() => setScimSyncModal(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div>Sync Protocol: <strong className="text-white">RFC 7644 SCIM REST API</strong></div>
              <div>Result: <span className="text-emerald-400 font-bold">100% IDENTITIES RECONCILED WITH OKTA & ENTRA ID</span></div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setScimSyncModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs font-sans"
              >
                Close
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
              <div>Enclave Node: <strong className="text-white">{enclaveAuditModal.enclaveId}</strong></div>
              <div>Measurement Status: <span className="text-emerald-400 font-bold">GENUINE AMD SEV-SNP HARDWARE ENCLAVE</span></div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setEnclaveAuditModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs font-sans"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SIEM Playbook Modal */}
      {siemPlaybookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full text-slate-100 space-y-4 shadow-2xl font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-rose-400 font-sans">SOAR Playbook Execution</h3>
              <button type="button" onClick={() => setSiemPlaybookModal(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div>Target Threat: <strong className="text-rose-400">{siemPlaybookModal.threatId}</strong></div>
              <div>Playbook Execution: <span className="text-emerald-400 font-bold">CONTAINED & THREAT DROPPED</span></div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSiemPlaybookModal(null)}
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

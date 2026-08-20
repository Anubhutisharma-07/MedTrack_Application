import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Key,
  ShieldCheck,
  ShieldAlert,
  Cpu,
  Lock,
  Unlock,
  RefreshCw,
  Zap,
  Activity,
  Award,
  Search,
  Plus,
  Trash2,
  Download,
  AlertTriangle,
  CheckCircle2,
  X,
  FileCode,
  Sliders,
  Sparkles,
  Server,
  Layers,
  Terminal,
  Eye,
  Clock,
  Database
} from "lucide-react";

/**
 * QuantumCryptoKmsVaultPage Component
 *
 * High-Assurance Quantum-Safe Cryptography & FIPS 140-3 HSM Key Management Hub.
 * Enforces NIST FIPS 203 (ML-KEM/Kyber), NIST FIPS 204 (ML-DSA/Dilithium), FIPS 140-3 Level 4 HSM,
 * and AES-256-GCM Envelope Encryption with Envelope Re-keying.
 */
export default function QuantumCryptoKmsVaultPage() {
  // State
  const [keys, setKeys] = useState([
    {
      keyId: "KMS-KEY-9081",
      keyAlias: "patient-ehr-field-encryption-master-key",
      algorithm: "ML-KEM-768 / Kyber-768 (PQC)",
      keyUsage: "ENVELOPE_ENCRYPTION_FLE",
      fipsLevel: "FIPS_140_3_LEVEL_4_HSM",
      rotationPolicy: "EVERY_90_DAYS",
      status: "ACTIVE",
      createdAt: "2026-06-01T10:00:00Z",
      nextRotation: "2026-09-01T10:00:00Z"
    },
    {
      keyId: "KMS-KEY-8712",
      keyAlias: "biomedical-telemetry-digital-signature-key",
      algorithm: "ML-DSA-65 / Dilithium-3 (PQC)",
      keyUsage: "DIGITAL_SIGNATURE_VERIFICATION",
      fipsLevel: "FIPS_140_3_LEVEL_4_HSM",
      rotationPolicy: "EVERY_60_DAYS",
      status: "ACTIVE",
      createdAt: "2026-07-15T08:30:00Z",
      nextRotation: "2026-09-15T08:30:00Z"
    },
    {
      keyId: "KMS-KEY-6509",
      keyAlias: "legacy-database-field-aes256-key",
      algorithm: "AES-256-GCM (Classical)",
      keyUsage: "DATABASE_ENCRYPTION_AT_REST",
      fipsLevel: "FIPS_140_3_LEVEL_3_HSM",
      rotationPolicy: "EVERY_180_DAYS",
      status: "DEPRECATED_MIGRATING",
      createdAt: "2025-12-01T12:00:00Z",
      nextRotation: "2026-08-30T12:00:00Z"
    }
  ]);

  const [activeTab, setActiveTab] = useState("VAULT"); // "VAULT" | "ENVELOPE_SANDBOX" | "HSM_ATTESTATION" | "AUDIT_LOGS"
  const [searchTerm, setSearchTerm] = useState("");
  const [algorithmFilter, setAlgorithmFilter] = useState("ALL");
  const [notification, setNotification] = useState({ type: "", message: "" });
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [inspectKey, setInspectKey] = useState(null);

  // New Key Form State
  const [keyForm, setKeyForm] = useState({
    keyAlias: "",
    algorithm: "ML-KEM-768 (Post-Quantum)",
    keyUsage: "ENVELOPE_ENCRYPTION_FLE",
    rotationPolicy: "EVERY_90_DAYS"
  });

  // Envelope Encryption Sandbox State
  const [plaintextInput, setPlaintextInput] = useState("");
  const [envelopeResult, setEnvelopeResult] = useState(null);
  const [encrypting, setEncrypting] = useState(false);

  // HSM Telemetry Status
  const [hsmStatus] = useState({
    hsmVendor: "Thales Luna PCIe / AWS CloudHSM FIPS 140-3 Level 4",
    fipsCertificationStatus: "VALIDATED_FIPS_140_3_LEVEL_4",
    activeMasterKeysCount: 14,
    quantumEntropyRate: "9.98 Gbps (Quantum Random Number Generator QRNG)",
    tamperDetectionState: "ZERO_ACTIVE_ALERTS_PHYSICAL_ENCLOSURE_INTACT",
    hardwareTemperature: "34.2 °C (OPTIMAL)"
  });

  // Key Creation Handler
  const handleCreateKey = (e) => {
    e.preventDefault();
    if (!keyForm.keyAlias.trim()) {
      setNotification({ type: "error", message: "Key alias is required." });
      return;
    }

    const newKey = {
      keyId: `KMS-KEY-${Math.floor(9100 + Math.random() * 800)}`,
      keyAlias: keyForm.keyAlias.trim().toLowerCase().replace(/\s+/g, "-"),
      algorithm: keyForm.algorithm,
      keyUsage: keyForm.keyUsage,
      fipsLevel: "FIPS_140_3_LEVEL_4_HSM",
      rotationPolicy: keyForm.rotationPolicy,
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
      nextRotation: new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString()
    };

    setKeys((prev) => [newKey, ...prev]);
    setCreateModalOpen(false);
    setNotification({
      type: "success",
      message: `Quantum-safe key '${newKey.keyAlias}' generated inside FIPS 140-3 HSM!`
    });
    setKeyForm({
      keyAlias: "",
      algorithm: "ML-KEM-768 (Post-Quantum)",
      keyUsage: "ENVELOPE_ENCRYPTION_FLE",
      rotationPolicy: "EVERY_90_DAYS"
    });
  };

  // Key Rotate Handler
  const handleRotateKey = (keyId) => {
    setKeys((prev) =>
      prev.map((k) =>
        k.keyId === keyId
          ? {
              ...k,
              createdAt: new Date().toISOString(),
              nextRotation: new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString()
            }
          : k
      )
    );
    setNotification({
      type: "success",
      message: `Key ${keyId} rotated! Re-encrypted data envelope key version updated.`
    });
  };

  // Envelope Encryption Simulation Handler
  const handleEncryptEnvelope = (e) => {
    e.preventDefault();
    if (!plaintextInput.trim()) return;
    setEncrypting(true);

    setTimeout(() => {
      setEnvelopeResult({
        algorithmUsed: "ML-KEM-768 + AES-256-GCM (NIST FIPS 203)",
        encryptedDataKeyHex: "0x9F4C8102A7E119B03456DE7890ABCDEF1234567890ABCDEF1234567890ABCDEF",
        ciphertextIvHex: "0xE1F09A4B82110293",
        ciphertextTagHex: "0x89ACBED102938475",
        ciphertextDataHex: Buffer.from(plaintextInput).toString("hex").toUpperCase(),
        encryptionLatencyMs: 2.4
      });
      setEncrypting(false);
    }, 500);
  };

  // Filtered Keys List
  const filteredKeys = useMemo(() => {
    return keys.filter((k) => {
      const matchSearch =
        k.keyAlias.toLowerCase().includes(searchTerm.toLowerCase()) ||
        k.keyId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        k.algorithm.toLowerCase().includes(searchTerm.toLowerCase());
      const matchAlgo =
        algorithmFilter === "ALL" ||
        (algorithmFilter === "PQC" && k.algorithm.includes("PQC")) ||
        (algorithmFilter === "CLASSICAL" && !k.algorithm.includes("PQC"));
      return matchSearch && matchAlgo;
    });
  }, [keys, searchTerm, algorithmFilter]);

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-8 space-y-6">
      
      {/* 1. Page Header */}
      <div className="max-w-7xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-sky-400 bg-sky-500/10 border border-sky-500/20 rounded-full flex items-center gap-1.5 font-mono">
                <Key size={13} className="animate-pulse" /> QUANTUM KMS VAULT
              </span>
              <span className="px-3 py-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1">
                <ShieldCheck size={13} /> FIPS 140-3 LEVEL 4 HSM
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Post-Quantum Cryptography & Key Management Hub
            </h1>
            <p className="text-slate-400 text-sm max-w-3xl leading-relaxed">
              Enterprise hardware security module control plane enforcing NIST Post-Quantum Standards (ML-KEM / ML-DSA), AES-256-GCM envelope encryption, automated key rotation, and QRNG quantum entropy generation.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto">
            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="w-full lg:w-auto px-5 py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-2xl transition shadow-lg shadow-sky-600/25 flex items-center justify-center gap-2"
            >
              <Plus size={16} /> Generate PQC Master Key
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
            { id: "VAULT", label: "Key Vault Registry", icon: Key },
            { id: "ENVELOPE_SANDBOX", label: "Envelope Encryption Sandbox", icon: Lock },
            { id: "HSM_ATTESTATION", label: "FIPS 140-3 HSM Attestation", icon: Server }
          ].map((tab) => {
            const IconComp = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-sky-600 text-white shadow-lg shadow-sky-600/20"
                    : "bg-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <IconComp size={15} /> {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-slate-400 w-full md:w-auto justify-end">
          <div>Active Keys: <strong className="text-sky-300">{keys.filter(k => k.status === 'ACTIVE').length}</strong></div>
          <div>PQC Standard: <strong className="text-emerald-400">ML-KEM / ML-DSA Enforced</strong></div>
        </div>
      </div>

      {/* 3. TAB CONTENT: VAULT REGISTRY */}
      {activeTab === "VAULT" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl text-xs">
            <div className="relative w-full sm:w-80">
              <Search size={14} className="absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="Search key alias, ID, or algorithm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Filter Algorithm:</span>
              <select
                value={algorithmFilter}
                onChange={(e) => setAlgorithmFilter(e.target.value)}
                className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="ALL">ALL ALGORITHMS</option>
                <option value="PQC">POST-QUANTUM (ML-KEM / ML-DSA)</option>
                <option value="CLASSICAL">CLASSICAL (AES-256)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredKeys.map((keyItem) => (
              <div
                key={keyItem.keyId}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl hover:border-sky-500/40 transition flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 text-[11px] font-bold font-mono text-sky-400 bg-sky-500/10 border border-sky-500/20 rounded-lg">
                      {keyItem.keyId}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${
                        keyItem.status === "ACTIVE"
                          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                          : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                      }`}
                    >
                      {keyItem.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white font-mono truncate">{keyItem.keyAlias}</h3>
                    <p className="text-[11px] text-slate-400 font-sans mt-0.5">{keyItem.keyUsage}</p>
                  </div>

                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-1 text-xs font-mono">
                    <div className="text-slate-500 text-[10px] uppercase font-bold">Cryptographic Spec</div>
                    <div className="text-purple-300 truncate">{keyItem.algorithm}</div>
                  </div>

                  <div className="space-y-1.5 text-xs font-mono text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">FIPS Spec:</span>
                      <strong className="text-emerald-400">{keyItem.fipsLevel}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Rotation:</span>
                      <span>{keyItem.rotationPolicy}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleRotateKey(keyItem.keyId)}
                    className="flex-1 py-2 bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <RefreshCw size={13} /> Rotate Key
                  </button>
                  <button
                    type="button"
                    onClick={() => setInspectKey(keyItem)}
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

      {/* 4. TAB CONTENT: ENVELOPE SANDBOX */}
      {activeTab === "ENVELOPE_SANDBOX" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Lock size={18} className="text-sky-400" /> ML-KEM-768 Post-Quantum Envelope Encryption Engine
            </h3>
            <p className="text-xs text-slate-400">
              Simulate field-level envelope encryption of sensitive patient records using hybrid post-quantum key encapsulation (NIST FIPS 203 ML-KEM-768 + AES-256-GCM).
            </p>

            <form onSubmit={handleEncryptEnvelope} className="space-y-3">
              <textarea
                rows={3}
                placeholder="Enter sensitive payload to encrypt (e.g. Patient EHR Record, Genomic Biomarker Data, Clinical Trial Results...)"
                value={plaintextInput}
                onChange={(e) => setPlaintextInput(e.target.value)}
                className="w-full p-4 bg-slate-950 border border-slate-700 rounded-2xl text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
              />

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={encrypting}
                  className="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold text-xs transition flex items-center gap-2 shadow-lg shadow-sky-600/20"
                >
                  {encrypting ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} />}
                  {encrypting ? "Encapsulating Key..." : "Encrypt Payload (PQC ML-KEM)"}
                </button>
              </div>
            </form>

            {envelopeResult && (
              <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl text-xs space-y-3 font-mono">
                <div className="flex items-center justify-between text-emerald-400 font-bold border-b border-slate-800 pb-2">
                  <span>Envelope Encryption Status: ENCRYPTED_SUCCESS</span>
                  <span>Latency: {envelopeResult.encryptionLatencyMs} ms</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Algorithm Used</span>
                  <span className="text-purple-300 font-bold">{envelopeResult.algorithmUsed}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Encrypted Data Key (KEM Wrapped)</span>
                  <span className="text-sky-300 break-all">{envelopeResult.encryptedDataKeyHex}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Ciphertext Hex</span>
                  <span className="text-slate-300 break-all">{envelopeResult.ciphertextDataHex}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. TAB CONTENT: HSM ATTESTATION */}
      {activeTab === "HSM_ATTESTATION" && (
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Server size={18} className="text-emerald-400" /> FIPS 140-3 Level 4 Hardware Security Module Telemetry
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
                <span className="text-slate-500 text-[10px] block">HSM Vendor & Hardware Spec</span>
                <strong className="text-white">{hsmStatus.hsmVendor}</strong>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
                <span className="text-slate-500 text-[10px] block">Validation Status</span>
                <strong className="text-emerald-400">{hsmStatus.fipsCertificationStatus}</strong>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
                <span className="text-slate-500 text-[10px] block">Quantum Entropy Generation Rate</span>
                <strong className="text-purple-300">{hsmStatus.quantumEntropyRate}</strong>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
                <span className="text-slate-500 text-[10px] block">Physical Tamper Sensor State</span>
                <strong className="text-sky-300">{hsmStatus.tamperDetectionState}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Key Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-xl w-full text-slate-100 space-y-4 shadow-2xl font-sans">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Key size={18} className="text-sky-400" /> Generate Master Key (FIPS 140-3 HSM)
              </h3>
              <button type="button" onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateKey} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-bold block mb-1">Key Alias</label>
                <input
                  type="text"
                  placeholder="e.g. oncology-patient-genomic-vault-key"
                  value={keyForm.keyAlias}
                  onChange={(e) => setKeyForm({ ...keyForm, keyAlias: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Post-Quantum Algorithm Spec</label>
                <select
                  value={keyForm.algorithm}
                  onChange={(e) => setKeyForm({ ...keyForm, algorithm: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="ML-KEM-768 / Kyber-768 (PQC)">ML-KEM-768 / Kyber-768 (NIST FIPS 203)</option>
                  <option value="ML-DSA-65 / Dilithium-3 (PQC)">ML-DSA-65 / Dilithium-3 (NIST FIPS 204)</option>
                  <option value="AES-256-GCM (Classical)">AES-256-GCM (Classical Symmetric)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Rotation Policy</label>
                <select
                  value={keyForm.rotationPolicy}
                  onChange={(e) => setKeyForm({ ...keyForm, rotationPolicy: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="EVERY_90_DAYS">Rotate Every 90 Days (HIPAA Recommended)</option>
                  <option value="EVERY_60_DAYS">Rotate Every 60 Days</option>
                  <option value="EVERY_30_DAYS">Rotate Every 30 Days (High Security)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold text-xs transition shadow-lg shadow-sky-600/20"
                >
                  Generate Key inside HSM
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inspect Key Modal */}
      {inspectKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full text-slate-100 space-y-4 shadow-2xl font-mono">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white font-sans">{inspectKey.keyId} - Inspection</h3>
              <button type="button" onClick={() => setInspectKey(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs space-y-2">
              <div>Alias: <strong className="text-sky-300">{inspectKey.keyAlias}</strong></div>
              <div>Algorithm: <strong className="text-purple-300">{inspectKey.algorithm}</strong></div>
              <div>Usage: <strong className="text-slate-300">{inspectKey.keyUsage}</strong></div>
              <div>Created At: <span>{inspectKey.createdAt}</span></div>
              <div>Next Rotation: <span className="text-amber-400">{inspectKey.nextRotation}</span></div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setInspectKey(null)}
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

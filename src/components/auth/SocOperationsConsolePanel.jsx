import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  ShieldAlert,
  Radio,
  Activity,
  Server,
  Cloud,
  Terminal,
  Zap,
  Globe,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  RefreshCw,
  Search,
  Download,
  Filter,
  Layers,
  ChevronRight,
  Eye,
  Sliders,
  Database,
  Cpu,
  ArrowUpRight,
  X,
  FileCode,
  ShieldCheck,
  UserCheck,
  Network
} from "lucide-react";
import {
  getAllPolicies,
  getAllTunnels,
  evaluateTrafficAccess,
  quarantineSourceSegment,
  getViolationLogs,
  getEbpfMatrix,
  getAuditMetrics
} from "../../services/MicrosegmentationService";
import "../../pages/auth/auth.css";

/**
 * SocOperationsConsolePanel Component
 *
 * High-Assurance Next-Gen Security Operations Center (SOC) Unified Command Console.
 * Integrates SIEM Log Correlation, CSPM Multi-Cloud Posture, CTI Threat Feeds, SOAR Containment Playbooks,
 * and Zero-Trust Microsegmentation & eBPF SDP Subsystem.
 * Enforces NIST SP 800-207, NIST SP 800-61 Rev. 2, ISO/IEC 27035:2023, and CIS Benchmarks.
 */
export default function SocOperationsConsolePanel() {
  // State
  const [activeTab, setActiveTab] = useState("OVERVIEW"); // "OVERVIEW" | "SIEM" | "CSPM" | "CTI" | "SOAR" | "ZTA"
  const [liveStreaming, setLiveStreaming] = useState(true);
  const [selectedSeverity, setSelectedSeverity] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [inspectModal, setInspectModal] = useState(null);
  const [notification, setNotification] = useState({ type: "", message: "" });
  const [lookupQuery, setLookupQuery] = useState("");
  const [lookupResult, setLookupResult] = useState(null);

  // Microsegmentation & Zero Trust State
  const [ztaPolicies, setZtaPolicies] = useState([]);
  const [ztaTunnels, setZtaTunnels] = useState([]);
  const [ztaViolations, setZtaViolations] = useState([]);
  const [ebpfMatrix, setEbpfMatrix] = useState(null);
  const [ztaMetrics, setZtaMetrics] = useState(null);
  const [ztaLoading, setZtaLoading] = useState(false);

  // ZTA Evaluation Form State
  const [evalForm, setEvalForm] = useState({
    sourceSegment: "PATIENT_PORTAL_DMZ",
    destinationSegment: "PROD_HEALTH_DB",
    protocol: "TCP",
    port: "5432",
    sourceIpAddress: "192.168.10.45"
  });
  const [evalResult, setEvalResult] = useState(null);

  // ZTA Quarantine Form State
  const [quarantineForm, setQuarantineForm] = useState({
    sourceSegment: "GUEST_WIFI_VLAN",
    quarantineReason: "Detected malicious port scanning anomaly",
    emergencyOperator: "SOC_ANALYST_OP_01",
    terminateActiveTunnels: true
  });
  const [quarantineResult, setQuarantineResult] = useState(null);

  // Fetch ZTA Subsystem Data
  const loadZtaData = useCallback(async () => {
    setZtaLoading(true);
    try {
      const [policies, tunnels, violations, matrix, metrics] = await Promise.all([
        getAllPolicies().catch(() => []),
        getAllTunnels().catch(() => []),
        getViolationLogs().catch(() => []),
        getEbpfMatrix().catch(() => null),
        getAuditMetrics().catch(() => null)
      ]);
      setZtaPolicies(policies);
      setZtaTunnels(tunnels);
      setZtaViolations(violations);
      setEbpfMatrix(matrix);
      setZtaMetrics(metrics);
    } catch (err) {
      // Fallback
    } finally {
      setZtaLoading(false);
    }
  }, []);

  useEffect(() => {
    loadZtaData();
  }, [loadZtaData]);

  // SIEM Alerts Stream State
  const [alerts, setAlerts] = useState([
    {
      id: "ALERT-90812",
      ruleName: "BRUTE_FORCE_SSH_ATTACK",
      severity: "CRITICAL",
      affectedHost: "198.51.100.45",
      affectedUser: "root",
      matchedCount: 14,
      status: "OPEN",
      timestamp: new Date().toISOString(),
      details: "Multiple failed authentication attempts detected within 3 minute window across edge gateway."
    },
    {
      id: "ALERT-87103",
      ruleName: "EXFILTRATION_PATIENT_RECORDS",
      severity: "HIGH",
      affectedHost: "s3://medtrack-patient-vault",
      affectedUser: "service_account_sync",
      matchedCount: 8,
      status: "ACKNOWLEDGED",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      details: "High volume data access anomaly detected from unrecognized IP block 203.0.113.88."
    },
    {
      id: "ALERT-65109",
      ruleName: "UNAUTHORIZED_PAM_ELEVATION",
      severity: "CRITICAL",
      affectedHost: "prod-db-cluster-01",
      affectedUser: "dr_smith_admin",
      matchedCount: 3,
      status: "RESOLVED",
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      details: "JIT privilege elevation request approved without valid emergency ticket correlation."
    }
  ]);

  // CSPM Misconfigurations State
  const [cspmFindings, setCspmFindings] = useState([
    {
      findingId: "CSPM-90102",
      accountNumber: "AWS-19203910",
      resourceId: "s3://medtrack-patient-vault",
      resourceType: "S3_BUCKET",
      severity: "CRITICAL",
      benchmark: "HIPAA_CLOUD_SECURITY",
      description: "Public read access enabled on patient data storage bucket",
      status: "OPEN",
      remediationCommand: "aws s3api put-public-access-block --bucket medtrack-patient-vault --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
    },
    {
      findingId: "CSPM-87105",
      accountNumber: "AWS-19203910",
      resourceId: "arn:aws:iam::19203910:role/AdminRole",
      resourceType: "IAM_ROLE",
      severity: "HIGH",
      benchmark: "CIS_AWS_FOUNDATIONS_1_5",
      description: "Wildcard IAM AdministratorAccess policy attached to worker node role",
      status: "OPEN",
      remediationCommand: "aws iam detach-role-policy --role-name AdminRole --policy-arn arn:aws:iam::aws:policy/AdministratorAccess"
    },
    {
      findingId: "CSPM-63101",
      accountNumber: "AZURE-TENANT-88192",
      resourceId: "/subscriptions/88192/resourceGroups/rg-ehr/providers/Microsoft.Sql/servers/sql-ehr-prod",
      resourceType: "AZURE_SQL",
      severity: "CRITICAL",
      benchmark: "CIS_AZURE_SECURITY_3_0",
      description: "Transparent Data Encryption (TDE) disabled on Azure SQL instance",
      status: "REMEDIATED",
      remediationCommand: "az sql db tde set --status Enabled --database ehr-db --server sql-ehr-prod --resource-group rg-ehr"
    }
  ]);

  // CTI Threat Indicators State
  const [ctiIndicators, setCtiIndicators] = useState([
    { value: "198.51.100.45", type: "IP_ADDRESS", category: "MALWARE_C2", confidence: 95, status: "ACTIVE" },
    { value: "bad-malware-domain.org", type: "DOMAIN_NAME", category: "PHISHING", confidence: 88, status: "ACTIVE" },
    { value: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", type: "FILE_HASH_SHA256", category: "RANSOMWARE", confidence: 99, status: "BLOCKED" },
    { value: "203.0.113.88", type: "IP_ADDRESS", category: "EXFILTRATION_ENDPOINT", confidence: 92, status: "ACTIVE" }
  ]);

  // SOAR Playbooks State
  const [playbooks, setPlaybooks] = useState([
    { id: "PB-01", name: "AUTOMATED_RANSOMWARE_ISOLATION", trigger: "MALWARE_DETECTION", status: "READY", executions: 12, lastRun: "2 hours ago" },
    { id: "PB-02", name: "TOKEN_REVOCATION_BURST_MITIGATION", trigger: "AUTH_ANOMALY", status: "READY", executions: 34, lastRun: "10 mins ago" },
    { id: "PB-03", name: "CONTAINER_EBPF_NETWORK_QUARANTINE", trigger: "POD_ESCAPE", status: "READY", executions: 5, lastRun: "1 day ago" }
  ]);

  // Live Pulse Simulation
  useEffect(() => {
    if (!liveStreaming) return;
    const interval = setInterval(() => {
      const sampleAlert = {
        id: `ALERT-${Math.floor(10000 + Math.random() * 90000)}`,
        ruleName: "ANOMALOUS_GEO_LOGIN_BURST",
        severity: Math.random() > 0.5 ? "HIGH" : "MEDIUM",
        affectedHost: "api-gateway-node-03",
        affectedUser: `user_doc_${Math.floor(Math.random() * 100)}`,
        matchedCount: Math.floor(Math.random() * 10) + 1,
        status: "OPEN",
        timestamp: new Date().toISOString(),
        details: "Concurrent login detected from two geographically distant IP endpoints within 15 seconds."
      };
      setAlerts((prev) => [sampleAlert, ...prev.slice(0, 14)]);
    }, 10000);

    return () => clearInterval(interval);
  }, [liveStreaming]);

  // Triage Alert Action
  const handleTriageAlert = (alertId, newStatus) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, status: newStatus } : a))
    );
    setNotification({
      type: "success",
      message: `Alert ${alertId} status updated to ${newStatus}.`
    });
  };

  // Remediate CSPM Finding Action
  const handleRemediateCspm = (findingId) => {
    setCspmFindings((prev) =>
      prev.map((f) => (f.findingId === findingId ? { ...f, status: "REMEDIATED" } : f))
    );
    setNotification({
      type: "success",
      message: `CSPM Finding ${findingId} remediated successfully.`
    });
  };

  // Run SOAR Playbook Action
  const handleRunPlaybook = (playbookName) => {
    setNotification({
      type: "success",
      message: `SOAR Playbook '${playbookName}' triggered. Containment active across cluster.`
    });
  };

  // CTI Lookup Handler
  const handlePerformLookup = (e) => {
    e.preventDefault();
    if (!lookupQuery.trim()) return;
    const found = ctiIndicators.find((i) => i.value.toLowerCase() === lookupQuery.trim().toLowerCase());
    if (found) {
      setLookupResult({
        found: true,
        indicator: found,
        risk: found.confidence >= 90 ? "CRITICAL" : "HIGH"
      });
    } else {
      setLookupResult({
        found: false,
        query: lookupQuery,
        risk: "CLEAN"
      });
    }
  };

  // ZTA Evaluation Handler
  const handleEvaluateTraffic = async (e) => {
    e.preventDefault();
    try {
      const res = await evaluateTrafficAccess(evalForm);
      setEvalResult(res);
      setNotification({
        type: "success",
        message: `Traffic evaluation completed: Access ${res.accessGranted ? "GRANTED" : "DENIED"}.`
      });
      loadZtaData();
    } catch (err) {
      setNotification({ type: "error", message: "Failed to evaluate traffic access." });
    }
  };

  // ZTA Quarantine Handler
  const handleQuarantineSegment = async (e) => {
    e.preventDefault();
    try {
      const res = await quarantineSourceSegment(quarantineForm);
      setQuarantineResult(res);
      setNotification({
        type: "success",
        message: `Segment ${res.quarantinedSegment} isolated under rule ${res.quarantineRuleId}.`
      });
      loadZtaData();
    } catch (err) {
      setNotification({ type: "error", message: "Emergency quarantine trigger failed." });
    }
  };

  // Filtered SIEM Alerts
  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      const matchSearch =
        a.ruleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.affectedHost.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.affectedUser.toLowerCase().includes(searchTerm.toLowerCase());
      const matchSev = selectedSeverity === "ALL" || a.severity === selectedSeverity;
      return matchSearch && matchSev;
    });
  }, [alerts, searchTerm, selectedSeverity]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* 1. Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden text-slate-100">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-sky-400 bg-sky-500/10 border border-sky-500/20 rounded-full flex items-center gap-1.5 font-mono">
                <Radio size={12} className="animate-pulse" /> SOC UNIFIED HUB
              </span>
              <span className="px-3 py-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1">
                <ShieldCheck size={12} /> NIST SP 800-207 / NIST SP 800-61
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Security Operations Center (SOC) Command Console
            </h2>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Unified cross-subsystem security telemetry dashboard orchestrating real-time SIEM log correlation, CSPM continuous posture assessment, CTI threat intelligence feeds, SOAR containment playbooks, and eBPF Zero-Trust microsegmentation.
            </p>
          </div>

          {/* Quick Metrics Badge */}
          <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl w-full lg:w-auto text-xs space-y-2 font-mono">
            <div className="flex items-center justify-between gap-6">
              <span className="text-slate-400 font-sans font-bold uppercase text-[10px]">Threat Level</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> ELEVATED (DEFCON 3)
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-700/80 text-[11px]">
              <div>Open Alerts: <strong className="text-amber-400">{alerts.filter(a => a.status === 'OPEN').length}</strong></div>
              <div>CSPM Posture: <strong className="text-sky-400">92.5%</strong></div>
              <div>ZTA Rules: <strong className="text-purple-300">{ztaPolicies.length} Active</strong></div>
              <div>SOAR Playbooks: <strong className="text-emerald-400">{playbooks.length} Ready</strong></div>
            </div>
          </div>
        </div>

        {/* Global Notifications */}
        {notification.message && (
          <div className="mt-6 p-4 rounded-xl text-sm font-medium flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} />
              <span>{notification.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotification({ type: "", message: "" })}
              className="text-slate-400 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>

      {/* 2. Navigation Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {[
            { id: "OVERVIEW", label: "Executive Overview", icon: Activity },
            { id: "SIEM", label: "SIEM Log Correlation", icon: ShieldAlert },
            { id: "ZTA", label: "Zero-Trust Microsegmentation", icon: Network },
            { id: "CSPM", label: "CSPM Cloud Posture", icon: Cloud },
            { id: "CTI", label: "Threat Intelligence", icon: Globe },
            { id: "SOAR", label: "SOAR Playbooks", icon: Zap }
          ].map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-sky-500 text-white shadow-lg shadow-sky-500/20"
                    : "bg-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <IconComponent size={15} /> {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={() => setLiveStreaming(!liveStreaming)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
              liveStreaming
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "bg-slate-800 text-slate-400 border border-slate-700"
            }`}
          >
            {liveStreaming ? <Pause size={13} /> : <Play size={13} />}
            {liveStreaming ? "Live Feeds Active" : "Feeds Paused"}
          </button>
        </div>
      </div>

      {/* 3. TAB CONTENT: OVERVIEW */}
      {activeTab === "OVERVIEW" && (
        <div className="space-y-6">
          {/* Key Metrics Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-bold uppercase tracking-wider">SIEM Events Logged</span>
                <ShieldAlert size={16} className="text-sky-400" />
              </div>
              <div className="text-2xl font-black text-white font-mono">1.48M</div>
              <p className="text-[11px] text-emerald-400 font-medium">↑ 12% vs last 24h average</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-bold uppercase tracking-wider">Zero Trust Segments</span>
                <Network size={16} className="text-purple-400" />
              </div>
              <div className="text-2xl font-black text-white font-mono">{ztaPolicies.length} Rules</div>
              <p className="text-[11px] text-purple-300 font-medium">NIST SP 800-207 eBPF Enforced</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-bold uppercase tracking-wider">Cloud Health Posture</span>
                <Cloud size={16} className="text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-white font-mono">92.5%</div>
              <p className="text-[11px] text-sky-400 font-medium">CIS AWS & Azure Compliant</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-bold uppercase tracking-wider">Auto-Playbooks Run</span>
                <Zap size={16} className="text-amber-400" />
              </div>
              <div className="text-2xl font-black text-white font-mono">51 Triggered</div>
              <p className="text-[11px] text-amber-300 font-medium">Avg containment &lt; 2.4s</p>
            </div>
          </div>

          {/* Cross-Subsystem Summary Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* SIEM Recent Fired Alerts */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldAlert size={18} className="text-sky-400" /> SIEM High-Priority Alerts
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveTab("SIEM")}
                  className="text-xs font-bold text-sky-400 hover:underline flex items-center gap-1"
                >
                  View All ({alerts.length}) <ChevronRight size={14} />
                </button>
              </div>

              <div className="space-y-3">
                {alerts.slice(0, 3).map((alert) => (
                  <div
                    key={alert.id}
                    className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white font-mono">{alert.id}</span>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                            alert.severity === "CRITICAL"
                              ? "bg-red-500/20 text-red-400 border border-red-500/30"
                              : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          }`}
                        >
                          {alert.severity}
                        </span>
                      </div>
                      <p className="text-slate-300 font-sans">{alert.ruleName}</p>
                      <span className="text-slate-500 text-[11px] font-mono">Host: {alert.affectedHost}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setInspectModal(alert)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-bold text-xs"
                    >
                      Details
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* ZTA Zero Trust Microsegmentation Quick View */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Network size={18} className="text-purple-400" /> Zero-Trust Network Microsegmentation
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveTab("ZTA")}
                  className="text-xs font-bold text-purple-400 hover:underline flex items-center gap-1"
                >
                  Manage ZTA Engine <ChevronRight size={14} />
                </button>
              </div>

              <div className="space-y-3">
                {ztaPolicies.slice(0, 3).map((policy) => (
                  <div
                    key={policy.ruleId}
                    className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between gap-3 text-xs font-mono"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-purple-400">{policy.ruleId}</span>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${policy.action === 'STRICT_ALLOW' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                          {policy.action}
                        </span>
                      </div>
                      <p className="text-slate-300 font-sans text-[11px] mt-1">
                        {policy.sourceSegment} → {policy.destinationSegment} ({policy.allowedProtocol}:{policy.portRange})
                      </p>
                    </div>

                    <span className="text-[10px] text-slate-400 font-sans font-bold px-2.5 py-1 bg-slate-800 rounded-lg">
                      {policy.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 4. TAB CONTENT: ZERO TRUST MICROSEGMENTATION (ZTA) */}
      {activeTab === "ZTA" && (
        <div className="space-y-6">
          {/* ZTA Traffic Evaluator & Emergency Quarantine Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Real-time Access Evaluator Form */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <Sliders size={18} className="text-sky-400" /> Real-time ZTA Traffic Evaluator
              </h3>

              <form onSubmit={handleEvaluateTraffic} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 font-bold block mb-1">Source Segment</label>
                    <input
                      type="text"
                      value={evalForm.sourceSegment}
                      onChange={(e) => setEvalForm({ ...evalForm, sourceSegment: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 font-bold block mb-1">Destination Segment</label>
                    <input
                      type="text"
                      value={evalForm.destinationSegment}
                      onChange={(e) => setEvalForm({ ...evalForm, destinationSegment: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-slate-400 font-bold block mb-1">Protocol</label>
                    <select
                      value={evalForm.protocol}
                      onChange={(e) => setEvalForm({ ...evalForm, protocol: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="TCP">TCP</option>
                      <option value="UDP">UDP</option>
                      <option value="ICMP">ICMP</option>
                      <option value="ALL">ALL</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 font-bold block mb-1">Port</label>
                    <input
                      type="text"
                      value={evalForm.port}
                      onChange={(e) => setEvalForm({ ...evalForm, port: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 font-bold block mb-1">Source IP</label>
                    <input
                      type="text"
                      value={evalForm.sourceIpAddress}
                      onChange={(e) => setEvalForm({ ...evalForm, sourceIpAddress: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold transition shadow-lg shadow-sky-600/20"
                >
                  Evaluate Traffic Access (NIST SP 800-207)
                </button>
              </form>

              {evalResult && (
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs space-y-2 font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Access Decision:</span>
                    <span className={`font-bold px-2 py-0.5 rounded ${evalResult.accessGranted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                      {evalResult.accessGranted ? "GRANTED (ALLOW)" : "DENIED (BLOCK)"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Matched Rule:</span>
                    <strong className="text-purple-300">{evalResult.matchedRuleId}</strong>
                  </div>
                  <p className="text-slate-300 font-sans text-[11px] pt-1 border-t border-slate-800/80">
                    Reason: {evalResult.evalReason}
                  </p>
                </div>
              )}
            </div>

            {/* Emergency Segment Quarantine Form */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <AlertTriangle size={18} className="text-red-400" /> Emergency Segment Quarantine Trigger
              </h3>

              <form onSubmit={handleQuarantineSegment} className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Target Segment to Isolate</label>
                  <input
                    type="text"
                    value={quarantineForm.sourceSegment}
                    onChange={(e) => setQuarantineForm({ ...quarantineForm, sourceSegment: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-bold block mb-1">Quarantine Reason</label>
                  <input
                    type="text"
                    value={quarantineForm.quarantineReason}
                    onChange={(e) => setQuarantineForm({ ...quarantineForm, quarantineReason: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <input
                    type="checkbox"
                    id="termTunnels"
                    checked={quarantineForm.terminateActiveTunnels}
                    onChange={(e) => setQuarantineForm({ ...quarantineForm, terminateActiveTunnels: e.target.checked })}
                    className="rounded border-slate-700 bg-slate-950 text-red-500 focus:ring-red-500"
                  />
                  <label htmlFor="termTunnels" className="text-slate-300 font-medium cursor-pointer">
                    Terminate active SDP tunnel sessions targeting this segment
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition shadow-lg shadow-red-600/20"
                >
                  Isolate & Quarantine Segment Immediately
                </button>
              </form>

              {quarantineResult && (
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs space-y-2 font-mono">
                  <div className="flex items-center justify-between text-emerald-400 font-bold">
                    <span>Quarantine Status:</span>
                    <span>{quarantineResult.quarantineStatus}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Rule Created:</span>
                    <strong className="text-red-400">{quarantineResult.quarantineRuleId}</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Terminated Tunnels:</span>
                    <strong>{quarantineResult.terminatedTunnelsCount} Sessions</strong>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* eBPF Bytecode Matrix Viewer & Violation Audit Logs */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Cpu size={18} className="text-purple-400" /> Kernel eBPF Bytecode Compiled Rule Matrix
              </h3>
              <button
                type="button"
                onClick={loadZtaData}
                className="text-xs font-bold text-purple-400 hover:underline flex items-center gap-1"
              >
                <RefreshCw size={12} /> Refresh eBPF Map
              </button>
            </div>

            {ebpfMatrix ? (
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs space-y-3 font-mono">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Engine: <strong className="text-sky-400">{ebpfMatrix.ebpfEngine}</strong></span>
                  <span>Active Rules Compiled: <strong className="text-emerald-400">{ebpfMatrix.activeRulesCompiled}</strong></span>
                </div>
                
                <div className="space-y-1.5 pt-2 border-t border-slate-800">
                  {ebpfMatrix.ebpfBytecodeMap?.map((entry, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[11px] bg-slate-900 p-2 rounded-lg">
                      <span className="text-purple-300">{entry.ebpfKey}</span>
                      <span className="text-amber-400 font-bold">{entry.ebpfValue}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">Loading eBPF matrix simulation...</p>
            )}
          </div>
        </div>
      )}

      {/* 5. TAB CONTENT: SIEM */}
      {activeTab === "SIEM" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl text-xs">
            <div className="relative w-full sm:w-80">
              <Search size={14} className="absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="Search rule name, host, or user..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Filter Severity:</span>
              {["ALL", "CRITICAL", "HIGH", "MEDIUM"].map((sev) => (
                <button
                  key={sev}
                  type="button"
                  onClick={() => setSelectedSeverity(sev)}
                  className={`px-3 py-1 rounded-xl font-bold transition ${
                    selectedSeverity === sev ? "bg-sky-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300 font-mono">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="p-4">Alert ID</th>
                    <th className="p-4">Severity</th>
                    <th className="p-4">Rule Name</th>
                    <th className="p-4">Affected Host</th>
                    <th className="p-4">Affected User</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Analyst Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredAlerts.map((alert) => (
                    <tr key={alert.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-4 font-bold text-sky-400">{alert.id}</td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 text-[10px] font-bold rounded-full border ${
                            alert.severity === "CRITICAL"
                              ? "bg-red-500/20 text-red-400 border-red-500/30"
                              : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                          }`}
                        >
                          {alert.severity}
                        </span>
                      </td>
                      <td className="p-4 text-white font-bold font-sans">{alert.ruleName}</td>
                      <td className="p-4 text-purple-300">{alert.affectedHost}</td>
                      <td className="p-4 text-slate-300">{alert.affectedUser}</td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                            alert.status === "OPEN"
                              ? "bg-red-500/20 text-red-400"
                              : alert.status === "ACKNOWLEDGED"
                              ? "bg-amber-500/20 text-amber-400"
                              : "bg-emerald-500/20 text-emerald-400"
                          }`}
                        >
                          {alert.status}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        {alert.status === "OPEN" && (
                          <button
                            type="button"
                            onClick={() => handleTriageAlert(alert.id, "ACKNOWLEDGED")}
                            className="px-2.5 py-1 bg-amber-600/20 text-amber-400 border border-amber-500/30 rounded-lg text-[11px] font-sans font-bold hover:bg-amber-600/30"
                          >
                            Acknowledge
                          </button>
                        )}
                        {alert.status !== "RESOLVED" && (
                          <button
                            type="button"
                            onClick={() => handleTriageAlert(alert.id, "RESOLVED")}
                            className="px-2.5 py-1 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-[11px] font-sans font-bold hover:bg-emerald-600/30"
                          >
                            Resolve
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 6. TAB CONTENT: CTI */}
      {activeTab === "CTI" && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Search size={18} className="text-purple-400" /> CTI Threat Indicator Reputation Lookup
            </h3>
            <form onSubmit={handlePerformLookup} className="flex gap-3">
              <input
                type="text"
                placeholder="Enter IP address, domain, or SHA256 file hash..."
                value={lookupQuery}
                onChange={(e) => setLookupQuery(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-xs transition"
              >
                Query Threat DB
              </button>
            </form>

            {lookupResult && (
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs space-y-2 font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Query Target:</span>
                  <strong className="text-white">{lookupResult.query || lookupResult.indicator?.value}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Threat Status:</span>
                  <span className={`font-bold px-2 py-0.5 rounded ${lookupResult.found ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                    {lookupResult.found ? `MATCH FOUND (${lookupResult.indicator.category})` : "NO MATCH (CLEAN)"}
                  </span>
                </div>
                {lookupResult.found && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Confidence Score:</span>
                    <strong className="text-purple-400">{lookupResult.indicator.confidence}% Confidence</strong>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 7. TAB CONTENT: SOAR */}
      {activeTab === "SOAR" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Zap size={18} className="text-amber-400" /> SOAR Automated Containment Playbooks
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {playbooks.map((pb) => (
              <div key={pb.id} className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-sky-400 font-bold">{pb.id}</span>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/20 text-emerald-400">
                    {pb.status}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white">{pb.name}</h4>
                <p className="text-[11px] text-slate-400">Trigger: {pb.trigger}</p>
                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-400">
                  <span>Executions: {pb.executions}</span>
                  <button
                    type="button"
                    onClick={() => handleRunPlaybook(pb.name)}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-sans font-bold text-xs"
                  >
                    Execute
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inspect Modal */}
      {inspectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full text-slate-100 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">{inspectModal.id} - Details</h3>
              <button type="button" onClick={() => setInspectModal(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{inspectModal.details}</p>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setInspectModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs"
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

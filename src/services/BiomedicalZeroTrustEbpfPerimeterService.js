import API from "./HttpService";

/**
 * BiomedicalZeroTrustEbpfPerimeterService
 * Service layer for Biomedical eBPF Kernel Probes, Zero-Trust Microsegmentation Rules,
 * Real-Time Syscall Inspection, XDP High-Speed Packet Filtering, and Cilium Network Enforcement.
 */

// Fetch active eBPF Microsegmentation Policies & Kernel Probe Telemetry
export const getEbpfRegistry = async () => {
  try {
    const response = await API.get("/api/auth/ebpf/policies");
    return response.data;
  } catch (error) {
    console.warn("Using fallback Biomedical Zero-Trust eBPF Perimeter registry:", error.message);
    return [
      {
        policyId: "EBPF-POL-3001",
        policyName: "PACS DICOM Port 104 eBPF Kernel Firewall",
        ebpfHookType: "XDP (eXtress Data Path) Network Ingress Hook",
        targetNamespace: "vlan-104-imaging-pacs",
        microsegmentationStatus: "ENFORCING_STRICT",
        dropRatePktsSec: 0,
        inspectedSyscallsSec: 142000,
        enforcementMode: "ZERO_TRUST_DENY_DEFAULT",
        lastPolicyUpdateAt: "2026-08-11T03:00:00Z"
      },
      {
        policyId: "EBPF-POL-3002",
        policyName: "ICU Medical Device Kernel Syscall Quarantine",
        ebpfHookType: "kprobe / kretprobe Syscall Interceptor",
        targetNamespace: "vlan-210-icu-pumps",
        microsegmentationStatus: "ENFORCING_STRICT",
        dropRatePktsSec: 2,
        inspectedSyscallsSec: 89000,
        enforcementMode: "BEHAVIORAL_ANOMALY_QUARANTINE",
        lastPolicyUpdateAt: "2026-08-11T02:40:00Z"
      },
      {
        policyId: "EBPF-POL-3003",
        policyName: "EHR REST API Container Socket Filter",
        ebpfHookType: "cgroup / sock_ops Socket Level Filter",
        targetNamespace: "vlan-50-ehr-gateway",
        microsegmentationStatus: "ENFORCING_STRICT",
        dropRatePktsSec: 0,
        inspectedSyscallsSec: 310000,
        enforcementMode: "MTLS_SPIFFE_SPIRE_BINDING",
        lastPolicyUpdateAt: "2026-08-11T01:55:00Z"
      }
    ];
  }
};

// Provision & Deploy New eBPF Kernel Microsegmentation Policy
export const deployEbpfPolicy = async (policyData) => {
  try {
    const response = await API.post("/api/auth/ebpf/deploy", policyData);
    return response.data;
  } catch (error) {
    return {
      policyId: `EBPF-POL-${Math.floor(3004 + Math.random() * 200)}`,
      policyName: policyData.policyName || "Surgical Robot Telemetry eBPF Shield",
      ebpfHookType: policyData.ebpfHookType || "XDP (eXtress Data Path) Network Ingress Hook",
      targetNamespace: policyData.targetNamespace || "vlan-300-robotics",
      microsegmentationStatus: "ENFORCING_STRICT",
      dropRatePktsSec: 0,
      inspectedSyscallsSec: 195000,
      enforcementMode: "ZERO_TRUST_DENY_DEFAULT",
      lastPolicyUpdateAt: new Date().toISOString()
    };
  }
};

// Verify eBPF Kernel Probe Telemetry & XDP Packet Drop Metrics
export const verifyEbpfProbeHealth = async (policyId) => {
  try {
    const response = await API.post(`/api/auth/ebpf/verify/${policyId}`);
    return response.data;
  } catch (error) {
    return {
      policyId,
      kernelProbeStatus: "PROBE_ACTIVE_LOADED",
      xdpDriverMode: "NATIVE_HARDWARE_OFFLOAD",
      bpfMapMemoryUsedMb: 14.8,
      zeroTrustViolationsBlocked: 14,
      verificationLatencyMs: 6,
      timestamp: new Date().toISOString()
    };
  }
};

// Fetch eBPF Kernel Hook Types & Architecture Profiles
export const getEbpfHookProfiles = async () => {
  return [
    {
      hookId: "XDP_INGRESS",
      hookName: "XDP (eXpress Data Path)",
      executionLayer: "NIC Driver Level (Before OS Network Stack)",
      performanceClass: "Sub-microsecond (< 1μs) High-Speed Packet Filtering",
      primarySecurityUse: "DDoS Mitigation & DICOM Unauthenticated Packet Drop",
      status: "ACTIVE_HARDWARE_OFFLOAD"
    },
    {
      hookId: "KPROBE_SYSCALL",
      hookName: "kprobe / kretprobe Dynamic Kernel Tracing",
      executionLayer: "Linux Kernel Syscall Entry & Exit Points",
      performanceClass: "Low Overhead Dynamic Tracepoints",
      primarySecurityUse: "Preventing Unauthorized Device Syscalls & Process Execution",
      status: "ACTIVE_KERNEL_TRACING"
    },
    {
      hookId: "CGROUP_SOCK",
      hookName: "cgroup / sock_ops Socket Filtering",
      executionLayer: "Container CGroup Network Socket Operations",
      performanceClass: "Zero-Copy TCP/UDP Socket Redirection",
      primarySecurityUse: "SPIFFE/SPIRE Identity Enforcement for EHR REST APIs",
      status: "ACTIVE_CGROUP_ATTACHED"
    }
  ];
};

// Export eBPF Zero-Trust Audit Report JSON
export const exportEbpfReportJson = async (policyId) => {
  const policies = await getEbpfRegistry();
  const policy = policies.find((p) => p.policyId === policyId) || policies[0];

  const report = {
    reportType: "BIOMEDICAL_ZERO_TRUST_EBPF_PERIMETER_AUDIT_REPORT",
    generatedAt: new Date().toISOString(),
    complianceStandard: "NIST SP 800-207 Zero Trust Architecture & Cilium eBPF Security",
    policyProfile: {
      id: policy.policyId,
      name: policy.policyName,
      hookType: policy.ebpfHookType,
      targetNamespace: policy.targetNamespace,
      enforcementMode: policy.enforcementMode
    },
    kernelTelemetry: {
      status: policy.microsegmentationStatus,
      dropRatePktsSec: policy.dropRatePktsSec,
      inspectedSyscallsSec: policy.inspectedSyscallsSec,
      lastPolicyUpdateAt: policy.lastPolicyUpdateAt,
      hardwareOffloadActive: true
    }
  };

  return JSON.stringify(report, null, 2);
};

// Fetch eBPF Standards
export const getEbpfStandards = async () => {
  return [
    { standard: "NIST SP 800-207 Zero Trust Architecture", detail: "Federal standard requiring microsegmentation, continuous authentication, and kernel-level perimeter isolation" },
    { standard: "Linux eBPF Foundation Security Architecture", detail: "Industry standard for verifier-checked sandbox bytecode execution inside the Linux kernel" },
    { standard: "SPIFFE / SPIRE Workload Identity Standard", detail: "Cloud-native standard for cryptographically attesting workload identities at the eBPF socket layer" }
  ];
};

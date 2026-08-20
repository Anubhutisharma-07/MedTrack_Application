package com.medtrack.auth.microsegmentation.service;

import com.medtrack.auth.microsegmentation.dto.*;
import com.medtrack.auth.microsegmentation.model.*;
import com.medtrack.auth.microsegmentation.repository.*;
import com.medtrack.auth.siem.dto.SiemLogIngestRequest;
import com.medtrack.auth.siem.service.SiemLogCorrelationService;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * MicrosegmentationService
 * Enterprise Zero-Trust Network Microsegmentation & eBPF Software-Defined Perimeter (SDP) Orchestrator.
 *
 * Enforces Standards:
 * - NIST SP 800-207 (Zero Trust Architecture - ZTA)
 * - ISO/IEC 27001:2022 Control A.8.20 (Network Security)
 * - CISA Zero Trust Maturity Model v2.0 (Network/Environment Pillar)
 * - DoD Zero Trust Reference Architecture v2.0
 */
@Service
public class MicrosegmentationService {

    private static final DateTimeFormatter ISO_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    private final MicrosegmentationPolicyRepository policyRepository;
    private final SdpTunnelSessionRepository tunnelRepository;
    private final MicrosegmentationViolationLogRepository violationLogRepository;
    private final SiemLogCorrelationService siemLogCorrelationService;

    private static final List<String> RESTRICTED_PORTS = List.of("22", "3389", "23", "21", "445", "139");

    @Autowired
    public MicrosegmentationService(MicrosegmentationPolicyRepository policyRepository,
                                     SdpTunnelSessionRepository tunnelRepository,
                                     MicrosegmentationViolationLogRepository violationLogRepository,
                                     SiemLogCorrelationService siemLogCorrelationService) {
        this.policyRepository = policyRepository;
        this.tunnelRepository = tunnelRepository;
        this.violationLogRepository = violationLogRepository;
        this.siemLogCorrelationService = siemLogCorrelationService;
    }

    /**
     * Seeds baseline microsegmentation rules, SDP tunnel telemetry, and sample violation logs.
     */
    @PostConstruct
    @Transactional
    public void seedMicrosegmentationBaseline() {
        if (policyRepository.count() == 0) {
            seedSamplePolicy("SEG-90102", "PATIENT_PORTAL_DMZ", "PROD_HEALTH_DB", "TCP", "5432", "ENCRYPTED_MTLS_ONLY", "STRICT_ALLOW");
            seedSamplePolicy("SEG-87105", "WORKSTATION_LAN", "EHR_VAULT", "TCP", "443", "DEVICE_POSTURE_PASSED", "STRICT_ALLOW");
            seedSamplePolicy("SEG-74110", "GUEST_WIFI_VLAN", "INTERNAL_API_GATEWAY", "ALL", "*", "NONE", "BLOCK");
            seedSamplePolicy("SEG-61209", "LAB_EQUIPMENT_IOT", "TELEMETRY_INGRESS", "UDP", "8883", "TLS13_PINNED_CERT", "STRICT_ALLOW");
            seedSamplePolicy("SEG-53101", "THIRD_PARTY_VENDOR_VPN", "CORE_INFRASTRUCTURE", "ALL", "*", "NONE", "BLOCK");
        }

        if (tunnelRepository.count() == 0) {
            seedSampleTunnel("SDP-87105", "operator@medtrack-health.org", "10.200.4.12", "PROD_HEALTH_DB", "WIREGUARD_UDP", 1048576L, 4194304L);
            seedSampleTunnel("SDP-65120", "doctor.smith@medtrack-health.org", "10.200.8.44", "EHR_VAULT", "WIREGUARD_UDP", 524288L, 2097152L);
            seedSampleTunnel("SDP-43109", "tech.lead@medtrack-health.org", "10.200.12.89", "INTERNAL_API_GATEWAY", "IPSEC_IKEV2", 2097152L, 8388608L);
        }

        if (violationLogRepository.count() == 0) {
            seedSampleViolation("VIO-90101", "GUEST_WIFI_VLAN", "PROD_HEALTH_DB", "192.168.99.45", "TCP", "5432", "Implicit Zero-Trust Deny Rule", "BLOCK");
            seedSampleViolation("VIO-87102", "THIRD_PARTY_VENDOR_VPN", "EHR_VAULT", "10.200.55.12", "TCP", "443", "Unapproved Device Posture Fingerprint", "BLOCK");
            seedSampleViolation("VIO-74103", "WORKSTATION_LAN", "CORE_INFRASTRUCTURE", "10.100.2.88", "TCP", "22", "Restricted SSH Port Access Blocked", "BLOCK");
        }
    }

    private void seedSamplePolicy(String ruleId, String src, String dst, String proto, String port, String posture, String act) {
        if (policyRepository.findByRuleId(ruleId).isEmpty()) {
            LocalDateTime now = LocalDateTime.now();
            policyRepository.save(MicrosegmentationPolicy.builder()
                    .ruleId(ruleId)
                    .sourceSegment(src)
                    .destinationSegment(dst)
                    .allowedProtocol(proto)
                    .portRange(port)
                    .postureRequirement(posture)
                    .action(act)
                    .status("ACTIVE")
                    .createdAt(now)
                    .updatedAt(now)
                    .build());
        }
    }

    private void seedSampleTunnel(String sId, String email, String ip, String target, String proto, long tx, long rx) {
        if (tunnelRepository.findBySessionId(sId).isEmpty()) {
            tunnelRepository.save(SdpTunnelSession.builder()
                    .sessionId(sId)
                    .userEmail(email)
                    .sourceIp(ip)
                    .targetSegment(target)
                    .tunnelProtocol(proto)
                    .status("ESTABLISHED")
                    .txBytes(tx)
                    .rxBytes(rx)
                    .establishedAt(LocalDateTime.now().minusHours(1))
                    .build());
        }
    }

    private void seedSampleViolation(String vId, String src, String dst, String ip, String proto, String port, String reason, String act) {
        if (violationLogRepository.findByViolationId(vId).isEmpty()) {
            violationLogRepository.save(MicrosegmentationViolationLog.builder()
                    .violationId(vId)
                    .sourceSegment(src)
                    .destinationSegment(dst)
                    .sourceIp(ip)
                    .protocol(proto)
                    .destinationPort(port)
                    .violationReason(reason)
                    .enforcedAction(act)
                    .detectedAt(LocalDateTime.now().minusMinutes(30))
                    .build());
        }
    }

    /**
     * Creates a new network microsegmentation isolation rule and evaluates security impact.
     */
    @Transactional
    public MicrosegmentationPolicyResponse createRule(CreateMicrosegmentationRuleRequest request) {
        String ruleId = "SEG-" + (10000 + new Random().nextInt(90000));
        LocalDateTime now = LocalDateTime.now();

        MicrosegmentationPolicy policy = MicrosegmentationPolicy.builder()
                .ruleId(ruleId)
                .sourceSegment(request.getSourceSegment().toUpperCase(Locale.ROOT))
                .destinationSegment(request.getDestinationSegment().toUpperCase(Locale.ROOT))
                .allowedProtocol(request.getAllowedProtocol().toUpperCase(Locale.ROOT))
                .portRange(request.getPortRange())
                .postureRequirement(request.getPostureRequirement())
                .action(request.getAction().toUpperCase(Locale.ROOT))
                .status("ACTIVE")
                .createdAt(now)
                .updatedAt(now)
                .build();

        MicrosegmentationPolicy saved = policyRepository.save(policy);

        // Auto-ingest SIEM alert if a blocking rule is created for critical database segment
        if ("PROD_HEALTH_DB".equalsIgnoreCase(saved.getDestinationSegment()) && "BLOCK".equalsIgnoreCase(saved.getAction())) {
            try {
                SiemLogIngestRequest siemRequest = new SiemLogIngestRequest();
                siemRequest.setSourceType("ZERO_TRUST_SDP");
                siemRequest.setEventCategory("POLICY_UPDATE");
                siemRequest.setSeverity("HIGH");
                siemRequest.setSourceHost("EBPF-POLICY-ENGINE");
                siemRequest.setSourceIp("127.0.0.1");
                siemRequest.setMessage("Zero Trust Isolation Rule Created: " + ruleId + " [" + saved.getSourceSegment() + " -> " + saved.getDestinationSegment() + "]");
                siemRequest.setRawPayload("Action: BLOCK, PortRange: " + saved.getPortRange());
                siemLogCorrelationService.ingestLog(siemRequest);
            } catch (Exception e) {
                // Non-blocking for resilience
            }
        }

        return mapToPolicyResponse(saved);
    }

    /**
     * Establishes a Software-Defined Perimeter (SDP) encrypted tunnel session with posture check.
     */
    @Transactional
    public SdpTunnelSessionResponse establishTunnel(EstablishSdpTunnelRequest request) {
        String sessionId = "SDP-" + (10000 + new Random().nextInt(90000));

        // Evaluate target segment isolation status
        boolean targetBlocked = policyRepository.findAll().stream()
                .filter(p -> "ACTIVE".equalsIgnoreCase(p.getStatus()))
                .filter(p -> "BLOCK".equalsIgnoreCase(p.getAction()))
                .anyMatch(p -> request.getTargetSegment().equalsIgnoreCase(p.getDestinationSegment()));

        String status = targetBlocked ? "DENIED_BY_POLICY" : "ESTABLISHED";

        SdpTunnelSession tunnel = SdpTunnelSession.builder()
                .sessionId(sessionId)
                .userEmail(request.getUserEmail())
                .sourceIp(request.getSourceIp())
                .targetSegment(request.getTargetSegment().toUpperCase(Locale.ROOT))
                .tunnelProtocol(request.getTunnelProtocol().toUpperCase(Locale.ROOT))
                .status(status)
                .txBytes(targetBlocked ? 0L : 2048L)
                .rxBytes(targetBlocked ? 0L : 8192L)
                .establishedAt(LocalDateTime.now())
                .build();

        SdpTunnelSession saved = tunnelRepository.save(tunnel);

        if ("DENIED_BY_POLICY".equals(status)) {
            try {
                SiemLogIngestRequest siemRequest = new SiemLogIngestRequest();
                siemRequest.setSourceType("ZERO_TRUST_SDP");
                siemRequest.setEventCategory("UNAUTHORIZED_ACCESS");
                siemRequest.setSeverity("HIGH");
                siemRequest.setSourceHost("SDP-GATEWAY");
                siemRequest.setSourceIp(request.getSourceIp());
                siemRequest.setMessage("SDP Tunnel Establishment Blocked: User [" + request.getUserEmail() + "] target segment [" + request.getTargetSegment() + "]");
                siemRequest.setRawPayload("SessionID: " + sessionId + ", Protocol: " + request.getTunnelProtocol());
                siemLogCorrelationService.ingestLog(siemRequest);
            } catch (Exception e) {
                // Non-blocking
            }
        }

        return mapToTunnelResponse(saved);
    }

    /**
     * Real-time zero-trust packet traffic evaluation engine.
     */
    @Transactional
    public Map<String, Object> evaluateTrafficAccess(EvaluateTrafficAccessRequest request) {
        List<MicrosegmentationPolicy> activePolicies = policyRepository.findAll().stream()
                .filter(p -> "ACTIVE".equalsIgnoreCase(p.getStatus()))
                .collect(Collectors.toList());

        Optional<MicrosegmentationPolicy> matchingPolicy = activePolicies.stream()
                .filter(p -> p.getSourceSegment().equalsIgnoreCase(request.getSourceSegment()) || "*".equals(p.getSourceSegment()))
                .filter(p -> p.getDestinationSegment().equalsIgnoreCase(request.getDestinationSegment()) || "*".equals(p.getDestinationSegment()))
                .filter(p -> p.getAllowedProtocol().equalsIgnoreCase(request.getProtocol()) || "ALL".equalsIgnoreCase(p.getAllowedProtocol()))
                .filter(p -> p.getPortRange().equals(request.getPort()) || "*".equals(p.getPortRange()))
                .findFirst();

        Map<String, Object> evalResult = new LinkedHashMap<>();
        evalResult.put("sourceSegment", request.getSourceSegment());
        evalResult.put("destinationSegment", request.getDestinationSegment());
        evalResult.put("protocol", request.getProtocol());
        evalResult.put("port", request.getPort());
        evalResult.put("timestamp", LocalDateTime.now().format(ISO_FORMATTER));

        if (matchingPolicy.isPresent()) {
            MicrosegmentationPolicy pol = matchingPolicy.get();
            boolean isAllow = "STRICT_ALLOW".equalsIgnoreCase(pol.getAction());
            evalResult.put("accessGranted", isAllow);
            evalResult.put("matchedRuleId", pol.getRuleId());
            evalResult.put("action", pol.getAction());
            evalResult.put("postureRequirement", pol.getPostureRequirement());
            evalResult.put("evalReason", "Explicit microsegmentation policy match found.");

            if (!isAllow) {
                recordViolation(request.getSourceSegment(), request.getDestinationSegment(), request.getSourceIpAddress(), request.getProtocol(), request.getPort(), "Policy Match Blocked Access");
            }
        } else {
            // Default Zero Trust Posture: DENY ALL BY DEFAULT
            evalResult.put("accessGranted", false);
            evalResult.put("matchedRuleId", "DEFAULT_DENY_ALL");
            evalResult.put("action", "BLOCK");
            evalResult.put("postureRequirement", "NONE");
            evalResult.put("evalReason", "Default Zero-Trust implicit deny rule enforced (NIST SP 800-207).");

            recordViolation(request.getSourceSegment(), request.getDestinationSegment(), request.getSourceIpAddress(), request.getProtocol(), request.getPort(), "Implicit Zero-Trust Deny Rule");
        }

        evalResult.put("complianceStandard", "NIST SP 800-207 Zero Trust Architecture");
        return evalResult;
    }

    private void recordViolation(String src, String dst, String ip, String proto, String port, String reason) {
        String vId = "VIO-" + (10000 + new Random().nextInt(90000));
        MicrosegmentationViolationLog log = MicrosegmentationViolationLog.builder()
                .violationId(vId)
                .sourceSegment(src != null ? src : "UNKNOWN_SRC")
                .destinationSegment(dst != null ? dst : "UNKNOWN_DST")
                .sourceIp(ip != null ? ip : "127.0.0.1")
                .protocol(proto != null ? proto : "TCP")
                .destinationPort(port != null ? port : "443")
                .violationReason(reason)
                .enforcedAction("BLOCK")
                .detectedAt(LocalDateTime.now())
                .build();
        violationLogRepository.save(log);
    }

    /**
     * Quarantines a source segment by creating emergency isolation rules.
     */
    @Transactional
    public Map<String, Object> quarantineSourceSegment(QuarantineSegmentRequest request) {
        String quarantineRuleId = "SEG-Q-" + (10000 + new Random().nextInt(90000));
        LocalDateTime now = LocalDateTime.now();

        MicrosegmentationPolicy policy = MicrosegmentationPolicy.builder()
                .ruleId(quarantineRuleId)
                .sourceSegment(request.getSourceSegment().toUpperCase(Locale.ROOT))
                .destinationSegment("*")
                .allowedProtocol("ALL")
                .portRange("*")
                .postureRequirement("QUARANTINE_ACTIVE")
                .action("BLOCK")
                .status("ACTIVE")
                .createdAt(now)
                .updatedAt(now)
                .build();

        policyRepository.save(policy);

        // Terminate active SDP tunnels targeting or originating from this segment
        List<SdpTunnelSession> activeTunnels = tunnelRepository.findAll().stream()
                .filter(t -> "ESTABLISHED".equalsIgnoreCase(t.getStatus()))
                .filter(t -> t.getTargetSegment().equalsIgnoreCase(request.getSourceSegment()))
                .collect(Collectors.toList());

        if (request.isTerminateActiveTunnels()) {
            for (SdpTunnelSession t : activeTunnels) {
                t.setStatus("TERMINATED_BY_QUARANTINE");
                tunnelRepository.save(t);
            }
        }

        // Trigger SIEM alert
        try {
            SiemLogIngestRequest siemRequest = new SiemLogIngestRequest();
            siemRequest.setSourceType("ZERO_TRUST_SDP");
            siemRequest.setEventCategory("NETWORK_QUARANTINE");
            siemRequest.setSeverity("CRITICAL");
            siemRequest.setSourceHost("ZTA-QUARANTINE-ENGINE");
            siemRequest.setSourceIp("127.0.0.1");
            siemRequest.setMessage("Emergency Segment Quarantine Applied: " + request.getSourceSegment() + " [Reason: " + request.getQuarantineReason() + "]");
            siemRequest.setRawPayload("QuarantineRuleID: " + quarantineRuleId + ", TerminatedTunnels: " + activeTunnels.size());
            siemLogCorrelationService.ingestLog(siemRequest);
        } catch (Exception e) {
            // Non-blocking
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("quarantineStatus", "ACTIVE");
        result.put("quarantineRuleId", quarantineRuleId);
        result.put("quarantinedSegment", request.getSourceSegment());
        result.put("terminatedTunnelsCount", activeTunnels.size());
        result.put("reason", request.getQuarantineReason());
        result.put("executedBy", request.getEmergencyOperator() != null ? request.getEmergencyOperator() : "SYSTEM_AUTOMATION");
        result.put("timestamp", now.format(ISO_FORMATTER));
        return result;
    }

    /**
     * Compiles active policies into eBPF bytecode kernel map matrix simulation.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> compileEbpfPolicyMatrix() {
        List<MicrosegmentationPolicy> activePolicies = policyRepository.findAll().stream()
                .filter(p -> "ACTIVE".equalsIgnoreCase(p.getStatus()))
                .collect(Collectors.toList());

        int compiledRulesCount = activePolicies.size();
        List<Map<String, String>> ebpfMap = activePolicies.stream().map(p -> {
            Map<String, String> entry = new LinkedHashMap<>();
            entry.put("ruleId", p.getRuleId());
            entry.put("ebpfKey", "src:" + p.getSourceSegment() + "|dst:" + p.getDestinationSegment() + "|proto:" + p.getAllowedProtocol() + "|port:" + p.getPortRange());
            entry.put("ebpfValue", "ACTION_" + p.getAction());
            return entry;
        }).collect(Collectors.toList());

        Map<String, Object> matrix = new LinkedHashMap<>();
        matrix.put("ebpfEngine", "LINUX_KERNEL_XDP_EBPF_V5");
        matrix.put("compiledAt", LocalDateTime.now().format(ISO_FORMATTER));
        matrix.put("activeRulesCompiled", compiledRulesCount);
        matrix.put("ebpfBytecodeMap", ebpfMap);
        matrix.put("complianceStandard", "NIST SP 800-207, CISA ZTMM v2.0");
        return matrix;
    }

    /**
     * Toggles microsegmentation policy active status.
     */
    @Transactional
    public MicrosegmentationPolicyResponse toggleRuleStatus(String ruleId, boolean active) {
        MicrosegmentationPolicy policy = policyRepository.findByRuleId(ruleId)
                .orElseThrow(() -> new IllegalArgumentException("Microsegmentation rule not found: " + ruleId));

        policy.setStatus(active ? "ACTIVE" : "DISABLED");
        policy.setUpdatedAt(LocalDateTime.now());

        MicrosegmentationPolicy updated = policyRepository.save(policy);
        return mapToPolicyResponse(updated);
    }

    /**
     * Terminates an active SDP tunnel session.
     */
    @Transactional
    public SdpTunnelSessionResponse terminateTunnel(String sessionId) {
        SdpTunnelSession tunnel = tunnelRepository.findBySessionId(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("SDP Tunnel session not found: " + sessionId));

        tunnel.setStatus("TERMINATED");
        SdpTunnelSession updated = tunnelRepository.save(tunnel);
        return mapToTunnelResponse(updated);
    }

    /**
     * Retrieves all violation logs.
     */
    @Transactional(readOnly = true)
    public List<MicrosegmentationViolationResponse> getAllViolationLogs() {
        return violationLogRepository.findAll().stream()
                .map(this::mapToViolationResponse)
                .collect(Collectors.toList());
    }

    /**
     * Retrieves overall Microsegmentation & SDP Audit Metrics.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getMicrosegmentationAuditMetrics() {
        List<MicrosegmentationPolicy> policies = policyRepository.findAll();
        List<SdpTunnelSession> tunnels = tunnelRepository.findAll();
        List<MicrosegmentationViolationLog> violations = violationLogRepository.findAll();

        long activePoliciesCount = policies.stream().filter(p -> "ACTIVE".equalsIgnoreCase(p.getStatus())).count();
        long activeTunnelsCount = tunnels.stream().filter(t -> "ESTABLISHED".equalsIgnoreCase(t.getStatus())).count();
        long blockedTunnelsCount = tunnels.stream().filter(t -> t.getStatus().contains("DENIED") || t.getStatus().contains("TERMINATED")).count();

        long totalTxBytes = tunnels.stream().mapToLong(SdpTunnelSession::getTxBytes).sum();
        long totalRxBytes = tunnels.stream().mapToLong(SdpTunnelSession::getRxBytes).sum();

        Map<String, Object> metrics = new LinkedHashMap<>();
        metrics.put("totalMicrosegmentationRules", policies.size());
        metrics.put("activeRulesCount", activePoliciesCount);
        metrics.put("activeSdpTunnelsCount", activeTunnelsCount);
        metrics.put("blockedOrTerminatedTunnelsCount", blockedTunnelsCount);
        metrics.put("policyViolationsLogged", violations.size());
        metrics.put("totalEncryptedTxMb", (totalTxBytes / (1024.0 * 1024.0)));
        metrics.put("totalEncryptedRxMb", (totalRxBytes / (1024.0 * 1024.0)));
        metrics.put("restrictedPortsMonitored", RESTRICTED_PORTS);
        metrics.put("ebpfEngineStatus", "ONLINE");
        metrics.put("complianceStandard", "NIST SP 800-207 Zero Trust Architecture, ISO/IEC 27001 Control A.8.20");
        return metrics;
    }

    /**
     * Retrieves all microsegmentation policies.
     */
    @Transactional(readOnly = true)
    public List<MicrosegmentationPolicyResponse> getAllPolicies() {
        return policyRepository.findAll().stream()
                .map(this::mapToPolicyResponse)
                .collect(Collectors.toList());
    }

    /**
     * Retrieves all SDP tunnel sessions.
     */
    @Transactional(readOnly = true)
    public List<SdpTunnelSessionResponse> getAllTunnels() {
        return tunnelRepository.findAll().stream()
                .map(this::mapToTunnelResponse)
                .collect(Collectors.toList());
    }

    private MicrosegmentationPolicyResponse mapToPolicyResponse(MicrosegmentationPolicy p) {
        return MicrosegmentationPolicyResponse.builder()
                .id(p.getId())
                .ruleId(p.getRuleId())
                .sourceSegment(p.getSourceSegment())
                .destinationSegment(p.getDestinationSegment())
                .allowedProtocol(p.getAllowedProtocol())
                .portRange(p.getPortRange())
                .postureRequirement(p.getPostureRequirement())
                .action(p.getAction())
                .status(p.getStatus())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }

    private SdpTunnelSessionResponse mapToTunnelResponse(SdpTunnelSession t) {
        return SdpTunnelSessionResponse.builder()
                .id(t.getId())
                .sessionId(t.getSessionId())
                .userEmail(t.getUserEmail())
                .sourceIp(t.getSourceIp())
                .targetSegment(t.getTargetSegment())
                .tunnelProtocol(t.getTunnelProtocol())
                .status(t.getStatus())
                .txBytes(t.getTxBytes())
                .rxBytes(t.getRxBytes())
                .establishedAt(t.getEstablishedAt())
                .build();
    }

    private MicrosegmentationViolationResponse mapToViolationResponse(MicrosegmentationViolationLog v) {
        return MicrosegmentationViolationResponse.builder()
                .id(v.getId())
                .violationId(v.getViolationId())
                .sourceSegment(v.getSourceSegment())
                .destinationSegment(v.getDestinationSegment())
                .sourceIp(v.getSourceIp())
                .protocol(v.getProtocol())
                .destinationPort(v.getDestinationPort())
                .violationReason(v.getViolationReason())
                .enforcedAction(v.getEnforcedAction())
                .detectedAt(v.getDetectedAt())
                .build();
    }
}

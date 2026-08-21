package com.medtrack.auth.siem.service;

import com.medtrack.auth.siem.dto.SiemAlertTriageRequest;

import com.medtrack.auth.siem.dto.SiemCorrelationRuleRequest;
import com.medtrack.auth.siem.dto.SiemLogIngestRequest;
import com.medtrack.auth.siem.dto.SiemLogIngestResponse;
import com.medtrack.auth.siem.model.SiemCorrelationAlert;
import com.medtrack.auth.siem.model.SiemCorrelationRule;
import com.medtrack.auth.siem.model.SiemLogEvent;
import com.medtrack.auth.siem.repository.SiemCorrelationAlertRepository;
import com.medtrack.auth.siem.repository.SiemCorrelationRuleRepository;
import com.medtrack.auth.siem.repository.SiemLogEventRepository;
import com.medtrack.auth.soar.dto.SoarPlaybookExecutionRequest;
import com.medtrack.auth.soar.service.SoarOrchestrationService;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * SiemLogCorrelationService
 * Core SIEM (Security Information and Event Management) log correlation hub.
 *
 * Responsibilities:
 * 1. Normalize heterogeneous security log lines into a single canonical schema.
 * 2. Evaluate configured correlation rules over a sliding time window and raise
 *    alerts when thresholds are met (NIST SP 800-61 Rev. 2 detection, Section 2.3).
 * 3. Provide an analyst triage lifecycle (OPEN, ACKNOWLEDGED, RESOLVED) with
 *    full attribution and timestamps (ISO/IEC 27035:2023 incident management).
 * 4. Enforce log retention and audit metrics per NIST SP 800-92.
 * 5. Automate containment playbook execution via SOAR Orchestration integration.
 */
@Service
public class SiemLogCorrelationService {

    private static final DateTimeFormatter ISO_TIMESTAMP = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    private static final List<String> VALID_SEVERITIES = List.of("INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL");

    private static final List<String> VALID_CATEGORIES = List.of(
            "AUTH_FAILURE", "BRUTE_FORCE", "MALWARE", "EXFILTRATION",
            "PRIVILEGE_ESCALATION", "ANOMALY", "RECON", "DATA_ACCESS");

    private static final String COMPLIANCE_STANDARD = "NIST SP 800-61 Rev. 2, NIST SP 800-92, ISO/IEC 27035:2023";

    private final SiemLogEventRepository logEventRepository;
    private final SiemCorrelationRuleRepository correlationRuleRepository;
    private final SiemCorrelationAlertRepository correlationAlertRepository;
    private final SoarOrchestrationService soarOrchestrationService;

    @Autowired
    public SiemLogCorrelationService(SiemLogEventRepository logEventRepository,
                                     SiemCorrelationRuleRepository correlationRuleRepository,
                                     SiemCorrelationAlertRepository correlationAlertRepository,
                                     SoarOrchestrationService soarOrchestrationService) {
        this.logEventRepository = logEventRepository;
        this.correlationRuleRepository = correlationRuleRepository;
        this.correlationAlertRepository = correlationAlertRepository;
        this.soarOrchestrationService = soarOrchestrationService;
    }


    /**
     * Seed a baseline set of correlation rules on first startup so the hub is
     * operational out of the box. No-op once rules exist, keeping the rule set
     * analyst-controlled afterwards.
     */
    @PostConstruct
    public void seedDefaultRules() {
        if (correlationRuleRepository.count() > 0) {
            return;
        }
        createRule(rule("BRUTE_FORCE_ATTEMPT",
                "Detects five or more authentication failures from the same host within 10 minutes.",
                "HIGH", "AUTH_FAILURE", List.of("AUTH_SERVICE", "VPN"), List.of("failed", "invalid", "denied"), 10, 5));
        createRule(rule("MALWARE_DETECTION_SPIKE",
                "Detects three or more malware or quarantine events from the same host within 15 minutes.",
                "CRITICAL", "MALWARE", List.of("EDR", "IDS"), List.of("malware", "quarantine", "trojan", "ransomware"), 15, 3));
        createRule(rule("DATA_EXFILTRATION_ANOMALY",
                "Detects repeated outbound transfers flagged as exfiltration within 30 minutes.",
                "CRITICAL", "EXFILTRATION", List.of("DATABASE", "APPLICATION"), List.of("exfil", "transfer", "egress", "download"), 30, 2));
        createRule(rule("PRIVILEGE_ESCALATION_ANOMALY",
                "Detects privileged-role assignment or escalation events within 20 minutes.",
                "HIGH", "PRIVILEGE_ESCALATION", List.of("AUTH_SERVICE", "APPLICATION"), List.of("escalat", "sudo", "admin", "root"), 20, 2));
        createRule(rule("RECONNAISSANCE_SCAN",
                "Detects repeated reconnaissance or scan signatures from the same host within 10 minutes.",
                "MEDIUM", "RECON", List.of("IDS", "FIREWALL"), List.of("scan", "probe", "port"), 10, 10));
    }

    private SiemCorrelationRuleRequest rule(String name, String description, String severity,
                                            String category, List<String> sourceTypes,
                                            List<String> keywords, int windowMinutes, int threshold) {
        SiemCorrelationRuleRequest request = new SiemCorrelationRuleRequest();
        request.setRuleName(name);
        request.setDescription(description);
        request.setSeverity(severity);
        request.setEventCategory(category);
        request.setSourceTypes(sourceTypes);
        request.setMatchKeywords(keywords);
        request.setTimeWindowMinutes(windowMinutes);
        request.setThreshold(threshold);
        request.setEnabled(true);
        return request;
    }

    // ------------------------------------------------------------------
    // Log ingestion & normalization
    // ------------------------------------------------------------------

    /**
     * Ingest a single raw security log line: normalize it into the canonical
     * schema, persist it, and evaluate all enabled correlation rules against it.
     */
    @Transactional
    public SiemLogIngestResponse ingestLog(SiemLogIngestRequest request) {
        String eventId = "EVT-" + UUID.randomUUID().toString().replace("-", "");
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime eventTimestamp = request.getEventTimestamp() != null ? request.getEventTimestamp() : now;

        SiemLogEvent event = SiemLogEvent.builder()
                .eventId(eventId)
                .sourceType(normalizeSourceType(request.getSourceType()))
                .eventCategory(normalizeCategory(request.getEventCategory()))
                .severity(normalizeSeverity(request.getSeverity()))
                .sourceHost(request.getSourceHost())
                .sourceIp(request.getSourceIp())
                .destinationHost(request.getDestinationHost())
                .destinationIp(request.getDestinationIp())
                .username(request.getUsername())
                .tenantId(request.getTenantId() != null && !request.getTenantId().isBlank()
                        ? request.getTenantId() : "DEFAULT_TENANT")
                .eventTimestamp(eventTimestamp)
                .message(request.getMessage() != null ? request.getMessage() : "NO_MESSAGE")
                .rawPayload(request.getRawPayload())
                .ingestedAt(now)
                .build();

        SiemLogEvent saved = logEventRepository.save(event);

        List<String> triggeredRuleIds = new ArrayList<>();
        List<String> alertIds = new ArrayList<>();

        for (SiemCorrelationRule rule : correlationRuleRepository.findByEnabled(true)) {
            if (!ruleMatches(rule, saved)) {
                continue;
            }
            triggeredRuleIds.add(rule.getRuleId());
            int matchCount = countMatchesInWindow(rule, saved);
            if (matchCount >= rule.getThreshold() && findOpenAlertForRule(rule, saved).isEmpty()) {
                alertIds.add(createAlert(rule, saved, matchCount).getAlertId());
            }
        }

        SiemLogIngestResponse response = new SiemLogIngestResponse();
        response.setEventId(saved.getEventId());
        response.setIngestedAt(now.format(ISO_TIMESTAMP));
        response.setStatus("INGESTED");
        response.setNormalizationStatus("NORMALIZED");
        response.setTriggeredRules(triggeredRuleIds);
        response.setAlertIds(alertIds);
        response.setComplianceStandard(COMPLIANCE_STANDARD);
        return response;
    }

    /**
     * Ingest a batch of log lines in a single transaction and summarize the result.
     */
    @Transactional
    public Map<String, Object> ingestLogBatch(List<SiemLogIngestRequest> requests) {
        List<SiemLogIngestResponse> results = new ArrayList<>();
        int alertCount = 0;
        for (SiemLogIngestRequest request : requests) {
            SiemLogIngestResponse response = ingestLog(request);
            results.add(response);
            alertCount += response.getAlertIds().size();
        }
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("received", requests.size());
        summary.put("ingested", results.size());
        summary.put("alertsRaised", alertCount);
        summary.put("results", results);
        return summary;
    }

    // ------------------------------------------------------------------
    // Correlation rule evaluation
    // ------------------------------------------------------------------

    /**
     * True when the rule's category, source type, and keyword constraints all
     * match the given normalized event. A null/blank constraint matches anything.
     */
    private boolean ruleMatches(SiemCorrelationRule rule, SiemLogEvent event) {
        if (rule.getEventCategory() != null && !rule.getEventCategory().isBlank()
                && !rule.getEventCategory().equalsIgnoreCase(event.getEventCategory())) {
            return false;
        }
        List<String> sourceTypes = parseCsv(rule.getSourceTypesJson());
        if (!sourceTypes.isEmpty() && !sourceTypes.contains(event.getSourceType())) {
            return false;
        }
        List<String> keywords = parseCsv(rule.getMatchKeywordsJson());
        if (!keywords.isEmpty()) {
            String message = event.getMessage() != null
                    ? event.getMessage().toLowerCase(Locale.ROOT) : "";
            boolean anyKeyword = keywords.stream()
                    .anyMatch(k -> message.contains(k.toLowerCase(Locale.ROOT)));
            if (!anyKeyword) {
                return false;
            }
        }
        return true;
    }

    /**
     * Count matching events from the same source host within the rule's sliding
     * time window (the ingested event itself is included in the count).
     */
    private int countMatchesInWindow(SiemCorrelationRule rule, SiemLogEvent event) {
        int windowMinutes = rule.getTimeWindowMinutes() != null ? rule.getTimeWindowMinutes() : 10;
        LocalDateTime windowStart = event.getEventTimestamp().minusMinutes(windowMinutes);
        List<SiemLogEvent> candidates = logEventRepository.findByEventTimestampAfter(windowStart);
        int count = 0;
        for (SiemLogEvent candidate : candidates) {
            if (candidate.getEventTimestamp().isAfter(event.getEventTimestamp())) {
                continue;
            }
            if (event.getSourceHost() != null && candidate.getSourceHost() != null
                    && !event.getSourceHost().equalsIgnoreCase(candidate.getSourceHost())) {
                continue;
            }
            if (ruleMatches(rule, candidate)) {
                count++;
            }
        }
        return count;
    }

    /**
     * Raise and persist a new correlation alert for a fired rule.
     */
    private SiemCorrelationAlert createAlert(SiemCorrelationRule rule, SiemLogEvent event, int matchCount) {
        String affectedHost = event.getSourceHost() != null ? event.getSourceHost() : "UNKNOWN";
        String alertId = "ALERT-" + UUID.randomUUID().toString().replace("-", "");
        SiemCorrelationAlert alert = SiemCorrelationAlert.builder()
                .alertId(alertId)
                .ruleId(rule.getRuleId())
                .ruleName(rule.getRuleName())
                .severity(rule.getSeverity() != null ? rule.getSeverity() : event.getSeverity())
                .title("[" + rule.getSeverity() + "] " + rule.getRuleName())
                .description("Correlation rule '" + rule.getRuleName() + "' fired with " + matchCount
                        + " matching event(s) within " + rule.getTimeWindowMinutes() + " minute window. "
                        + "Affected host: " + affectedHost + ", category: " + event.getEventCategory() + ".")
                .matchedEventIdsJson(List.of(event.getEventId()).toString())
                .affectedHost(affectedHost)
                .affectedUser(event.getUsername())
                .status("OPEN")
                .matchedEventCount(matchCount)
                .createdAt(LocalDateTime.now())
                .build();

        SiemCorrelationAlert savedAlert = correlationAlertRepository.save(alert);

        // Cross-Subsystem Action: Auto-trigger SOAR Containment Playbook for HIGH and CRITICAL alerts
        if ("CRITICAL".equalsIgnoreCase(alert.getSeverity()) || "HIGH".equalsIgnoreCase(alert.getSeverity())) {
            try {
                SoarPlaybookExecutionRequest soarRequest = new SoarPlaybookExecutionRequest();
                soarRequest.setPlaybookName("AUTOMATED_SIEM_" + alert.getSeverity() + "_CONTAINMENT");
                soarRequest.setTriggerEvent("SIEM_CORRELATION_ALERT: " + alert.getTitle());
                soarRequest.setSeverity(alert.getSeverity());
                soarOrchestrationService.executePlaybook(soarRequest);
            } catch (Exception e) {
                // Non-blocking log for SOAR trigger resilience
            }
        }

        return savedAlert;
    }


    /**
     * Suppress alert storms: return an existing non-resolved alert for the same
     * rule and affected host instead of raising a duplicate.
     */
    private Optional<SiemCorrelationAlert> findOpenAlertForRule(SiemCorrelationRule rule, SiemLogEvent event) {
        List<SiemCorrelationAlert> candidates = new ArrayList<>();
        candidates.addAll(correlationAlertRepository.findByRuleIdAndStatus(rule.getRuleId(), "OPEN"));
        candidates.addAll(correlationAlertRepository.findByRuleIdAndStatus(rule.getRuleId(), "ACKNOWLEDGED"));
        for (SiemCorrelationAlert candidate : candidates) {
            if (event.getSourceHost() == null || event.getSourceHost().equalsIgnoreCase(candidate.getAffectedHost())) {
                return Optional.of(candidate);
            }
        }
        return Optional.empty();
    }

    /**
     * Dry-run correlation: evaluate a hypothetical event against all enabled
     * rules without persisting anything.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> dryRunCorrelation(SiemLogIngestRequest hypothetical) {
        SiemLogEvent synthetic = SiemLogEvent.builder()
                .eventId("DRY-RUN")
                .sourceType(normalizeSourceType(hypothetical.getSourceType()))
                .eventCategory(normalizeCategory(hypothetical.getEventCategory()))
                .severity(normalizeSeverity(hypothetical.getSeverity()))
                .sourceHost(hypothetical.getSourceHost())
                .username(hypothetical.getUsername())
                .message(hypothetical.getMessage() != null ? hypothetical.getMessage() : "")
                .eventTimestamp(LocalDateTime.now())
                .build();

        List<Map<String, Object>> matches = new ArrayList<>();
        for (SiemCorrelationRule rule : correlationRuleRepository.findByEnabled(true)) {
            if (ruleMatches(rule, synthetic)) {
                Map<String, Object> match = new LinkedHashMap<>();
                match.put("ruleId", rule.getRuleId());
                match.put("ruleName", rule.getRuleName());
                match.put("severity", rule.getSeverity());
                match.put("threshold", rule.getThreshold());
                match.put("timeWindowMinutes", rule.getTimeWindowMinutes());
                matches.add(match);
            }
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("mode", "DRY_RUN_CORRELATION");
        result.put("syntheticEventId", "DRY-RUN");
        result.put("matchingRules", matches);
        result.put("matchingRuleCount", matches.size());
        result.put("complianceStandard", COMPLIANCE_STANDARD);
        return result;
    }

    // ------------------------------------------------------------------
    // Log queries & retention
    // ------------------------------------------------------------------

    /**
     * List the most recent events, optionally filtered by source type,
     * severity, or event category.
     */
    @Transactional(readOnly = true)
    public List<SiemLogEvent> listLogs(String sourceType, String severity, String eventCategory, int limit) {
        List<SiemLogEvent> events = logEventRepository.findTop50ByOrderByEventTimestampDesc();
        if (sourceType != null && !sourceType.isBlank()) {
            events = events.stream()
                    .filter(e -> sourceType.equalsIgnoreCase(e.getSourceType()))
                    .collect(Collectors.toList());
        }
        if (severity != null && !severity.isBlank()) {
            events = events.stream()
                    .filter(e -> severity.equalsIgnoreCase(e.getSeverity()))
                    .collect(Collectors.toList());
        }
        if (eventCategory != null && !eventCategory.isBlank()) {
            events = events.stream()
                    .filter(e -> eventCategory.equalsIgnoreCase(e.getEventCategory()))
                    .collect(Collectors.toList());
        }
        return events.stream().limit(Math.max(limit, 1)).collect(Collectors.toList());
    }

    /**
     * Fetch a single normalized event, including its raw payload, by event id.
     */
    @Transactional(readOnly = true)
    public SiemLogEvent getLog(String eventId) {
        return logEventRepository.findByEventId(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Log event not found: " + eventId));
    }

    /**
     * Enforce NIST SP 800-92 log retention: purge events older than the given
     * number of days and report how many were removed.
     */
    @Transactional
    public Map<String, Object> purgeLogsBefore(int retentionDays) {
        int days = Math.max(retentionDays, 1);
        LocalDateTime cutoff = LocalDateTime.now().minusDays(days);
        long purged = logEventRepository.deleteByEventTimestampBefore(cutoff);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("retentionPolicyDays", days);
        result.put("cutoffTimestamp", cutoff.format(ISO_TIMESTAMP));
        result.put("purgedEventCount", purged);
        result.put("complianceStandard", "NIST SP 800-92 Log Retention");
        return result;
    }

    // ------------------------------------------------------------------
    // Correlation rule management
    // ------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<SiemCorrelationRule> listRules() {
        return correlationRuleRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional
    public SiemCorrelationRule createRule(SiemCorrelationRuleRequest request) {
        String ruleId = "RULE-" + UUID.randomUUID().toString().replace("-", "");
        SiemCorrelationRule rule = SiemCorrelationRule.builder()
                .ruleId(ruleId)
                .ruleName(request.getRuleName() != null ? request.getRuleName() : "UNNAMED_RULE")
                .description(request.getDescription() != null ? request.getDescription() : "")
                .severity(normalizeSeverity(request.getSeverity()))
                .eventCategory(request.getEventCategory() != null ? request.getEventCategory().toUpperCase(Locale.ROOT) : null)
                .sourceTypesJson(joinCsv(request.getSourceTypes()))
                .matchKeywordsJson(joinCsv(request.getMatchKeywords()))
                .timeWindowMinutes(request.getTimeWindowMinutes() != null ? request.getTimeWindowMinutes() : 10)
                .threshold(request.getThreshold() != null ? Math.max(request.getThreshold(), 1) : 3)
                .enabled(request.getEnabled() == null || request.getEnabled())
                .createdAt(LocalDateTime.now())
                .build();
        return correlationRuleRepository.save(rule);
    }

    @Transactional
    public SiemCorrelationRule updateRule(String ruleId, SiemCorrelationRuleRequest request) {
        SiemCorrelationRule rule = correlationRuleRepository.findByRuleId(ruleId)
                .orElseThrow(() -> new IllegalArgumentException("Correlation rule not found: " + ruleId));
        if (request.getRuleName() != null) {
            rule.setRuleName(request.getRuleName());
        }
        if (request.getDescription() != null) {
            rule.setDescription(request.getDescription());
        }
        if (request.getSeverity() != null) {
            rule.setSeverity(normalizeSeverity(request.getSeverity()));
        }
        if (request.getEventCategory() != null) {
            rule.setEventCategory(request.getEventCategory().toUpperCase(Locale.ROOT));
        }
        if (request.getSourceTypes() != null) {
            rule.setSourceTypesJson(joinCsv(request.getSourceTypes()));
        }
        if (request.getMatchKeywords() != null) {
            rule.setMatchKeywordsJson(joinCsv(request.getMatchKeywords()));
        }
        if (request.getTimeWindowMinutes() != null) {
            rule.setTimeWindowMinutes(request.getTimeWindowMinutes());
        }
        if (request.getThreshold() != null) {
            rule.setThreshold(Math.max(request.getThreshold(), 1));
        }
        if (request.getEnabled() != null) {
            rule.setEnabled(request.getEnabled());
        }
        return correlationRuleRepository.save(rule);
    }

    @Transactional
    public SiemCorrelationRule toggleRule(String ruleId) {
        SiemCorrelationRule rule = correlationRuleRepository.findByRuleId(ruleId)
                .orElseThrow(() -> new IllegalArgumentException("Correlation rule not found: " + ruleId));
        rule.setEnabled(!Boolean.TRUE.equals(rule.getEnabled()));
        return correlationRuleRepository.save(rule);
    }

    // ------------------------------------------------------------------
    // Alert triage
    // ------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<SiemCorrelationAlert> getAlerts(String status, String severity) {
        List<SiemCorrelationAlert> alerts = (status != null && !status.isBlank())
                ? correlationAlertRepository.findByStatusOrderByCreatedAtDesc(status.toUpperCase(Locale.ROOT))
                : correlationAlertRepository.findTop100ByOrderByCreatedAtDesc();
        if (severity != null && !severity.isBlank()) {
            String sev = severity.toUpperCase(Locale.ROOT);
            alerts = alerts.stream()
                    .filter(a -> sev.equalsIgnoreCase(a.getSeverity()))
                    .collect(Collectors.toList());
        }
        return alerts;
    }

    @Transactional(readOnly = true)
    public List<SiemCorrelationAlert> getOpenAlerts() {
        return correlationAlertRepository.findByStatusOrderByCreatedAtDesc("OPEN");
    }

    @Transactional
    public SiemCorrelationAlert acknowledgeAlert(String alertId, String analyst) {
        SiemCorrelationAlert alert = correlationAlertRepository.findByAlertId(alertId)
                .orElseThrow(() -> new IllegalArgumentException("Alert not found: " + alertId));
        if ("RESOLVED".equalsIgnoreCase(alert.getStatus())) {
            throw new IllegalArgumentException("Cannot acknowledge a resolved alert: " + alertId);
        }
        alert.setStatus("ACKNOWLEDGED");
        alert.setAcknowledgedAt(LocalDateTime.now());
        alert.setAcknowledgedBy(analyst != null && !analyst.isBlank() ? analyst : "SYSTEM");
        return correlationAlertRepository.save(alert);
    }

    @Transactional
    public SiemCorrelationAlert resolveAlert(String alertId, SiemAlertTriageRequest request) {
        SiemCorrelationAlert alert = correlationAlertRepository.findByAlertId(alertId)
                .orElseThrow(() -> new IllegalArgumentException("Alert not found: " + alertId));
        alert.setStatus("RESOLVED");
        alert.setResolvedAt(LocalDateTime.now());
        alert.setResolvedBy(request.getAnalyst() != null && !request.getAnalyst().isBlank()
                ? request.getAnalyst() : "SYSTEM");
        alert.setResolutionNotes(request.getResolutionNotes());
        return correlationAlertRepository.save(alert);
    }

    // ------------------------------------------------------------------
    // Audit metrics (NIST SP 800-61 Rev. 2 & ISO/IEC 27035:2023)
    // ------------------------------------------------------------------

    @Transactional(readOnly = true)
    public Map<String, Object> getSiemAuditMetrics() {
        List<SiemLogEvent> events = logEventRepository.findAll();
        List<SiemCorrelationRule> rules = correlationRuleRepository.findAll();
        List<SiemCorrelationAlert> alerts = correlationAlertRepository.findAll();

        Map<String, Long> severityCounts = events.stream()
                .collect(Collectors.groupingBy(SiemLogEvent::getSeverity, Collectors.counting()));
        Map<String, Long> categoryCounts = events.stream()
                .collect(Collectors.groupingBy(SiemLogEvent::getEventCategory, Collectors.counting()));
        Map<String, Long> sourceCounts = events.stream()
                .collect(Collectors.groupingBy(SiemLogEvent::getSourceType, Collectors.counting()));

        Map<String, Object> metrics = new LinkedHashMap<>();
        metrics.put("totalEventsIngested", events.size());
        metrics.put("severityDistribution", severityCounts);
        metrics.put("categoryDistribution", categoryCounts);
        metrics.put("sourceTypeDistribution", sourceCounts);
        metrics.put("totalCorrelationRules", rules.size());
        metrics.put("enabledCorrelationRules", rules.stream()
                .filter(r -> Boolean.TRUE.equals(r.getEnabled())).count());
        metrics.put("totalAlerts", alerts.size());
        metrics.put("openAlerts", alerts.stream()
                .filter(a -> "OPEN".equalsIgnoreCase(a.getStatus())).count());
        metrics.put("acknowledgedAlerts", alerts.stream()
                .filter(a -> "ACKNOWLEDGED".equalsIgnoreCase(a.getStatus())).count());
        metrics.put("resolvedAlerts", alerts.stream()
                .filter(a -> "RESOLVED".equalsIgnoreCase(a.getStatus())).count());
        metrics.put("complianceStandard", COMPLIANCE_STANDARD);
        return metrics;
    }

    // ------------------------------------------------------------------
    // Normalization helpers
    // ------------------------------------------------------------------

    private String normalizeSeverity(String severity) {
        if (severity == null || severity.isBlank()) {
            return "MEDIUM";
        }
        String upper = severity.trim().toUpperCase(Locale.ROOT);
        return VALID_SEVERITIES.contains(upper) ? upper : "MEDIUM";
    }

    private String normalizeCategory(String category) {
        if (category == null || category.isBlank()) {
            return "ANOMALY";
        }
        String upper = category.trim().toUpperCase(Locale.ROOT);
        return VALID_CATEGORIES.contains(upper) ? upper : "ANOMALY";
    }

    private String normalizeSourceType(String sourceType) {
        if (sourceType == null || sourceType.isBlank()) {
            return "APPLICATION";
        }
        return sourceType.trim().toUpperCase(Locale.ROOT);
    }

    private List<String> parseCsv(String csv) {
        if (csv == null || csv.isBlank()) {
            return List.of();
        }
        return Arrays.stream(csv.split(","))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .collect(Collectors.toList());
    }

    private String joinCsv(List<String> values) {
        if (values == null) {
            return null;
        }
        return values.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .collect(Collectors.joining(","));
    }
}

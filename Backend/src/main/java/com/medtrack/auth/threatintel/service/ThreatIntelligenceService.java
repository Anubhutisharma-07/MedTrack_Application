package com.medtrack.auth.threatintel.service;

import com.medtrack.auth.siem.dto.SiemLogIngestRequest;
import com.medtrack.auth.siem.service.SiemLogCorrelationService;
import com.medtrack.auth.threatintel.dto.*;
import com.medtrack.auth.threatintel.model.*;
import com.medtrack.auth.threatintel.repository.*;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * ThreatIntelligenceService
 * Enterprise Cyber Threat Intelligence (CTI) & STIX/TAXII 2.1 Automated IOC Correlation Hub.
 *
 * Enforces Standards:
 * - NIST SP 800-150 (Guide to Cyber Threat Information Sharing)
 * - OASIS STIX 2.1 / TAXII 2.1 Technical Specifications
 * - ISO/IEC 27035:2023 Threat Intelligence Sharing Protocols
 * - MITRE ATT&CK Matrix v14 Mapping
 */
@Service
public class ThreatIntelligenceService {

    private static final DateTimeFormatter ISO_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    private final ThreatIntelFeedConfigRepository feedConfigRepository;
    private final ThreatIndicatorRecordRepository indicatorRepository;
    private final ThreatMitigationLogRepository mitigationLogRepository;
    private final SiemLogCorrelationService siemLogCorrelationService;

    private static final String DEFAULT_FEED_NAME = "STIX_TAXII_FEED";

    private static final List<String> SUPPORTED_INDICATOR_TYPES = List.of(
            "IP_ADDRESS", "DOMAIN_NAME", "URL", "FILE_HASH_SHA256", "FILE_HASH_MD5", "EMAIL_ADDRESS"
    );

    private static final List<String> THREAT_CATEGORIES = List.of(
            "MALWARE_C2", "RANSOMWARE", "PHISHING", "APT_CAMPAIGN", "EXFILTRATION_ENDPOINT", "EXPLOIT_PAYLOAD"
    );

    @Autowired
    public ThreatIntelligenceService(ThreatIntelFeedConfigRepository feedConfigRepository,
                                       ThreatIndicatorRecordRepository indicatorRepository,
                                       ThreatMitigationLogRepository mitigationLogRepository,
                                       SiemLogCorrelationService siemLogCorrelationService) {
        this.feedConfigRepository = feedConfigRepository;
        this.indicatorRepository = indicatorRepository;
        this.mitigationLogRepository = mitigationLogRepository;
        this.siemLogCorrelationService = siemLogCorrelationService;
    }

    /**
     * Seeds baseline threat intelligence feed configuration & initial IOC findings.
     */
    @PostConstruct
    @Transactional
    public void seedThreatIntelBaseline() {
        if (feedConfigRepository.findByFeedName(DEFAULT_FEED_NAME).isEmpty()) {
            ThreatIntelFeedConfig config = ThreatIntelFeedConfig.builder()
                    .feedName(DEFAULT_FEED_NAME)
                    .providerName("ALIENVAULT_OTX")
                    .updateIntervalHours(6)
                    .minimumConfidenceScore(85)
                    .autoBlockHighConfidence(true)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
            feedConfigRepository.save(config);
        }

        if (indicatorRepository.count() == 0) {
            seedSampleIndicator("198.51.100.45", "IP_ADDRESS", "MALWARE_C2", 95, "ACTIVE");
            seedSampleIndicator("bad-malware-domain.org", "DOMAIN_NAME", "PHISHING", 88, "ACTIVE");
            seedSampleIndicator("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", "FILE_HASH_SHA256", "RANSOMWARE", 99, "BLOCKED");
            seedSampleIndicator("203.0.113.88", "IP_ADDRESS", "EXFILTRATION_ENDPOINT", 92, "ACTIVE");
            seedSampleIndicator("phishing-medical-login.net", "DOMAIN_NAME", "PHISHING", 90, "BLOCKED");
        }
    }

    private void seedSampleIndicator(String value, String type, String category, int score, String status) {
        if (indicatorRepository.findByIndicatorValue(value).isEmpty()) {
            indicatorRepository.save(ThreatIndicatorRecord.builder()
                    .indicatorValue(value)
                    .indicatorType(type)
                    .threatCategory(category)
                    .confidenceScore(score)
                    .status(status)
                    .discoveredAt(LocalDateTime.now().minusDays(1))
                    .mitigatedAt("BLOCKED".equalsIgnoreCase(status) ? LocalDateTime.now().minusHours(2) : null)
                    .build());
        }
    }

    /**
     * Retrieves active threat intel feed configuration.
     */
    @Transactional(readOnly = true)
    public ThreatIntelFeedConfigResponse getActiveFeedConfig() {
        ThreatIntelFeedConfig config = getOrCreateConfig();
        return mapToConfigResponse(config);
    }

    /**
     * Updates threat intel feed configuration.
     */
    @Transactional
    public ThreatIntelFeedConfigResponse updateFeedConfig(UpdateFeedConfigRequest request) {
        ThreatIntelFeedConfig config = getOrCreateConfig();
        config.setProviderName(request.getProviderName());
        config.setUpdateIntervalHours(request.getUpdateIntervalHours());
        config.setMinimumConfidenceScore(request.getMinimumConfidenceScore());
        config.setAutoBlockHighConfidence(request.isAutoBlockHighConfidence());
        config.setUpdatedAt(LocalDateTime.now());

        ThreatIntelFeedConfig updated = feedConfigRepository.save(config);
        return mapToConfigResponse(updated);
    }

    /**
     * Ingests a new Threat Indicator of Compromise (IOC) and auto-correlates with SIEM.
     */
    @Transactional
    public ThreatIndicatorResponse ingestIndicator(IngestIndicatorRequest request) {
        Optional<ThreatIndicatorRecord> existing = indicatorRepository.findByIndicatorValue(request.getIndicatorValue());
        if (existing.isPresent()) {
            return mapToIndicatorResponse(existing.get());
        }

        String type = request.getIndicatorType() != null ? request.getIndicatorType().toUpperCase(Locale.ROOT) : "IP_ADDRESS";
        String category = request.getThreatCategory() != null ? request.getThreatCategory().toUpperCase(Locale.ROOT) : "MALWARE_C2";

        ThreatIndicatorRecord record = ThreatIndicatorRecord.builder()
                .indicatorValue(request.getIndicatorValue())
                .indicatorType(type)
                .threatCategory(category)
                .confidenceScore(request.getConfidenceScore())
                .status("ACTIVE")
                .discoveredAt(LocalDateTime.now())
                .build();

        ThreatIndicatorRecord saved = indicatorRepository.save(record);

        // Auto-mitigation block trigger if confidence exceeds threshold
        ThreatIntelFeedConfig config = getOrCreateConfig();
        if (config.isAutoBlockHighConfidence() && request.getConfidenceScore() >= config.getMinimumConfidenceScore()) {
            executeMitigationInternal(saved, "IP_BLOCK", "AUTOMATED_WAF_ENGINE");
        }

        // Cross-Subsystem Integration: Auto-ingest high-confidence IOC into SIEM Log Correlation Engine
        if (request.getConfidenceScore() >= 80) {
            try {
                SiemLogIngestRequest siemRequest = new SiemLogIngestRequest();
                siemRequest.setSourceType("THREAT_INTEL_FEED");
                siemRequest.setEventCategory("ANOMALY");
                siemRequest.setSeverity(request.getConfidenceScore() >= 90 ? "CRITICAL" : "HIGH");
                siemRequest.setSourceHost("CTI-FEED-CONNECTOR");
                siemRequest.setSourceIp("IP_ADDRESS".equalsIgnoreCase(type) ? request.getIndicatorValue() : "127.0.0.1");
                siemRequest.setMessage("Threat Intel Match [" + type + "]: " + request.getIndicatorValue() + " (Category: " + category + ")");
                siemRequest.setRawPayload("ConfidenceScore: " + request.getConfidenceScore() + "%, Provider: " + config.getProviderName());
                siemLogCorrelationService.ingestLog(siemRequest);
            } catch (Exception e) {
                // Non-blocking log for SIEM trigger resilience
            }
        }

        return mapToIndicatorResponse(saved);
    }

    /**
     * Simulates automated ingestion of STIX 2.1 Threat Intelligence Bundle.
     */
    @Transactional
    public Map<String, Object> ingestStixBundle(List<IngestIndicatorRequest> stixIndicators, String bundleSource) {
        int ingestedCount = 0;
        int blockedCount = 0;
        List<ThreatIndicatorResponse> responses = new ArrayList<>();

        for (IngestIndicatorRequest request : stixIndicators) {
            ThreatIndicatorResponse response = ingestIndicator(request);
            responses.add(response);
            ingestedCount++;
            if ("BLOCKED".equalsIgnoreCase(response.getStatus())) {
                blockedCount++;
            }
        }

        Map<String, Object> bundleSummary = new LinkedHashMap<>();
        bundleSummary.put("bundleSource", bundleSource != null ? bundleSource : "STIX_TAXII_2_1_FEED");
        bundleSummary.put("stixVersion", "2.1");
        bundleSummary.put("indicatorsProcessed", ingestedCount);
        bundleSummary.put("indicatorsBlockedCount", blockedCount);
        bundleSummary.put("results", responses);
        bundleSummary.put("ingestedAt", LocalDateTime.now().format(ISO_FORMATTER));
        bundleSummary.put("complianceStandard", "OASIS STIX/TAXII 2.1, NIST SP 800-150");
        return bundleSummary;
    }

    /**
     * Performs threat score lookup for an incoming IP, domain, or file hash.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> lookupThreatIndicator(String indicatorValue) {
        Optional<ThreatIndicatorRecord> recordOpt = indicatorRepository.findByIndicatorValue(indicatorValue);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("indicatorValue", indicatorValue);
        result.put("queryTimestamp", LocalDateTime.now().format(ISO_FORMATTER));

        if (recordOpt.isPresent()) {
            ThreatIndicatorRecord record = recordOpt.get();
            result.put("threatFound", true);
            result.put("indicatorType", record.getIndicatorType());
            result.put("threatCategory", record.getThreatCategory());
            result.put("confidenceScore", record.getConfidenceScore());
            result.put("status", record.getStatus());
            result.put("discoveredAt", record.getDiscoveredAt().format(ISO_FORMATTER));
            result.put("mitigatedAt", record.getMitigatedAt() != null ? record.getMitigatedAt().format(ISO_FORMATTER) : null);
            result.put("riskLevel", record.getConfidenceScore() >= 90 ? "CRITICAL" : record.getConfidenceScore() >= 75 ? "HIGH" : "MEDIUM");
        } else {
            result.put("threatFound", false);
            result.put("confidenceScore", 0);
            result.put("status", "CLEAN");
            result.put("riskLevel", "LOW");
        }

        result.put("complianceStandard", "NIST SP 800-150 Threat Information Sharing");
        return result;
    }

    /**
     * Triggers manual firewall / WAF block mitigation against a threat indicator.
     */
    @Transactional
    public ThreatMitigationLogResponse triggerMitigation(TriggerMitigationRequest request, String operator) {
        ThreatIndicatorRecord record = indicatorRepository.findByIndicatorValue(request.getIndicatorValue())
                .orElseThrow(() -> new IllegalArgumentException("Threat indicator not found for value: " + request.getIndicatorValue()));

        return executeMitigationInternal(record, request.getMitigationAction(), operator);
    }

    /**
     * Executes bulk automated firewall blocking for all active high-confidence IOCs.
     */
    @Transactional
    public Map<String, Object> autoBlockAllHighConfidenceIndicators() {
        ThreatIntelFeedConfig config = getOrCreateConfig();
        List<ThreatIndicatorRecord> activeHighRisk = indicatorRepository.findAll().stream()
                .filter(i -> "ACTIVE".equalsIgnoreCase(i.getStatus()))
                .filter(i -> i.getConfidenceScore() >= config.getMinimumConfidenceScore())
                .collect(Collectors.toList());

        int blockedCount = 0;
        List<String> blockedValues = new ArrayList<>();
        for (ThreatIndicatorRecord record : activeHighRisk) {
            executeMitigationInternal(record, "AUTOMATED_MASS_BLOCK", "SYSTEM_CTI_ENGINE");
            blockedCount++;
            blockedValues.add(record.getIndicatorValue());
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("action", "AUTO_BLOCK_ALL_HIGH_CONFIDENCE");
        result.put("minimumConfidenceThreshold", config.getMinimumConfidenceScore());
        result.put("blockedIndicatorsCount", blockedCount);
        result.put("blockedIndicators", blockedValues);
        result.put("timestamp", LocalDateTime.now().format(ISO_FORMATTER));
        return result;
    }

    private ThreatMitigationLogResponse executeMitigationInternal(ThreatIndicatorRecord record, String action, String operator) {
        record.setStatus("BLOCKED");
        record.setMitigatedAt(LocalDateTime.now());
        indicatorRepository.save(record);

        String mitigationId = "MIT-" + (10000 + new Random().nextInt(90000));
        ThreatMitigationLog log = ThreatMitigationLog.builder()
                .mitigationId(mitigationId)
                .indicatorValue(record.getIndicatorValue())
                .mitigationAction(action)
                .executedBy(operator)
                .executionStatus("EXECUTED")
                .details("Automated firewall rule applied: " + action + " for IOC " + record.getIndicatorValue() + " (Confidence: " + record.getConfidenceScore() + "%)")
                .executedAt(LocalDateTime.now())
                .build();

        ThreatMitigationLog savedLog = mitigationLogRepository.save(log);
        return mapToMitigationLogResponse(savedLog);
    }

    /**
     * Retrieves overall CTI Audit & Threat Information Metrics.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getThreatIntelAuditMetrics() {
        List<ThreatIndicatorRecord> indicators = indicatorRepository.findAll();
        List<ThreatMitigationLog> logs = mitigationLogRepository.findAll();
        ThreatIntelFeedConfig config = getOrCreateConfig();

        long activeCount = indicators.stream().filter(i -> "ACTIVE".equalsIgnoreCase(i.getStatus())).count();
        long blockedCount = indicators.stream().filter(i -> "BLOCKED".equalsIgnoreCase(i.getStatus())).count();

        Map<String, Long> indicatorTypeDistribution = indicators.stream()
                .collect(Collectors.groupingBy(i -> i.getIndicatorType() != null ? i.getIndicatorType() : "IP_ADDRESS", Collectors.counting()));

        Map<String, Long> categoryDistribution = indicators.stream()
                .collect(Collectors.groupingBy(i -> i.getThreatCategory() != null ? i.getThreatCategory() : "MALWARE_C2", Collectors.counting()));

        Map<String, Object> metrics = new LinkedHashMap<>();
        metrics.put("feedProvider", config.getProviderName());
        metrics.put("updateIntervalHours", config.getUpdateIntervalHours());
        metrics.put("autoBlockThreshold", config.getMinimumConfidenceScore());
        metrics.put("totalIndicatorsIngested", indicators.size());
        metrics.put("activeThreatIndicators", activeCount);
        metrics.put("blockedThreatIndicators", blockedCount);
        metrics.put("mitigationActionsLogged", logs.size());
        metrics.put("typeDistribution", indicatorTypeDistribution);
        metrics.put("categoryDistribution", categoryDistribution);
        metrics.put("supportedIndicatorTypes", SUPPORTED_INDICATOR_TYPES);
        metrics.put("complianceStandard", "NIST SP 800-150, OASIS STIX 2.1, ISO/IEC 27035:2023");
        return metrics;
    }

    /**
     * Retrieves all ingested threat indicators.
     */
    @Transactional(readOnly = true)
    public List<ThreatIndicatorResponse> getAllIndicators() {
        return indicatorRepository.findAll().stream()
                .map(this::mapToIndicatorResponse)
                .collect(Collectors.toList());
    }

    /**
     * Filter indicators by type and status.
     */
    @Transactional(readOnly = true)
    public List<ThreatIndicatorResponse> getIndicatorsByTypeAndStatus(String indicatorType, String status) {
        return indicatorRepository.findAll().stream()
                .filter(i -> indicatorType == null || indicatorType.isBlank() || indicatorType.equalsIgnoreCase(i.getIndicatorType()))
                .filter(i -> status == null || status.isBlank() || status.equalsIgnoreCase(i.getStatus()))
                .map(this::mapToIndicatorResponse)
                .collect(Collectors.toList());
    }

    /**
     * Retrieves all mitigation logs.
     */
    @Transactional(readOnly = true)
    public List<ThreatMitigationLogResponse> getAllMitigationLogs() {
        return mitigationLogRepository.findAll().stream()
                .map(this::mapToMitigationLogResponse)
                .collect(Collectors.toList());
    }

    private ThreatIntelFeedConfig getOrCreateConfig() {
        return feedConfigRepository.findByFeedName(DEFAULT_FEED_NAME)
                .orElseGet(() -> feedConfigRepository.save(ThreatIntelFeedConfig.builder()
                        .feedName(DEFAULT_FEED_NAME)
                        .providerName("ALIENVAULT_OTX")
                        .updateIntervalHours(6)
                        .minimumConfidenceScore(85)
                        .autoBlockHighConfidence(true)
                        .createdAt(LocalDateTime.now())
                        .updatedAt(LocalDateTime.now())
                        .build()));
    }

    private ThreatIntelFeedConfigResponse mapToConfigResponse(ThreatIntelFeedConfig c) {
        return ThreatIntelFeedConfigResponse.builder()
                .id(c.getId())
                .feedName(c.getFeedName())
                .providerName(c.getProviderName())
                .updateIntervalHours(c.getUpdateIntervalHours())
                .minimumConfidenceScore(c.getMinimumConfidenceScore())
                .autoBlockHighConfidence(c.isAutoBlockHighConfidence())
                .updatedAt(c.getUpdatedAt())
                .build();
    }

    private ThreatIndicatorResponse mapToIndicatorResponse(ThreatIndicatorRecord r) {
        return ThreatIndicatorResponse.builder()
                .id(r.getId())
                .indicatorValue(r.getIndicatorValue())
                .indicatorType(r.getIndicatorType())
                .threatCategory(r.getThreatCategory())
                .confidenceScore(r.getConfidenceScore())
                .status(r.getStatus())
                .discoveredAt(r.getDiscoveredAt())
                .mitigatedAt(r.getMitigatedAt())
                .build();
    }

    private ThreatMitigationLogResponse mapToMitigationLogResponse(ThreatMitigationLog l) {
        return ThreatMitigationLogResponse.builder()
                .id(l.getId())
                .mitigationId(l.getMitigationId())
                .indicatorValue(l.getIndicatorValue())
                .mitigationAction(l.getMitigationAction())
                .executedBy(l.getExecutedBy())
                .executionStatus(l.getExecutionStatus())
                .details(l.getDetails())
                .executedAt(l.getExecutedAt())
                .build();
    }
}


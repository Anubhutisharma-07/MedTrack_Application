package com.medtrack.auth.siem;

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
import com.medtrack.auth.siem.service.SiemLogCorrelationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Unit tests for the SIEM log correlation hub: normalization, threshold-based
 * alert raising, alert-storm suppression, rule management, alert triage,
 * retention, and dry-run correlation.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("SIEM log correlation hub")
class SiemLogCorrelationServiceTest {

    @Mock
    private SiemLogEventRepository logEventRepository;

    @Mock
    private SiemCorrelationRuleRepository correlationRuleRepository;

    @Mock
    private SiemCorrelationAlertRepository correlationAlertRepository;

    @InjectMocks
    private SiemLogCorrelationService siemService;

    private SiemCorrelationRule bruteForceRule;

    @BeforeEach
    void setUp() {
        bruteForceRule = SiemCorrelationRule.builder()
                .id(1L)
                .ruleId("RULE-TEST-BF")
                .ruleName("BRUTE_FORCE_ATTEMPT")
                .description("Five auth failures from one host")
                .severity("HIGH")
                .eventCategory("AUTH_FAILURE")
                .sourceTypesJson("AUTH_SERVICE,VPN")
                .matchKeywordsJson("failed,invalid,denied")
                .timeWindowMinutes(10)
                .threshold(3)
                .enabled(true)
                .createdAt(LocalDateTime.now())
                .build();
    }

    private SiemLogIngestRequest authFailureRequest(String host, String message) {
        SiemLogIngestRequest request = new SiemLogIngestRequest();
        request.setSourceType("AUTH_SERVICE");
        request.setEventCategory("AUTH_FAILURE");
        request.setSeverity("MEDIUM");
        request.setSourceHost(host);
        request.setUsername("clinician@medtrack.org");
        request.setMessage(message);
        return request;
    }

    private void stubIngestPipeline(List<SiemLogEvent> ingested) {
        when(logEventRepository.save(any(SiemLogEvent.class))).thenAnswer(invocation -> {
            SiemLogEvent event = invocation.getArgument(0);
            ingested.add(event);
            return event;
        });
        when(logEventRepository.findByEventTimestampAfter(any()))
                .thenAnswer(invocation -> ingested);
        when(correlationRuleRepository.findByEnabled(true))
                .thenReturn(List.of(bruteForceRule));
        lenient().when(correlationAlertRepository.findByRuleIdAndStatus(anyString(), anyString()))
                .thenReturn(List.of());
    }

    @Test
    @DisplayName("ingest normalizes and persists a log event")
    void ingestNormalizesAndPersistsEvent() {
        List<SiemLogEvent> ingested = new ArrayList<>();
        stubIngestPipeline(ingested);

        SiemLogIngestResponse response = siemService.ingestLog(authFailureRequest("host-a", "failed login"));

        assertEquals("INGESTED", response.getStatus());
        assertTrue(response.getEventId().startsWith("EVT-"));
        assertEquals("NORMALIZED", response.getNormalizationStatus());
        assertEquals(1, ingested.size());
        SiemLogEvent saved = ingested.get(0);
        assertEquals("AUTH_SERVICE", saved.getSourceType());
        assertEquals("AUTH_FAILURE", saved.getEventCategory());
        assertEquals("MEDIUM", saved.getSeverity());
        assertEquals("DEFAULT_TENANT", saved.getTenantId());
        assertNotNull(saved.getIngestedAt());
    }

    @Test
    @DisplayName("an unknown severity is normalized to MEDIUM")
    void unknownSeverityNormalizesToMedium() {
        List<SiemLogEvent> ingested = new ArrayList<>();
        stubIngestPipeline(ingested);

        SiemLogIngestRequest request = authFailureRequest("host-a", "failed login");
        request.setSeverity("CATASTROPHIC");

        siemService.ingestLog(request);

        assertEquals("MEDIUM", ingested.get(0).getSeverity());
    }

    @Test
    @DisplayName("an alert is raised once the rule threshold is met")
    void alertRaisedWhenThresholdMet() {
        List<SiemLogEvent> ingested = new ArrayList<>();
        stubIngestPipeline(ingested);
        when(correlationAlertRepository.save(any(SiemCorrelationAlert.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        SiemLogIngestResponse first = siemService.ingestLog(authFailureRequest("host-a", "failed login"));
        SiemLogIngestResponse second = siemService.ingestLog(authFailureRequest("host-a", "invalid password"));
        assertTrue(first.getAlertIds().isEmpty());
        assertTrue(second.getAlertIds().isEmpty());
        assertEquals(1, first.getTriggeredRules().size());
        assertEquals(1, second.getTriggeredRules().size());

        SiemLogIngestResponse third = siemService.ingestLog(authFailureRequest("host-a", "denied access"));

        assertEquals(1, third.getAlertIds().size());
        assertTrue(third.getAlertIds().get(0).startsWith("ALERT-"));
        assertEquals(1, third.getTriggeredRules().size());
        assertEquals("RULE-TEST-BF", third.getTriggeredRules().get(0));
        verify(correlationAlertRepository, times(1)).save(any(SiemCorrelationAlert.class));
    }

    @Test
    @DisplayName("events from different hosts do not cross the correlation boundary")
    void differentHostsDoNotTriggerThreshold() {
        List<SiemLogEvent> ingested = new ArrayList<>();
        stubIngestPipeline(ingested);
        lenient().when(correlationAlertRepository.save(any(SiemCorrelationAlert.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        siemService.ingestLog(authFailureRequest("host-a", "failed login"));
        siemService.ingestLog(authFailureRequest("host-b", "failed login"));
        SiemLogIngestResponse third = siemService.ingestLog(authFailureRequest("host-c", "failed login"));

        // Each host has only one event, so no host meets the threshold of three.
        assertTrue(third.getAlertIds().isEmpty());
        verify(correlationAlertRepository, never()).save(any(SiemCorrelationAlert.class));
    }

    @Test
    @DisplayName("an open alert for the same rule and host suppresses duplicate alerts")
    void openAlertSuppressesDuplicates() {
        List<SiemLogEvent> ingested = new ArrayList<>();
        stubIngestPipeline(ingested);
        SiemCorrelationAlert openAlert = SiemCorrelationAlert.builder()
                .alertId("ALERT-OPEN-1")
                .ruleId("RULE-TEST-BF")
                .status("OPEN")
                .affectedHost("host-a")
                .build();
        when(correlationAlertRepository.findByRuleIdAndStatus("RULE-TEST-BF", "OPEN"))
                .thenReturn(List.of(openAlert));
        when(correlationAlertRepository.findByRuleIdAndStatus("RULE-TEST-BF", "ACKNOWLEDGED"))
                .thenReturn(List.of());

        siemService.ingestLog(authFailureRequest("host-a", "failed login"));
        siemService.ingestLog(authFailureRequest("host-a", "invalid password"));
        SiemLogIngestResponse third = siemService.ingestLog(authFailureRequest("host-a", "denied access"));

        assertTrue(third.getAlertIds().isEmpty());
        verify(correlationAlertRepository, never()).save(any(SiemCorrelationAlert.class));
    }

    @Test
    @DisplayName("dry-run correlation reports matching rules without persisting")
    void dryRunReportsMatchingRules() {
        when(correlationRuleRepository.findByEnabled(true)).thenReturn(List.of(bruteForceRule));

        Map<String, Object> result = siemService.dryRunCorrelation(authFailureRequest("host-a", "failed login"));

        assertEquals("DRY_RUN_CORRELATION", result.get("mode"));
        assertEquals(1, result.get("matchingRuleCount"));
        verify(logEventRepository, never()).save(any());
        verify(correlationAlertRepository, never()).save(any());
    }

    @Test
    @DisplayName("rule CRUD: create, update, toggle")
    void ruleCrud() {
        SiemCorrelationRuleRequest request = new SiemCorrelationRuleRequest();
        request.setRuleName("EXFIL_SPIKE");
        request.setDescription("Repeated outbound transfer");
        request.setSeverity("CRITICAL");
        request.setEventCategory("EXFILTRATION");
        request.setSourceTypes(List.of("DATABASE"));
        request.setMatchKeywords(List.of("egress"));
        request.setTimeWindowMinutes(30);
        request.setThreshold(2);
        request.setEnabled(true);
        when(correlationRuleRepository.save(any(SiemCorrelationRule.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        SiemCorrelationRule created = siemService.createRule(request);

        assertTrue(created.getRuleId().startsWith("RULE-"));
        assertEquals("EXFIL_SPIKE", created.getRuleName());
        assertEquals("DATABASE", created.getSourceTypesJson());
        assertEquals(2, created.getThreshold());

        when(correlationRuleRepository.findByRuleId("RULE-TEST-BF"))
                .thenReturn(Optional.of(bruteForceRule));
        SiemCorrelationRule toggled = siemService.toggleRule("RULE-TEST-BF");
        assertFalse(toggled.getEnabled());

        toggled.setEnabled(true);
        when(correlationRuleRepository.save(any(SiemCorrelationRule.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        request.setThreshold(5);
        SiemCorrelationRule updated = siemService.updateRule("RULE-TEST-BF", request);
        assertEquals(5, updated.getThreshold());
        assertEquals("CRITICAL", updated.getSeverity());
    }

    @Test
    @DisplayName("alert triage: acknowledge then resolve with attribution")
    void alertTriageLifecycle() {
        SiemCorrelationAlert alert = SiemCorrelationAlert.builder()
                .alertId("ALERT-TRIAGE-1")
                .status("OPEN")
                .build();
        when(correlationAlertRepository.findByAlertId("ALERT-TRIAGE-1"))
                .thenReturn(Optional.of(alert));
        when(correlationAlertRepository.save(any(SiemCorrelationAlert.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        SiemCorrelationAlert acknowledged = siemService.acknowledgeAlert("ALERT-TRIAGE-1", "soc.analyst");
        assertEquals("ACKNOWLEDGED", acknowledged.getStatus());
        assertEquals("soc.analyst", acknowledged.getAcknowledgedBy());
        assertNotNull(acknowledged.getAcknowledgedAt());

        SiemAlertTriageRequest resolution = new SiemAlertTriageRequest();
        resolution.setAnalyst("soc.lead");
        resolution.setResolutionNotes("Contained host, rotated credentials");
        SiemCorrelationAlert resolved = siemService.resolveAlert("ALERT-TRIAGE-1", resolution);
        assertEquals("RESOLVED", resolved.getStatus());
        assertEquals("soc.lead", resolved.getResolvedBy());
        assertEquals("Contained host, rotated credentials", resolved.getResolutionNotes());
        assertNotNull(resolved.getResolvedAt());
    }

    @Test
    @DisplayName("a resolved alert cannot be acknowledged again")
    void resolvedAlertRejectsAcknowledge() {
        SiemCorrelationAlert alert = SiemCorrelationAlert.builder()
                .alertId("ALERT-DONE-1")
                .status("RESOLVED")
                .build();
        when(correlationAlertRepository.findByAlertId("ALERT-DONE-1"))
                .thenReturn(Optional.of(alert));

        assertThrows(IllegalArgumentException.class,
                () -> siemService.acknowledgeAlert("ALERT-DONE-1", "soc.analyst"));
    }

    @Test
    @DisplayName("retention purge removes events older than the policy")
    void retentionPurge() {
        when(logEventRepository.deleteByEventTimestampBefore(any()))
                .thenReturn(7L);

        Map<String, Object> result = siemService.purgeLogsBefore(90);

        assertEquals(90, result.get("retentionPolicyDays"));
        assertEquals(7L, result.get("purgedEventCount"));
        assertEquals("NIST SP 800-92 Log Retention", result.get("complianceStandard"));
    }

    @Test
    @DisplayName("audit metrics summarize the hub state")
    void auditMetrics() {
        SiemLogEvent event = SiemLogEvent.builder()
                .eventId("EVT-1")
                .sourceType("EDR")
                .eventCategory("MALWARE")
                .severity("CRITICAL")
                .eventTimestamp(LocalDateTime.now())
                .ingestedAt(LocalDateTime.now())
                .build();
        when(logEventRepository.findAll()).thenReturn(List.of(event));
        when(correlationRuleRepository.findAll()).thenReturn(List.of(bruteForceRule));
        when(correlationAlertRepository.findAll()).thenReturn(List.of(
                SiemCorrelationAlert.builder().alertId("A1").status("OPEN").build(),
                SiemCorrelationAlert.builder().alertId("A2").status("RESOLVED").build()));

        Map<String, Object> metrics = siemService.getSiemAuditMetrics();

        assertEquals(1, metrics.get("totalEventsIngested"));
        assertEquals(1L, metrics.get("enabledCorrelationRules"));
        assertEquals(1L, metrics.get("openAlerts"));
        assertEquals(1L, metrics.get("resolvedAlerts"));
    }
}

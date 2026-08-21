package com.medtrack.auth.siem.controller;

import com.medtrack.auth.siem.dto.SiemAlertTriageRequest;
import com.medtrack.auth.siem.dto.SiemCorrelationRuleRequest;
import com.medtrack.auth.siem.dto.SiemLogIngestRequest;
import com.medtrack.auth.siem.dto.SiemLogIngestResponse;
import com.medtrack.auth.siem.model.SiemCorrelationAlert;
import com.medtrack.auth.siem.model.SiemCorrelationRule;
import com.medtrack.auth.siem.model.SiemLogEvent;
import com.medtrack.auth.siem.service.SiemLogCorrelationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * SiemController
 * Spring Boot REST controller exposing the SIEM Log Correlation Hub under
 * /api/auth/siem/. Read endpoints require an authenticated session; every
 * state-changing endpoint is restricted to HOSPITAL admins via SecurityConfig.
 */
@RestController
@RequestMapping("/api/auth/siem")
public class SiemController {

    private final SiemLogCorrelationService siemService;

    @Autowired
    public SiemController(SiemLogCorrelationService siemService) {
        this.siemService = siemService;
    }

    /**
     * Ingest a single normalized security log event.
     */
    @PostMapping("/logs/ingest")
    public ResponseEntity<?> ingestLog(@RequestBody SiemLogIngestRequest request) {
        try {
            SiemLogIngestResponse response = siemService.ingestLog(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            return error("log_ingest_failed", e);
        }
    }

    /**
     * Ingest a batch of security log events in one transaction.
     */
    @PostMapping("/logs/batch")
    public ResponseEntity<?> ingestLogBatch(@RequestBody List<SiemLogIngestRequest> requests) {
        try {
            Map<String, Object> summary = siemService.ingestLogBatch(requests);
            return ResponseEntity.status(HttpStatus.CREATED).body(summary);
        } catch (Exception e) {
            return error("batch_ingest_failed", e);
        }
    }

    /**
     * Query the most recent normalized events, optionally filtered by source
     * type, severity, or event category.
     */
    @GetMapping("/logs")
    public ResponseEntity<List<SiemLogEvent>> listLogs(
            @RequestParam(required = false) String sourceType,
            @RequestParam(required = false) String severity,
            @RequestParam(required = false) String eventCategory,
            @RequestParam(defaultValue = "50") int limit) {
        return ResponseEntity.ok(siemService.listLogs(sourceType, severity, eventCategory, limit));
    }

    /**
     * Fetch a single normalized event (including raw payload) by event id.
     */
    @GetMapping("/logs/{eventId}")
    public ResponseEntity<?> getLog(@PathVariable String eventId) {
        try {
            return ResponseEntity.ok(siemService.getLog(eventId));
        } catch (Exception e) {
            return error("log_lookup_failed", e);
        }
    }

    /**
     * Enforce NIST SP 800-92 log retention by purging events older than the
     * configured number of days.
     */
    @PostMapping("/logs/purge")
    public ResponseEntity<?> purgeLogs(@RequestParam(defaultValue = "90") int retentionDays) {
        try {
            return ResponseEntity.ok(siemService.purgeLogsBefore(retentionDays));
        } catch (Exception e) {
            return error("log_purge_failed", e);
        }
    }

    /**
     * List all configured correlation rules.
     */
    @GetMapping("/rules")
    public ResponseEntity<List<SiemCorrelationRule>> listRules() {
        return ResponseEntity.ok(siemService.listRules());
    }

    /**
     * Create a new correlation rule.
     */
    @PostMapping("/rules")
    public ResponseEntity<?> createRule(@RequestBody SiemCorrelationRuleRequest request) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(siemService.createRule(request));
        } catch (Exception e) {
            return error("rule_creation_failed", e);
        }
    }

    /**
     * Update an existing correlation rule.
     */
    @PutMapping("/rules/{ruleId}")
    public ResponseEntity<?> updateRule(@PathVariable String ruleId,
                                        @RequestBody SiemCorrelationRuleRequest request) {
        try {
            return ResponseEntity.ok(siemService.updateRule(ruleId, request));
        } catch (Exception e) {
            return error("rule_update_failed", e);
        }
    }

    /**
     * Enable or disable a correlation rule.
     */
    @PatchMapping("/rules/{ruleId}/toggle")
    public ResponseEntity<?> toggleRule(@PathVariable String ruleId) {
        try {
            return ResponseEntity.ok(siemService.toggleRule(ruleId));
        } catch (Exception e) {
            return error("rule_toggle_failed", e);
        }
    }

    /**
     * List alerts, optionally filtered by status and severity.
     */
    @GetMapping("/alerts")
    public ResponseEntity<List<SiemCorrelationAlert>> getAlerts(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String severity) {
        return ResponseEntity.ok(siemService.getAlerts(status, severity));
    }

    /**
     * List alerts still awaiting triage.
     */
    @GetMapping("/alerts/open")
    public ResponseEntity<List<SiemCorrelationAlert>> getOpenAlerts() {
        return ResponseEntity.ok(siemService.getOpenAlerts());
    }

    /**
     * Acknowledge an alert, attributing the analyst.
     */
    @PostMapping("/alerts/{alertId}/acknowledge")
    public ResponseEntity<?> acknowledgeAlert(@PathVariable String alertId,
                                              @RequestBody(required = false) SiemAlertTriageRequest request) {
        try {
            String analyst = request != null ? request.getAnalyst() : null;
            return ResponseEntity.ok(siemService.acknowledgeAlert(alertId, analyst));
        } catch (Exception e) {
            return error("alert_acknowledge_failed", e);
        }
    }

    /**
     * Resolve an alert with analyst attribution and resolution notes.
     */
    @PostMapping("/alerts/{alertId}/resolve")
    public ResponseEntity<?> resolveAlert(@PathVariable String alertId,
                                          @RequestBody(required = false) SiemAlertTriageRequest request) {
        try {
            return ResponseEntity.ok(siemService.resolveAlert(alertId,
                    request != null ? request : new SiemAlertTriageRequest()));
        } catch (Exception e) {
            return error("alert_resolve_failed", e);
        }
    }

    /**
     * Dry-run correlation of a hypothetical event against all enabled rules.
     */
    @PostMapping("/correlation/dry-run")
    public ResponseEntity<Map<String, Object>> dryRunCorrelation(@RequestBody SiemLogIngestRequest request) {
        return ResponseEntity.ok(siemService.dryRunCorrelation(request));
    }

    /**
     * SIEM audit metrics for compliance reporting.
     */
    @GetMapping("/metrics")
    public ResponseEntity<Map<String, Object>> getMetrics() {
        return ResponseEntity.ok(siemService.getSiemAuditMetrics());
    }

    private ResponseEntity<Map<String, String>> error(String code, Exception e) {
        Map<String, String> body = new HashMap<>();
        body.put("error", code);
        body.put("message", e.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }
}

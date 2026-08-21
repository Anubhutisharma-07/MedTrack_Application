package com.medtrack.auth.pam.controller;

import com.medtrack.auth.pam.dto.PamJitElevationRequest;
import com.medtrack.auth.pam.dto.PamSessionLogRequest;
import com.medtrack.auth.pam.model.PamJitCredentialRecord;
import com.medtrack.auth.pam.model.PamSessionRecordingLog;
import com.medtrack.auth.pam.service.PamJitCredentialElevationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * PamJitCredentialElevationController
 * Spring Boot REST Controller exposing Privileged Access Management (PAM) JIT Endpoints:
 * 1. POST /api/pam/jit/request - Submit JIT Privileged Credential Request
 * 2. POST /api/pam/jit/approve - Dual-Custody Approval
 * 3. POST /api/pam/jit/reject - Reject Request
 * 4. POST /api/pam/session/start - Start Privileged Keystroke Session Recording
 * 5. POST /api/pam/session/log - Log Command Executed in Session
 * 6. POST /api/pam/session/terminate - Terminate Session
 * 7. GET /api/pam/audit-metrics - Compliance Audit Metrics
 */
@RestController
@RequestMapping("/api/pam")
public class PamJitCredentialElevationController {

    private final PamJitCredentialElevationService pamService;

    @Autowired
    public PamJitCredentialElevationController(PamJitCredentialElevationService pamService) {
        this.pamService = pamService;
    }

    /**
     * Submit JIT Privileged Credential Elevation Request
     */
    @PostMapping("/jit/request")
    public ResponseEntity<?> requestJitElevation(@RequestBody PamJitElevationRequest request) {
        try {
            PamJitCredentialRecord record = pamService.requestJitElevation(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(record);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "jit_request_failed");
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    /**
     * Dual-Custody Approval Gate
     */
    @PostMapping("/jit/approve")
    public ResponseEntity<?> approveElevation(
            @RequestParam String elevationId,
            @RequestParam String approverUserId) {
        try {
            PamJitCredentialRecord record = pamService.approveElevation(elevationId, approverUserId);
            return ResponseEntity.ok(record);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "approval_failed");
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    /**
     * Reject JIT Request
     */
    @PostMapping("/jit/reject")
    public ResponseEntity<?> rejectElevation(
            @RequestParam String elevationId,
            @RequestParam(defaultValue = "Policy Violation") String reason) {
        try {
            PamJitCredentialRecord record = pamService.rejectElevation(elevationId, reason);
            return ResponseEntity.ok(record);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "rejection_failed");
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    /**
     * Start Session Recording
     */
    @PostMapping("/session/start")
    public ResponseEntity<?> startSession(@RequestBody PamSessionLogRequest request) {
        try {
            PamSessionRecordingLog session = pamService.startPrivilegedSession(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(session);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "session_start_failed");
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
        }
    }

    /**
     * Log Command Execution in Session
     */
    @PostMapping("/session/log")
    public ResponseEntity<?> logCommand(
            @RequestParam String sessionId,
            @RequestParam String commandExecuted) {
        try {
            PamSessionRecordingLog session = pamService.logSessionCommand(sessionId, commandExecuted);
            return ResponseEntity.ok(session);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "command_logging_failed");
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    /**
     * Terminate Session
     */
    @PostMapping("/session/terminate")
    public ResponseEntity<?> terminateSession(
            @RequestParam String sessionId,
            @RequestParam(required = false, defaultValue = "USER_LOGOUT") String reason) {
        try {
            PamSessionRecordingLog session = pamService.terminateSession(sessionId, reason);
            return ResponseEntity.ok(session);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "session_termination_failed");
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    /**
     * Compliance Audit Metrics
     */
    @GetMapping("/audit-metrics")
    public ResponseEntity<Map<String, Object>> getAuditMetrics() {
        Map<String, Object> metrics = pamService.getPamAuditMetrics();
        return ResponseEntity.ok(metrics);
    }
}

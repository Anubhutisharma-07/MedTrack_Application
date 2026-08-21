package com.medtrack.auth.soar.controller;

import com.medtrack.auth.soar.dto.SoarIncidentTicketRequest;
import com.medtrack.auth.soar.dto.SoarPlaybookExecutionRequest;
import com.medtrack.auth.soar.model.SoarIncidentTicketRecord;
import com.medtrack.auth.soar.model.SoarPlaybookRecord;
import com.medtrack.auth.soar.service.SoarOrchestrationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * SoarOrchestrationController
 * Spring Boot REST Controller exposing SOAR Automation Endpoints:
 * 1. POST /api/soar/playbooks/execute - Trigger Automated Mitigation Playbook
 * 2. POST /api/soar/incidents/create - Manually Create Incident Ticket
 * 3. POST /api/soar/incidents/resolve - Resolve Incident Ticket
 * 4. GET /api/soar/incidents/open - List Open Incident Tickets
 * 5. GET /api/soar/audit-metrics - Expose SOAR Compliance Audit Metrics
 */
@RestController
@RequestMapping("/api/soar")
public class SoarOrchestrationController {

    private final SoarOrchestrationService soarService;

    @Autowired
    public SoarOrchestrationController(SoarOrchestrationService soarService) {
        this.soarService = soarService;
    }

    /**
     * Trigger Automated SOAR Containment Playbook
     */
    @PostMapping("/playbooks/execute")
    public ResponseEntity<?> executePlaybook(@RequestBody SoarPlaybookExecutionRequest request) {
        try {
            SoarPlaybookRecord playbook = soarService.executePlaybook(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(playbook);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "playbook_execution_failed");
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    /**
     * Create Incident Ticket
     */
    @PostMapping("/incidents/create")
    public ResponseEntity<?> createIncidentTicket(@RequestBody SoarIncidentTicketRequest request) {
        try {
            SoarIncidentTicketRecord ticket = soarService.createIncidentTicket(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(ticket);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "ticket_creation_failed");
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    /**
     * Resolve Incident Ticket
     */
    @PostMapping("/incidents/resolve")
    public ResponseEntity<?> resolveIncidentTicket(
            @RequestParam String ticketId,
            @RequestParam(defaultValue = "Mitigated via automated SOAR workflow") String resolutionNotes) {
        try {
            SoarIncidentTicketRecord ticket = soarService.resolveIncidentTicket(ticketId, resolutionNotes);
            return ResponseEntity.ok(ticket);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "ticket_resolution_failed");
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    /**
     * Get Open Incident Tickets
     */
    @GetMapping("/incidents/open")
    public ResponseEntity<List<SoarIncidentTicketRecord>> getOpenIncidentTickets() {
        List<SoarIncidentTicketRecord> openTickets = soarService.getOpenIncidentTickets();
        return ResponseEntity.ok(openTickets);
    }

    /**
     * Get SOAR Audit Metrics
     */
    @GetMapping("/audit-metrics")
    public ResponseEntity<Map<String, Object>> getAuditMetrics() {
        Map<String, Object> metrics = soarService.getSoarAuditMetrics();
        return ResponseEntity.ok(metrics);
    }
}

package com.medtrack.auth.soar.model;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * SoarPlaybookRecord JPA Entity
 * Represents an Automated SOAR (Security Orchestration, Automation, and Response) Playbook Execution
 * under NIST SP 800-61 Rev. 2 Computer Security Incident Handling Guide standards.
 */
@Entity
@Table(name = "soar_playbook_records")
public class SoarPlaybookRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String playbookId;

    @Column(nullable = false)
    private String playbookName; // e.g. RANSOMWARE_ISOLATION_PLAYBOOK, EHR_EXFILTRATION_CONTAINMENT

    @Column(nullable = false)
    private String triggerEvent; // e.g. BRUTE_FORCE_EXCEEDED, DPoP_TOKEN_REPLAY_DETECTED

    @Column(nullable = false)
    private String severity; // CRITICAL, HIGH, MEDIUM, LOW

    @Column(nullable = false)
    private String executionStatus; // IN_PROGRESS, COMPLETED, FAILED, INTERRUPTED

    @Column(columnDefinition = "TEXT", nullable = false)
    private String stepsExecutedJson;

    @Column(nullable = false)
    private long executionDurationMs;

    @Column(nullable = false)
    private Instant executedAt;

    public SoarPlaybookRecord() {}

    public SoarPlaybookRecord(String playbookId, String playbookName, String triggerEvent,
                              String severity, String stepsExecutedJson, Instant executedAt) {
        this.playbookId = playbookId;
        this.playbookName = playbookName;
        this.triggerEvent = triggerEvent;
        this.severity = severity;
        this.executionStatus = "IN_PROGRESS";
        this.stepsExecutedJson = stepsExecutedJson;
        this.executionDurationMs = 0L;
        this.executedAt = executedAt;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public String getPlaybookId() { return playbookId; }
    public void setPlaybookId(String playbookId) { this.playbookId = playbookId; }

    public String getPlaybookName() { return playbookName; }
    public void setPlaybookName(String playbookName) { this.playbookName = playbookName; }

    public String getTriggerEvent() { return triggerEvent; }
    public void setTriggerEvent(String triggerEvent) { this.triggerEvent = triggerEvent; }

    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }

    public String getExecutionStatus() { return executionStatus; }
    public void setExecutionStatus(String executionStatus) { this.executionStatus = executionStatus; }

    public String getStepsExecutedJson() { return stepsExecutedJson; }
    public void setStepsExecutedJson(String stepsExecutedJson) { this.stepsExecutedJson = stepsExecutedJson; }

    public long getExecutionDurationMs() { return executionDurationMs; }
    public void setExecutionDurationMs(long executionDurationMs) { this.executionDurationMs = executionDurationMs; }

    public Instant getExecutedAt() { return executedAt; }
    public void setExecutedAt(Instant executedAt) { this.executedAt = executedAt; }
}

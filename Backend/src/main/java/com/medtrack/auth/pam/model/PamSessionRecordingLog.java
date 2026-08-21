package com.medtrack.auth.pam.model;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * PamSessionRecordingLog JPA Entity
 * Represents an active or completed Privileged Access Session Recording audit log
 * with command execution JSON tracing, anomaly risk scores, and session termination state.
 */
@Entity
@Table(name = "pam_session_recording_logs")
public class PamSessionRecordingLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String sessionId;

    @Column(nullable = false)
    private String elevationId;

    @Column(nullable = false)
    private String userId;

    @Column(nullable = false)
    private String clientIpAddress;

    @Column(columnDefinition = "TEXT")
    private String commandHistoryJson;

    @Column(nullable = false)
    private double riskScore; // 0.0 to 100.0 risk rating

    @Column(nullable = false)
    private boolean active;

    private String terminationReason;

    @Column(nullable = false)
    private Instant startedAt;

    private Instant endedAt;

    public PamSessionRecordingLog() {}

    public PamSessionRecordingLog(String sessionId, String elevationId, String userId,
                                 String clientIpAddress, Instant startedAt) {
        this.sessionId = sessionId;
        this.elevationId = elevationId;
        this.userId = userId;
        this.clientIpAddress = clientIpAddress;
        this.commandHistoryJson = "[]";
        this.riskScore = 0.0;
        this.active = true;
        this.startedAt = startedAt;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }

    public String getElevationId() { return elevationId; }
    public void setElevationId(String elevationId) { this.elevationId = elevationId; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getClientIpAddress() { return clientIpAddress; }
    public void setClientIpAddress(String clientIpAddress) { this.clientIpAddress = clientIpAddress; }

    public String getCommandHistoryJson() { return commandHistoryJson; }
    public void setCommandHistoryJson(String commandHistoryJson) { this.commandHistoryJson = commandHistoryJson; }

    public double getRiskScore() { return riskScore; }
    public void setRiskScore(double riskScore) { this.riskScore = riskScore; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public String getTerminationReason() { return terminationReason; }
    public void setTerminationReason(String terminationReason) { this.terminationReason = terminationReason; }

    public Instant getStartedAt() { return startedAt; }
    public void setStartedAt(Instant startedAt) { this.startedAt = startedAt; }

    public Instant getEndedAt() { return endedAt; }
    public void setEndedAt(Instant endedAt) { this.endedAt = endedAt; }
}

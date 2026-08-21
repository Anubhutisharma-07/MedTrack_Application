package com.medtrack.auth.pam.model;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * PamJitCredentialRecord JPA Entity
 * Represents a Just-In-Time (JIT) Privileged Access Credential Elevation request
 * under NIST SP 800-53 AC-6 Least Privilege and ISO/IEC 27001 standards.
 */
@Entity
@Table(name = "pam_jit_credential_records")
public class PamJitCredentialRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String elevationId;

    @Column(nullable = false)
    private String requesterUserId;

    @Column(nullable = false)
    private String approverUserId;

    @Column(nullable = false)
    private String targetResource; // e.g. production-ehr-db-01, hipaa-vault-k8s

    @Column(nullable = false)
    private String requestedRole; // e.g. ROLE_SYSTEM_ADMIN, ROLE_BREAK_GLASS_PHYSICIAN

    @Column(nullable = false)
    private String justificationReason;

    @Column(nullable = false)
    private String approvalStatus; // PENDING, APPROVED, REJECTED, EXPIRED, REVOKED

    @Column(nullable = false)
    private int durationMinutes; // Time-bound window (e.g. 15 to 120 minutes)

    @Column(nullable = false)
    private Instant requestedAt;

    private Instant approvedAt;

    private Instant expiresAt;

    private Instant revokedAt;

    public PamJitCredentialRecord() {}

    public PamJitCredentialRecord(String elevationId, String requesterUserId, String approverUserId,
                                  String targetResource, String requestedRole, String justificationReason,
                                  int durationMinutes, Instant requestedAt) {
        this.elevationId = elevationId;
        this.requesterUserId = requesterUserId;
        this.approverUserId = approverUserId;
        this.targetResource = targetResource;
        this.requestedRole = requestedRole;
        this.justificationReason = justificationReason;
        this.durationMinutes = durationMinutes;
        this.approvalStatus = "PENDING";
        this.requestedAt = requestedAt;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public String getElevationId() { return elevationId; }
    public void setElevationId(String elevationId) { this.elevationId = elevationId; }

    public String getRequesterUserId() { return requesterUserId; }
    public void setRequesterUserId(String requesterUserId) { this.requesterUserId = requesterUserId; }

    public String getApproverUserId() { return approverUserId; }
    public void setApproverUserId(String approverUserId) { this.approverUserId = approverUserId; }

    public String getTargetResource() { return targetResource; }
    public void setTargetResource(String targetResource) { this.targetResource = targetResource; }

    public String getRequestedRole() { return requestedRole; }
    public void setRequestedRole(String requestedRole) { this.requestedRole = requestedRole; }

    public String getJustificationReason() { return justificationReason; }
    public void setJustificationReason(String justificationReason) { this.justificationReason = justificationReason; }

    public String getApprovalStatus() { return approvalStatus; }
    public void setApprovalStatus(String approvalStatus) { this.approvalStatus = approvalStatus; }

    public int getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(int durationMinutes) { this.durationMinutes = durationMinutes; }

    public Instant getRequestedAt() { return requestedAt; }
    public void setRequestedAt(Instant requestedAt) { this.requestedAt = requestedAt; }

    public Instant getApprovedAt() { return approvedAt; }
    public void setApprovedAt(Instant approvedAt) { this.approvedAt = approvedAt; }

    public Instant getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }

    public Instant getRevokedAt() { return revokedAt; }
    public void setRevokedAt(Instant revokedAt) { this.revokedAt = revokedAt; }
}

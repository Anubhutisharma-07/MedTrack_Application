package com.medtrack.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Append-only audit record for changes made to a preventive-maintenance rule.
 *
 * Audit records are intentionally independent from the lifecycle of the
 * MaintenancePolicyRule entity so that the history remains available even
 * after a rule has been soft-deleted.
 */
@Entity
@Table(name = "maintenance_rule_audits")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaintenanceRuleAudit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Hospital ownership key.
     * Used to enforce hospital-scoped access to audit history.
     */
    @Column(name = "hospital_id", nullable = false)
    private Long hospitalId;

    /**
     * ID of the maintenance policy rule that was changed.
     *
     * This is intentionally stored as a scalar ID instead of a JPA relationship
     * so audit records remain intact when the rule is soft-deleted.
     */
    @Column(name = "rule_id", nullable = false)
    private Long ruleId;

    /**
     * Type of change that occurred.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "action", length = 50, nullable = false)
    private MaintenanceRuleAuditAction action;

    /**
     * Rule status before the change.
     * Null for actions such as CREATE where no previous status exists.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "previous_status", length = 50)
    private MaintenancePolicyStatus previousStatus;

    /**
     * Rule status after the change.
     * Null when the action does not result in a status value.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "new_status", length = 50)
    private MaintenancePolicyStatus newStatus;

    /**
     * User or system component responsible for the change.
     */
    @Column(name = "actor", length = 255)
    private String actor;

    /**
     * Optional human-readable description of the change.
     */
    @Column(name = "detail", length = 1000)
    private String detail;

    /**
     * Time at which the audit record was created.
     */
    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
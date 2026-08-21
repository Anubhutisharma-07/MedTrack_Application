package com.medtrack.service;

import com.medtrack.model.MaintenancePolicyStatus;
import com.medtrack.model.MaintenanceRuleAudit;
import com.medtrack.model.MaintenanceRuleAuditAction;
import com.medtrack.repository.MaintenanceRuleAuditRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class MaintenanceRuleAuditService {

    private final MaintenanceRuleAuditRepository auditRepository;

    /**
     * Record a maintenance-rule lifecycle or configuration change.
     *
     * Audit records are append-only. Existing records are never modified or
     * deleted after creation.
     */
    @Transactional
    public MaintenanceRuleAudit record(
            Long hospitalId,
            Long ruleId,
            MaintenanceRuleAuditAction action,
            MaintenancePolicyStatus previousStatus,
            MaintenancePolicyStatus newStatus,
            String actor,
            String detail
    ) {
        if (hospitalId == null) {
            throw new IllegalArgumentException("Hospital ID is required");
        }

        if (ruleId == null) {
            throw new IllegalArgumentException("Rule ID is required");
        }

        if (action == null) {
            throw new IllegalArgumentException("Audit action is required");
        }

        MaintenanceRuleAudit audit = MaintenanceRuleAudit.builder()
                .hospitalId(hospitalId)
                .ruleId(ruleId)
                .action(action)
                .previousStatus(previousStatus)
                .newStatus(newStatus)
                .actor(actor)
                .detail(detail)
                .build();

        return auditRepository.save(audit);
    }

    /**
     * Record a newly created maintenance rule.
     */
    @Transactional
    public MaintenanceRuleAudit recordCreated(
            Long hospitalId,
            Long ruleId,
            MaintenancePolicyStatus status,
            String actor,
            String detail
    ) {
        return record(
                hospitalId,
                ruleId,
                MaintenanceRuleAuditAction.CREATED,
                null,
                status,
                actor,
                detail
        );
    }

    /**
     * Record a configuration update that does not necessarily change
     * the lifecycle status.
     */
    @Transactional
    public MaintenanceRuleAudit recordUpdated(
            Long hospitalId,
            Long ruleId,
            MaintenancePolicyStatus currentStatus,
            String actor,
            String detail
    ) {
        return record(
                hospitalId,
                ruleId,
                MaintenanceRuleAuditAction.UPDATED,
                currentStatus,
                currentStatus,
                actor,
                detail
        );
    }

    /**
     * Record an explicit lifecycle status transition.
     */
    @Transactional
    public MaintenanceRuleAudit recordStatusChanged(
            Long hospitalId,
            Long ruleId,
            MaintenancePolicyStatus previousStatus,
            MaintenancePolicyStatus newStatus,
            String actor,
            String detail
    ) {
        return record(
                hospitalId,
                ruleId,
                MaintenanceRuleAuditAction.STATUS_CHANGED,
                previousStatus,
                newStatus,
                actor,
                detail
        );
    }

    /**
     * Record activation of a maintenance rule.
     */
    @Transactional
    public MaintenanceRuleAudit recordActivated(
            Long hospitalId,
            Long ruleId,
            MaintenancePolicyStatus previousStatus,
            MaintenancePolicyStatus newStatus,
            String actor,
            String detail
    ) {
        return record(
                hospitalId,
                ruleId,
                MaintenanceRuleAuditAction.ACTIVATED,
                previousStatus,
                newStatus,
                actor,
                detail
        );
    }

    /**
     * Record deactivation of a maintenance rule.
     */
    @Transactional
    public MaintenanceRuleAudit recordDeactivated(
            Long hospitalId,
            Long ruleId,
            MaintenancePolicyStatus previousStatus,
            MaintenancePolicyStatus newStatus,
            String actor,
            String detail
    ) {
        return record(
                hospitalId,
                ruleId,
                MaintenanceRuleAuditAction.DEACTIVATED,
                previousStatus,
                newStatus,
                actor,
                detail
        );
    }

    /**
     * Record soft deletion of a maintenance rule.
     */
    @Transactional
    public MaintenanceRuleAudit recordDeleted(
            Long hospitalId,
            Long ruleId,
            MaintenancePolicyStatus previousStatus,
            String actor,
            String detail
    ) {
        return record(
                hospitalId,
                ruleId,
                MaintenanceRuleAuditAction.DELETED,
                previousStatus,
                MaintenancePolicyStatus.ARCHIVED,
                actor,
                detail
        );
    }

    /**
     * Retrieve paginated audit history for a hospital.
     */
    @Transactional(readOnly = true)
    public Page<MaintenanceRuleAudit> getHospitalAuditHistory(
            Long hospitalId,
            Pageable pageable
    ) {
        return auditRepository.findByHospitalIdOrderByCreatedAtDesc(
                hospitalId,
                pageable
        );
    }

    /**
     * Retrieve paginated audit history for one maintenance rule.
     */
    @Transactional(readOnly = true)
    public Page<MaintenanceRuleAudit> getRuleAuditHistory(
            Long hospitalId,
            Long ruleId,
            Pageable pageable
    ) {
        return auditRepository.findByHospitalIdAndRuleIdOrderByCreatedAtDesc(
                hospitalId,
                ruleId,
                pageable
        );
    }
}
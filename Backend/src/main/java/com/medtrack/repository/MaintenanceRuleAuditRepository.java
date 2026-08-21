package com.medtrack.repository;

import com.medtrack.model.MaintenanceRuleAudit;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MaintenanceRuleAuditRepository
        extends JpaRepository<MaintenanceRuleAudit, Long> {

    /**
     * Find audit history for one hospital, newest first.
     */
    Page<MaintenanceRuleAudit> findByHospitalIdOrderByCreatedAtDesc(
            Long hospitalId,
            Pageable pageable
    );

    /**
     * Find audit history for a specific maintenance rule,
     * newest first.
     */
    Page<MaintenanceRuleAudit> findByHospitalIdAndRuleIdOrderByCreatedAtDesc(
            Long hospitalId,
            Long ruleId,
            Pageable pageable
    );

    /**
     * Find all audit records for a specific maintenance rule.
     */
    List<MaintenanceRuleAudit> findByHospitalIdAndRuleIdOrderByCreatedAtDesc(
            Long hospitalId,
            Long ruleId
    );
}
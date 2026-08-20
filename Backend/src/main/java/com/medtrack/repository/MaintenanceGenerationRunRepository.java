package com.medtrack.repository;

import com.medtrack.model.MaintenanceGenerationRun;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface MaintenanceGenerationRunRepository
        extends JpaRepository<MaintenanceGenerationRun, Long> {

    /**
     * Returns generation history for a hospital, newest execution first.
     */
    Page<MaintenanceGenerationRun> findByHospitalIdOrderByCreatedAtDesc(
            Long hospitalId,
            Pageable pageable);

    /**
     * Returns generation history for a specific policy rule within a hospital.
     */
    Page<MaintenanceGenerationRun> findByHospitalIdAndPolicyRuleIdOrderByCreatedAtDesc(
            Long hospitalId,
            Long policyRuleId,
            Pageable pageable);

    /**
     * Finds an exact generation run used by the idempotent generation pipeline.
     */
    Optional<MaintenanceGenerationRun>
    findByHospitalIdAndPolicyRuleIdAndWindowStartAndWindowEnd(
            Long hospitalId,
            Long policyRuleId,
            LocalDate windowStart,
            LocalDate windowEnd);

    /**
     * Total number of generation runs for a hospital.
     */
    long countByHospitalId(Long hospitalId);

    /**
     * Total number of generation runs for one policy rule within a hospital.
     */
    long countByHospitalIdAndPolicyRuleId(
            Long hospitalId,
            Long policyRuleId);

    /**
     * Aggregates generated and skipped task counts for a hospital.
     *
     * The COALESCE calls ensure an empty generation history returns zeroes
     * instead of null values.
     */
    @Query("""
            SELECT COALESCE(SUM(r.tasksGenerated), 0),
                   COALESCE(SUM(r.skippedExisting), 0)
            FROM MaintenanceGenerationRun r
            WHERE r.hospitalId = :hospitalId
            """)
    Object[] summarizeByHospitalId(
            @Param("hospitalId") Long hospitalId);

    /**
     * Returns the timestamp of the most recent generation run.
     */
    @Query("""
            SELECT MAX(r.createdAt)
            FROM MaintenanceGenerationRun r
            WHERE r.hospitalId = :hospitalId
            """)
    Optional<LocalDateTime> findLatestCreatedAtByHospitalId(
            @Param("hospitalId") Long hospitalId);

    /**
     * Returns the timestamp of the most recent generation run for a rule.
     */
    @Query("""
            SELECT MAX(r.createdAt)
            FROM MaintenanceGenerationRun r
            WHERE r.hospitalId = :hospitalId
              AND r.policyRuleId = :policyRuleId
            """)
    Optional<LocalDateTime> findLatestCreatedAtByHospitalIdAndPolicyRuleId(
            @Param("hospitalId") Long hospitalId,
            @Param("policyRuleId") Long policyRuleId);
}
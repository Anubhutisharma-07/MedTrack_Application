package com.medtrack.repository;

import com.medtrack.dto.MaintenanceActivityAnalytics;
import com.medtrack.dto.MaintenanceStatusTransitionAnalytics;
import com.medtrack.model.MaintenanceTaskActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MaintenanceActivityRepository
        extends JpaRepository<MaintenanceTaskActivity, Long> {

    /*
     * ============================================================
     * TOTAL ACTIVITY
     * ============================================================
     */

    long countByHospitalId(Long hospitalId);

    /*
     * ============================================================
     * DATE-RANGE ACTIVITY
     * ============================================================
     */

    long countByHospitalIdAndOccurredAtBetween(
            Long hospitalId,
            LocalDateTime startDate,
            LocalDateTime endDate
    );

    /*
     * ============================================================
     * EVENT TYPE BREAKDOWN
     * ============================================================
     */

    @Query("""
            SELECT
                CAST(a.eventType AS string) AS eventType,
                COUNT(a) AS eventCount
            FROM MaintenanceTaskActivity a
            WHERE a.hospitalId = :hospitalId
            GROUP BY a.eventType
            ORDER BY COUNT(a) DESC
            """)
    List<MaintenanceActivityAnalytics> getEventTypeAnalytics(
            @Param("hospitalId") Long hospitalId
    );

    /*
     * ============================================================
     * STATUS TRANSITIONS
     * ============================================================
     */

    @Query("""
            SELECT
                CAST(a.previousStatus AS string) AS previousStatus,
                CAST(a.newStatus AS string) AS newStatus,
                COUNT(a) AS transitionCount
            FROM MaintenanceTaskActivity a
            WHERE a.hospitalId = :hospitalId
              AND a.previousStatus IS NOT NULL
              AND a.newStatus IS NOT NULL
            GROUP BY a.previousStatus, a.newStatus
            ORDER BY COUNT(a) DESC
            """)
    List<MaintenanceStatusTransitionAnalytics>
    getStatusTransitionAnalytics(
            @Param("hospitalId") Long hospitalId
    );

    /*
     * ============================================================
     * TASK-SPECIFIC ACTIVITY
     * ============================================================
     */

    List<MaintenanceTaskActivity>
    findByHospitalIdAndTaskIdOrderBySequenceNumberAsc(
            Long hospitalId,
            Long taskId
    );

    /*
     * ============================================================
     * ACTOR ACTIVITY
     * ============================================================
     */

    @Query("""
            SELECT COUNT(a)
            FROM MaintenanceTaskActivity a
            WHERE a.hospitalId = :hospitalId
              AND a.actorUserId = :actorUserId
            """)
    long countByActor(
            @Param("hospitalId") Long hospitalId,
            @Param("actorUserId") Long actorUserId
    );

    /*
     * ============================================================
     * RECENT ACTIVITY
     * ============================================================
     */

    @Query("""
            SELECT a
            FROM MaintenanceTaskActivity a
            WHERE a.hospitalId = :hospitalId
            ORDER BY a.occurredAt DESC
            """)
    List<MaintenanceTaskActivity> findRecentActivity(
            @Param("hospitalId") Long hospitalId
    );
}

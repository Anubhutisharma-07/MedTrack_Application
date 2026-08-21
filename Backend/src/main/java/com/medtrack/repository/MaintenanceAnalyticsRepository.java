package com.medtrack.repository;

import com.medtrack.dto.MaintenanceDepartmentAnalytics;
import com.medtrack.dto.MaintenanceEquipmentAnalytics;
import com.medtrack.dto.MaintenanceTechnicianAnalytics;
import com.medtrack.dto.MaintenanceTrendAnalytics;
import com.medtrack.dto.MaintenanceTypeAnalytics;
import com.medtrack.model.MaintenanceStatus;
import com.medtrack.model.MaintenanceTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MaintenanceAnalyticsRepository
        extends JpaRepository<MaintenanceTask, Long> {

    /*
     * ============================================================
     * BASIC TASK COUNTS
     * ============================================================
     */

    long countByHospitalId(Long hospitalId);

    long countByHospitalIdAndStatus(
            Long hospitalId,
            MaintenanceStatus status
    );

    long countByHospitalIdAndStatusNot(
            Long hospitalId,
            MaintenanceStatus status
    );

    /*
     * ============================================================
     * OVERDUE TASKS
     * ============================================================
     */

    long countByHospitalIdAndDeadlineBeforeAndStatusNot(
            Long hospitalId,
            LocalDate deadline,
            MaintenanceStatus status
    );

    /*
     * ============================================================
     * HOURS WORKED
     * ============================================================
     */

    @Query("""
            SELECT COALESCE(SUM(t.hoursWorked), 0)
            FROM MaintenanceTask t
            WHERE t.hospitalId = :hospitalId
            """)
    Double getTotalHoursWorked(
            @Param("hospitalId") Long hospitalId
    );

    @Query("""
            SELECT COALESCE(AVG(t.hoursWorked), 0)
            FROM MaintenanceTask t
            WHERE t.hospitalId = :hospitalId
              AND t.hoursWorked IS NOT NULL
            """)
    Double getAverageHoursWorked(
            @Param("hospitalId") Long hospitalId
    );

    /*
     * ============================================================
     * DATE-RANGE ANALYTICS
     * ============================================================
     */

    @Query("""
            SELECT COUNT(t)
            FROM MaintenanceTask t
            WHERE t.hospitalId = :hospitalId
              AND t.createdAt >= :startDate
              AND t.createdAt <= :endDate
            """)
    long countTasksCreatedBetween(
            @Param("hospitalId") Long hospitalId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    @Query("""
            SELECT COUNT(t)
            FROM MaintenanceTask t
            WHERE t.hospitalId = :hospitalId
              AND t.completedAt IS NOT NULL
              AND t.completedAt >= :startDate
              AND t.completedAt <= :endDate
            """)
    long countTasksCompletedBetween(
            @Param("hospitalId") Long hospitalId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    /*
     * ============================================================
     * MAINTENANCE TYPE ANALYTICS
     * ============================================================
     */

    @Query("""
            SELECT
                t.maintenanceType AS maintenanceType,
                COUNT(t) AS taskCount,
                COALESCE(AVG(t.hoursWorked), 0) AS averageHours
            FROM MaintenanceTask t
            WHERE t.hospitalId = :hospitalId
            GROUP BY t.maintenanceType
            ORDER BY COUNT(t) DESC
            """)
    List<MaintenanceTypeAnalytics> getMaintenanceTypeAnalytics(
            @Param("hospitalId") Long hospitalId
    );

    /*
     * ============================================================
     * TECHNICIAN WORKLOAD
     * ============================================================
     */

    @Query("""
            SELECT
                u.id AS technicianId,
                u.name AS technicianName,
                COUNT(t) AS taskCount,
                COALESCE(AVG(t.hoursWorked), 0) AS averageHours
            FROM MaintenanceTask t
            JOIN t.assignedTechnicianRecord u
            WHERE t.hospitalId = :hospitalId
            GROUP BY u.id, u.name
            ORDER BY COUNT(t) DESC
            """)
    List<MaintenanceTechnicianAnalytics> getTechnicianAnalytics(
            @Param("hospitalId") Long hospitalId
    );

    /*
     * ============================================================
     * EQUIPMENT MAINTENANCE ANALYTICS
     * ============================================================
     */

    @Query("""
            SELECT
                e.id AS equipmentId,
                e.name AS equipmentName,
                COUNT(t) AS taskCount,
                COALESCE(AVG(t.hoursWorked), 0) AS averageHours
            FROM MaintenanceTask t
            JOIN t.equipmentRecord e
            WHERE t.hospitalId = :hospitalId
            GROUP BY e.id, e.name
            ORDER BY COUNT(t) DESC
            """)
    List<MaintenanceEquipmentAnalytics> getEquipmentAnalytics(
            @Param("hospitalId") Long hospitalId
    );

    /*
     * ============================================================
     * SLA ANALYTICS
     * ============================================================
     */

    @Query("""
            SELECT COUNT(t)
            FROM MaintenanceTask t
            WHERE t.hospitalId = :hospitalId
              AND t.slaState = :slaState
            """)
    long countBySlaState(
            @Param("hospitalId") Long hospitalId,
            @Param("slaState") com.medtrack.model.SlaState slaState
    );

    @Query("""
            SELECT COUNT(t)
            FROM MaintenanceTask t
            WHERE t.hospitalId = :hospitalId
              AND t.slaBreachedAt IS NOT NULL
            """)
    long countSlaBreaches(
            @Param("hospitalId") Long hospitalId
    );

    /*
     * ============================================================
     * COMPLETION PERFORMANCE
     * ============================================================
     */

    @Query("""
            SELECT COALESCE(
                AVG(
                    TIMESTAMPDIFF(day, t.createdAt, t.completedAt)
                ),
                0
            )
            FROM MaintenanceTask t
            WHERE t.hospitalId = :hospitalId
              AND t.completedAt IS NOT NULL
            """)
    Double getAverageCompletionDays(
            @Param("hospitalId") Long hospitalId
    );

    /*
     * ============================================================
     * RECENT TASKS
     * ============================================================
     */

    @Query("""
            SELECT t
            FROM MaintenanceTask t
            WHERE t.hospitalId = :hospitalId
            ORDER BY t.createdAt DESC
            """)
    List<MaintenanceTask> findRecentTasks(
            @Param("hospitalId") Long hospitalId
    );

    /*
     * ============================================================
     * TASKS BY DEADLINE
     * ============================================================
     */

    @Query("""
            SELECT COUNT(t)
            FROM MaintenanceTask t
            WHERE t.hospitalId = :hospitalId
              AND t.deadline >= :startDate
              AND t.deadline <= :endDate
            """)
    long countTasksDueBetween(
            @Param("hospitalId") Long hospitalId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    @Query("""
        SELECT
            e.department AS department,
            COUNT(t) AS taskCount,
            SUM(
                CASE
                    WHEN t.status = com.medtrack.model.MaintenanceStatus.COMPLETED
                    THEN 1
                    ELSE 0
                END
            ) AS completedCount,
            SUM(
                CASE
                    WHEN t.deadline < CURRENT_DATE
                     AND t.status <> com.medtrack.model.MaintenanceStatus.COMPLETED
                    THEN 1
                    ELSE 0
                END
            ) AS overdueCount,
            COALESCE(AVG(t.hoursWorked), 0) AS averageHours
        FROM MaintenanceTask t
        JOIN t.equipmentRecord e
        WHERE t.hospitalId = :hospitalId
        GROUP BY e.department
        ORDER BY COUNT(t) DESC
        """)
    List<MaintenanceDepartmentAnalytics> getDepartmentAnalytics(
            @Param("hospitalId") Long hospitalId
    );

    @Query("""
        SELECT
            FUNCTION('DATE', t.createdAt) AS date,
            COUNT(t) AS taskCount,
            SUM(
                CASE
                    WHEN t.status =
                        com.medtrack.model.MaintenanceStatus.COMPLETED
                    THEN 1
                    ELSE 0
                END
            ) AS completedCount,
            COALESCE(SUM(t.hoursWorked), 0) AS hoursWorked
        FROM MaintenanceTask t
        WHERE t.hospitalId = :hospitalId
          AND t.createdAt >= :startDate
          AND t.createdAt <= :endDate
        GROUP BY FUNCTION('DATE', t.createdAt)
        ORDER BY FUNCTION('DATE', t.createdAt)
        """)
    List<MaintenanceTrendAnalytics> getMaintenanceTrend(
            @Param("hospitalId") Long hospitalId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );
}

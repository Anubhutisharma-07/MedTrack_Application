package com.medtrack.service;

import com.medtrack.dto.MaintenanceActivityAnalytics;
import com.medtrack.dto.MaintenanceAnalyticsResponse;
import com.medtrack.dto.MaintenanceDepartmentAnalytics;
import com.medtrack.dto.MaintenanceEquipmentAnalytics;
import com.medtrack.dto.MaintenanceStatusTransitionAnalytics;
import com.medtrack.dto.MaintenanceTechnicianAnalytics;
import com.medtrack.dto.MaintenanceTrendAnalytics;
import com.medtrack.dto.MaintenanceTypeAnalytics;
import com.medtrack.model.MaintenanceStatus;
import com.medtrack.model.SlaState;
import com.medtrack.repository.MaintenanceAnalyticsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import com.medtrack.repository.MaintenanceActivityRepository;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MaintenanceAnalyticsService {

    private final MaintenanceAnalyticsRepository analyticsRepository;
    private final MaintenanceActivityRepository activityRepository;

    /**
     * Generate the complete maintenance analytics dashboard
     * for one hospital.
     */
    public MaintenanceAnalyticsResponse getAnalytics(
            Long hospitalId,
            LocalDate startDate,
            LocalDate endDate
    ) {

        if (hospitalId == null) {
            throw new IllegalArgumentException("Hospital ID is required");
        }

        if (startDate == null) {
            startDate = LocalDate.now().withDayOfMonth(1);
        }

        if (endDate == null) {
            endDate = LocalDate.now();
        }

        if (startDate.isAfter(endDate)) {
            throw new IllegalArgumentException(
                    "Start date cannot be after end date"
            );
        }

        LocalDateTime startDateTime =
                startDate.atStartOfDay();

        LocalDateTime endDateTime =
                endDate.plusDays(1).atStartOfDay().minusNanos(1);

        // ========================================================
        // BASIC COUNTS
        // ========================================================

        long totalTasks =
                analyticsRepository.countByHospitalId(hospitalId);

        long completedTasks =
                analyticsRepository.countByHospitalIdAndStatus(
                        hospitalId,
                        MaintenanceStatus.COMPLETED
                );

        // Cancellation is represented by archival, not a persisted MaintenanceStatus.
        long cancelledTasks = 0L;

        long openTasks =
                analyticsRepository.countByHospitalIdAndStatusNot(
                        hospitalId,
                        MaintenanceStatus.COMPLETED
                );

        // ========================================================
        // OVERDUE
        // ========================================================

        long overdueTasks =
                analyticsRepository
                        .countByHospitalIdAndDeadlineBeforeAndStatusNot(
                                hospitalId,
                                LocalDate.now(),
                                MaintenanceStatus.COMPLETED
                        );

        // ========================================================
        // HOURS
        // ========================================================

        Double totalHours =
                analyticsRepository.getTotalHoursWorked(hospitalId);

        Double averageHours =
                analyticsRepository.getAverageHoursWorked(hospitalId);

        Double averageCompletionDays =
                analyticsRepository.getAverageCompletionDays(hospitalId);

        // ========================================================
        // SLA
        // ========================================================

        long upcomingTasks =
                analyticsRepository.countBySlaState(
                        hospitalId,
                        SlaState.UPCOMING
                );

        long warningTasks =
                analyticsRepository.countBySlaState(
                        hospitalId,
                        SlaState.WARNING
                );

        long breachedTasks =
                analyticsRepository.countBySlaState(
                        hospitalId,
                        SlaState.BREACHED
                );

        long slaBreaches =
                analyticsRepository.countSlaBreaches(hospitalId);

        // ========================================================
        // PERIOD
        // ========================================================

        long tasksCreatedInPeriod =
                analyticsRepository.countTasksCreatedBetween(
                        hospitalId,
                        startDateTime,
                        endDateTime
                );

        long tasksCompletedInPeriod =
                analyticsRepository.countTasksCompletedBetween(
                        hospitalId,
                        startDateTime,
                        endDateTime
                );

        long tasksDueInPeriod =
                analyticsRepository.countTasksDueBetween(
                        hospitalId,
                        startDate,
                        endDate
                );

        // ========================================================
        // BREAKDOWNS
        // ========================================================

        List<MaintenanceTypeAnalytics> maintenanceTypeAnalytics =
                analyticsRepository.getMaintenanceTypeAnalytics(
                        hospitalId
                );

        List<MaintenanceTechnicianAnalytics> technicianAnalytics =
                analyticsRepository.getTechnicianAnalytics(
                        hospitalId
                );

        List<MaintenanceEquipmentAnalytics> equipmentAnalytics =
                analyticsRepository.getEquipmentAnalytics(
                        hospitalId
                );

        List<MaintenanceDepartmentAnalytics> departmentAnalytics =
                analyticsRepository.getDepartmentAnalytics(hospitalId);

        List<MaintenanceTrendAnalytics> trendAnalytics =
                analyticsRepository.getMaintenanceTrend(
                        hospitalId,
                        startDateTime,
                        endDateTime
                );

        long totalActivities = activityRepository.countByHospitalId(hospitalId);
        long activitiesInPeriod =
                activityRepository.countByHospitalIdAndOccurredAtBetween(
                        hospitalId,
                        startDateTime,
                        endDateTime
                );
        List<MaintenanceActivityAnalytics> activityTypeAnalytics =
                activityRepository.getEventTypeAnalytics(hospitalId);
        List<MaintenanceStatusTransitionAnalytics> statusTransitionAnalytics =
                activityRepository.getStatusTransitionAnalytics(hospitalId);

        // ========================================================
        // RESPONSE
        // ========================================================

        return MaintenanceAnalyticsResponse.builder()

                .totalTasks(totalTasks)

                .openTasks(openTasks)

                .completedTasks(completedTasks)

                .overdueTasks(overdueTasks)

                .cancelledTasks(cancelledTasks)

                .totalHoursWorked(
                        totalHours != null
                                ? totalHours
                                : 0.0
                )

                .averageHoursWorked(
                        averageHours != null
                                ? averageHours
                                : 0.0
                )

                .averageCompletionDays(
                        averageCompletionDays != null
                                ? averageCompletionDays
                                : 0.0
                )

                .upcomingTasks(upcomingTasks)

                .warningTasks(warningTasks)

                .breachedTasks(breachedTasks)

                .slaBreaches(slaBreaches)

                .tasksCreatedInPeriod(tasksCreatedInPeriod)

                .tasksCompletedInPeriod(tasksCompletedInPeriod)

                .tasksDueInPeriod(tasksDueInPeriod)

                .maintenanceTypeAnalytics(
                        maintenanceTypeAnalytics
                )

                .technicianAnalytics(
                        technicianAnalytics
                )

                .equipmentAnalytics(
                        equipmentAnalytics
                )

                .departmentAnalytics(departmentAnalytics)

                .trendAnalytics(trendAnalytics)

                .totalActivities(totalActivities)

                .activitiesInPeriod(activitiesInPeriod)

                .activityTypeAnalytics(activityTypeAnalytics)

                .statusTransitionAnalytics(statusTransitionAnalytics)

                .build();
    }

    /**
     * Generate analytics for the current month.
     */
    public MaintenanceAnalyticsResponse getCurrentMonthAnalytics(
            Long hospitalId
    ) {

        LocalDate today = LocalDate.now();

        return getAnalytics(
                hospitalId,
                today.withDayOfMonth(1),
                today
        );
    }

    public List<MaintenanceDepartmentAnalytics> getDepartmentAnalytics(Long hospitalId) {
        requireHospitalId(hospitalId);
        return analyticsRepository.getDepartmentAnalytics(hospitalId);
    }

    public List<MaintenanceTrendAnalytics> getMaintenanceTrends(
            Long hospitalId,
            LocalDate startDate,
            LocalDate endDate
    ) {
        requireHospitalId(hospitalId);
        if (startDate == null || endDate == null) {
            throw new IllegalArgumentException("Start date and end date are required");
        }
        if (startDate.isAfter(endDate)) {
            throw new IllegalArgumentException("Start date cannot be after end date");
        }
        return analyticsRepository.getMaintenanceTrend(
                hospitalId,
                startDate.atStartOfDay(),
                endDate.plusDays(1).atStartOfDay().minusNanos(1)
        );
    }

    private void requireHospitalId(Long hospitalId) {
        if (hospitalId == null) {
            throw new IllegalArgumentException("Hospital ID is required");
        }
    }
}

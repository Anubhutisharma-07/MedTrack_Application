package com.medtrack.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaintenanceAnalyticsResponse {

    // ============================================================
    // OVERALL KPI
    // ============================================================

    private Long totalTasks;

    private Long openTasks;

    private Long completedTasks;

    private Long overdueTasks;

    private Long cancelledTasks;

    // ============================================================
    // WORKLOAD
    // ============================================================

    private Double totalHoursWorked;

    private Double averageHoursWorked;

    private Double averageCompletionDays;

    // ============================================================
    // SLA
    // ============================================================

    private Long upcomingTasks;

    private Long warningTasks;

    private Long breachedTasks;

    private Long slaBreaches;

    // ============================================================
    // PERIOD ANALYTICS
    // ============================================================

    private Long tasksCreatedInPeriod;

    private Long tasksCompletedInPeriod;

    private Long tasksDueInPeriod;

    // ============================================================
    // BREAKDOWNS
    // ============================================================

    private List<MaintenanceTypeAnalytics> maintenanceTypeAnalytics;

    private List<MaintenanceTechnicianAnalytics> technicianAnalytics;

    private List<MaintenanceEquipmentAnalytics> equipmentAnalytics;

    private List<MaintenanceDepartmentAnalytics>
            departmentAnalytics;

    private List<MaintenanceTrendAnalytics>
            trendAnalytics;
    private Long totalActivities;

    private Long activitiesInPeriod;

    private java.util.List<MaintenanceActivityAnalytics>
            activityTypeAnalytics;

    private java.util.List<MaintenanceStatusTransitionAnalytics>
            statusTransitionAnalytics;
}
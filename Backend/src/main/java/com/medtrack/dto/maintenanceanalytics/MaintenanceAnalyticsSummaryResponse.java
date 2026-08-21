package com.medtrack.dto.maintenanceanalytics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaintenanceAnalyticsSummaryResponse {

    private long totalMaintenanceActivities;

    private long openMaintenanceActivities;

    private long completedMaintenanceActivities;

    private long overdueMaintenanceActivities;

    private long preventiveMaintenanceActivities;

    private long correctiveMaintenanceActivities;

    private long emergencyMaintenanceActivities;

    private long cancelledMaintenanceActivities;

    private BigDecimal totalMaintenanceCost;

    private BigDecimal averageMaintenanceCost;

    private double preventiveMaintenanceCompletionRate;

    private double correctiveMaintenanceRate;

    private double cancellationRate;

    private double averageCompletionTimeHours;

    private double averageResponseTimeHours;
}

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
public class DepartmentMaintenanceAnalyticsResponse {

    private String department;

    private long maintenanceCount;

    private long completedCount;

    private long overdueCount;

    private long preventiveCount;

    private long correctiveCount;

    private long emergencyCount;

    private BigDecimal totalMaintenanceCost;

    private BigDecimal averageMaintenanceCost;

    private double averageCompletionTimeHours;
}

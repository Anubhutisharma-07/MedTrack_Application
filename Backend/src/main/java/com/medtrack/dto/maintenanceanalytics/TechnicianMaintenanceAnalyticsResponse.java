package com.medtrack.dto.maintenanceanalytics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TechnicianMaintenanceAnalyticsResponse {

    private Long technicianId;

    private String technicianName;

    private String technicianEmail;

    private long assignedWorkOrders;

    private long completedWorkOrders;

    private long openWorkOrders;

    private long overdueWorkOrders;

    private double completionRate;

    private double averageCompletionTimeHours;

    private double averageResponseTimeHours;
}

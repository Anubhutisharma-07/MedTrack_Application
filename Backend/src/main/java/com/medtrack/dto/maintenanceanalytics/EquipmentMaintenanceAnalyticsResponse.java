package com.medtrack.dto.maintenanceanalytics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EquipmentMaintenanceAnalyticsResponse {

    private Long equipmentId;

    private String equipmentCode;

    private String equipmentName;

    private String department;

    private String category;

    private long totalMaintenanceEvents;

    private long preventiveMaintenanceCount;

    private long correctiveMaintenanceCount;

    private long emergencyMaintenanceCount;

    private long completedMaintenanceCount;

    private long overdueMaintenanceCount;

    private BigDecimal totalMaintenanceCost;

    private BigDecimal averageMaintenanceCost;

    private double averageRepairDurationHours;

    private double totalDowntimeHours;

    private LocalDate lastMaintenanceDate;

    private LocalDate nextScheduledMaintenance;
}

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
public class MaintenanceCostAnalyticsResponse {

    private BigDecimal totalCost;

    private BigDecimal preventiveMaintenanceCost;

    private BigDecimal correctiveMaintenanceCost;

    private BigDecimal emergencyMaintenanceCost;

    private BigDecimal averageMaintenanceCost;

    private BigDecimal highestMaintenanceCost;

    private BigDecimal lowestMaintenanceCost;

    private long maintenanceCount;
}

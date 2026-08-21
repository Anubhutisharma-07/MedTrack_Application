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
public class MaintenanceTrendResponse {

    private LocalDate periodStart;

    private LocalDate periodEnd;

    private long maintenanceCount;

    private long completedCount;

    private long overdueCount;

    private BigDecimal maintenanceCost;

    private double averageCompletionTimeHours;
}

package com.medtrack.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Aggregated operational summary of preventive-maintenance generation runs.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaintenanceGenerationSummaryResponse {

    private long totalRuns;
    private long totalTasksGenerated;
    private long totalSkippedExisting;
    private LocalDateTime lastGeneratedAt;
}
package com.medtrack.dto;

import com.medtrack.model.MaintenanceGenerationRun;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * API-facing representation of a preventive-maintenance generation run.
 *
 * <p>Internal ownership information such as hospitalId is intentionally
 * excluded because the caller's hospital scope is resolved server-side.</p>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaintenanceGenerationRunResponse {

    private Long id;
    private Long policyRuleId;
    private LocalDate windowStart;
    private LocalDate windowEnd;
    private Integer tasksGenerated;
    private Integer skippedExisting;
    private String detail;
    private LocalDateTime createdAt;

    public static MaintenanceGenerationRunResponse from(
            MaintenanceGenerationRun run) {

        return MaintenanceGenerationRunResponse.builder()
                .id(run.getId())
                .policyRuleId(run.getPolicyRuleId())
                .windowStart(run.getWindowStart())
                .windowEnd(run.getWindowEnd())
                .tasksGenerated(run.getTasksGenerated())
                .skippedExisting(run.getSkippedExisting())
                .detail(run.getDetail())
                .createdAt(run.getCreatedAt())
                .build();
    }
}
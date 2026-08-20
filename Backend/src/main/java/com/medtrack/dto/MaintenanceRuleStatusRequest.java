package com.medtrack.dto;

import com.medtrack.model.MaintenancePolicyStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request payload for transitioning a preventive-maintenance rule
 * to a new lifecycle status.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaintenanceRuleStatusRequest {

    @NotNull(message = "Maintenance rule status is required")
    private MaintenancePolicyStatus status;
}
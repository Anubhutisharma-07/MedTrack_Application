package com.medtrack.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaintenanceWorkOrderAssignmentRequest {

    @NotNull(message = "Assigned user ID is required")
    private Long assignedUserId;

    private String assignedTechnician;
}
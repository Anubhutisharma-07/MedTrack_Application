package com.medtrack.dto;

import com.medtrack.model.MaintenanceWorkOrderStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaintenanceWorkOrderStatusRequest {

    @NotNull(message = "Status is required")
    private MaintenanceWorkOrderStatus status;

    @Size(
            max = 2000,
            message = "Reason must not exceed 2000 characters"
    )
    private String reason;
}
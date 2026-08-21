package com.medtrack.dto;

import com.medtrack.model.MaintenanceWorkOrderPriority;
import com.medtrack.model.MaintenanceWorkOrderType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaintenanceWorkOrderRequest {

    @NotNull(message = "Equipment ID is required")
    private Long equipmentId;

    private Long maintenanceTaskId;

    @NotBlank(message = "Title is required")
    @Size(max = 255, message = "Title must not exceed 255 characters")
    private String title;

    @Size(max = 16000, message = "Description must not exceed 16000 characters")
    private String description;

    @NotNull(message = "Maintenance type is required")
    private MaintenanceWorkOrderType maintenanceType;

    @NotNull(message = "Priority is required")
    private MaintenanceWorkOrderPriority priority;

    private Long assignedUserId;

    @Size(max = 255, message = "Assigned technician must not exceed 255 characters")
    private String assignedTechnician;

    private LocalDate scheduledDate;

    private LocalDate dueDate;
}
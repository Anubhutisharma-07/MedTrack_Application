package com.medtrack.dto;

import com.medtrack.model.MaintenanceWorkOrderPriority;
import com.medtrack.model.MaintenanceWorkOrderStatus;
import com.medtrack.model.MaintenanceWorkOrderType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaintenanceWorkOrderResponse {

    private Long id;

    private String workOrderCode;

    private Long hospitalId;

    private Long equipmentId;

    private String equipmentCode;

    private String equipmentName;

    private Long maintenanceTaskId;

    private String title;

    private String description;

    private MaintenanceWorkOrderType maintenanceType;

    private MaintenanceWorkOrderPriority priority;

    private MaintenanceWorkOrderStatus status;

    private Long assignedUserId;

    private String assignedTechnician;

    private LocalDate scheduledDate;

    private LocalDate dueDate;

    private LocalDateTime startedAt;

    private LocalDateTime completedAt;

    private LocalDateTime cancelledAt;

    private String holdReason;

    private String cancellationReason;

    private String completionNotes;

    private Double hoursWorked;

    private String partsUsed;

    private String signature;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private String createdBy;

    private String updatedBy;
}
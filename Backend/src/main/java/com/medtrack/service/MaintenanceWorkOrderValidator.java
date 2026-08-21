package com.medtrack.service;

import com.medtrack.dto.MaintenanceWorkOrderRequest;
import com.medtrack.dto.MaintenanceWorkOrderCompletionRequest;
import com.medtrack.model.MaintenanceWorkOrder;
import com.medtrack.model.MaintenanceWorkOrderStatus;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
public class MaintenanceWorkOrderValidator {

    /**
     * Validates dates supplied when creating a work order.
     */
    public void validateCreationDates(
            MaintenanceWorkOrderRequest request
    ) {

        if (request == null) {
            return;
        }

        LocalDate scheduledDate =
                request.getScheduledDate();

        LocalDate dueDate =
                request.getDueDate();

        validateDateBounds(scheduledDate, dueDate);
    }

    /**
     * Validates that due date is not strictly prior to scheduled date.
     */
    public void validateDateBounds(
            LocalDate scheduledDate,
            LocalDate dueDate
    ) {

        if (scheduledDate != null
                && dueDate != null
                && dueDate.isBefore(scheduledDate)) {

            throw new IllegalArgumentException(
                    "Due date cannot be before scheduled date"
            );
        }
    }

    /**
     * Validates that an existing work order can be started.
     */
    public void validateCanStart(
            MaintenanceWorkOrder workOrder
    ) {

        if (workOrder.getStatus()
                != MaintenanceWorkOrderStatus.ASSIGNED
                && workOrder.getStatus()
                != MaintenanceWorkOrderStatus.ON_HOLD) {

            throw new IllegalStateException(
                    "Only ASSIGNED or ON_HOLD work orders can be started"
            );
        }

        if (workOrder.getAssignedUser() == null) {

            throw new IllegalStateException(
                    "A technician must be assigned before starting work"
            );
        }
    }

    /**
     * Validates completion requirements.
     */
    public void validateCompletion(
            MaintenanceWorkOrder workOrder,
            MaintenanceWorkOrderCompletionRequest request
    ) {

        if (workOrder.getStatus()
                != MaintenanceWorkOrderStatus.IN_PROGRESS) {

            throw new IllegalStateException(
                    "Only IN_PROGRESS work orders can be completed"
            );
        }

        if (request.getCompletionNotes() == null
                || request.getCompletionNotes().isBlank()) {

            throw new IllegalArgumentException(
                    "Completion notes are required"
            );
        }

        if (workOrder.getStartedAt() == null) {

            throw new IllegalStateException(
                    "Work order cannot be completed before it is started"
            );
        }
    }

    /**
     * Validates that completion does not occur before start.
     */
    public void validateCompletionTimestamp(
            MaintenanceWorkOrder workOrder
    ) {

        if (workOrder.getStartedAt() == null) {
            throw new IllegalStateException(
                    "Start timestamp is missing"
            );
        }

        if (workOrder.getCompletedAt() != null
                && workOrder.getCompletedAt()
                .isBefore(workOrder.getStartedAt())) {

            throw new IllegalStateException(
                    "Completion time cannot be before start time"
            );
        }
    }

    /**
     * Validates a work-order due date.
     */
    public void validateDueDate(
            LocalDate dueDate
    ) {

        if (dueDate != null
                && dueDate.isBefore(LocalDate.now())) {

            // Historical due dates are allowed because imported
            // or migrated maintenance records may already be overdue.
            return;
        }
    }

    /**
     * Determines whether a work order is currently overdue.
     */
    public boolean isOverdue(
            MaintenanceWorkOrder workOrder
    ) {

        if (workOrder.getDueDate() == null) {
            return false;
        }

        if (workOrder.getStatus()
                == MaintenanceWorkOrderStatus.COMPLETED
                || workOrder.getStatus()
                == MaintenanceWorkOrderStatus.CANCELLED) {

            return false;
        }

        return workOrder.getDueDate()
                .isBefore(LocalDate.now());
    }

    /**
     * Validates that no active work order exists for the specified maintenance task.
     */
    public void validateNoActiveWorkOrderForTask(
            boolean activeWorkOrderExists,
            Long taskId
    ) {
        if (activeWorkOrderExists) {
            throw new IllegalArgumentException(
                    "An active work order already exists for maintenance task ID: " + taskId
            );
        }
    }

    /**
     * Validates that equipment ID and maintenance task equipment ID match when creating a work order.
     */
    public void validateEquipmentTaskMatching(
            Long equipmentId,
            Long taskEquipmentId
    ) {
        if (equipmentId != null && taskEquipmentId != null && !equipmentId.equals(taskEquipmentId)) {
            throw new IllegalArgumentException(
                    "Equipment ID " + equipmentId + " does not match task equipment ID " + taskEquipmentId
            );
        }
    }

    /**
     * Validates that maintenance task is eligible for work order binding.
     */
    public void validateTaskEligibilityForWorkOrder(
            boolean isCompleted
    ) {
        if (isCompleted) {
            throw new IllegalArgumentException(
                    "Cannot create a work order for an already completed maintenance task"
            );
        }
    }

    /**
     * Parses and validates spare parts consumed text during work order completion.
     */
    public java.util.List<com.medtrack.dto.SparePartDeductionItem> validateAndExtractSparePartUsage(
            String partsUsed
    ) {
        if (partsUsed == null || partsUsed.isBlank()) {
            return java.util.List.of();
        }
        java.util.List<com.medtrack.dto.SparePartDeductionItem> items =
                com.medtrack.dto.SparePartDeductionItem.parsePartsUsed(partsUsed);
        for (com.medtrack.dto.SparePartDeductionItem item : items) {
            if (item.getQuantity() == null || item.getQuantity() <= 0) {
                throw new IllegalArgumentException(
                        "Deduction quantity for spare part " + item.getPartNumber() + " must be greater than zero"
                );
            }
        }
        return items;
    }
}
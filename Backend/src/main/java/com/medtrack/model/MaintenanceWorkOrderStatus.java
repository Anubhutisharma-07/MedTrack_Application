package com.medtrack.model;

/**
 * Lifecycle states for a maintenance work order.
 *
 * <p>A work order follows a controlled workflow from creation through
 * assignment and execution to completion or cancellation.</p>
 */
public enum MaintenanceWorkOrderStatus {

    /**
     * Work order has been created but no technician has been assigned.
     */
    OPEN,

    /**
     * Work order has been assigned to a technician.
     */
    ASSIGNED,

    /**
     * Technician has started working on the maintenance activity.
     */
    IN_PROGRESS,

    /**
     * Work has temporarily stopped and can be resumed later.
     */
    ON_HOLD,

    /**
     * Maintenance work has been successfully completed.
     */
    COMPLETED,

    /**
     * Work order was cancelled before completion.
     */
    CANCELLED
}
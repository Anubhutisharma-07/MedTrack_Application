package com.medtrack.model;

/**
 * Defines the nature of the maintenance activity represented
 * by a work order.
 */
public enum MaintenanceWorkOrderType {

    PREVENTIVE,

    CORRECTIVE,

    EMERGENCY,

    INSPECTION,

    CALIBRATION,

    OTHER
}
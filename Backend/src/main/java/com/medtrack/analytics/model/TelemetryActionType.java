package com.medtrack.analytics.model;

/**
 * Valid action types for telemetry events.
 * These represent the various operations and diagnostic actions that can be performed on equipment.
 */
public enum TelemetryActionType {
    DEVICE_DIAGNOSTIC,
    BOOT_SEQUENCE,
    CALIBRATION,
    FIRMWARE_UPDATE,
    BATTERY_TEST,
    PUMP_CALIBRATION,
    DIAGNOSTIC_RUN,
    SYSTEM_CHECK,
    PERFORMANCE_TEST,
    DATA_SYNC,
    CONFIGURATION_UPDATE,
    SECURITY_SCAN,
    NETWORK_TEST,
    SENSOR_CALIBRATION,
    SOFTWARE_INSTALL,
    LOG_EXPORT
}
package com.medtrack.analytics.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TelemetryEventRequest {

    @NotNull(message = "User ID is required")
    private Long userId;

    private Long equipmentId;

    @NotBlank(message = "Action type is required")
    @Pattern(regexp = "DEVICE_DIAGNOSTIC|BOOT_SEQUENCE|CALIBRATION|FIRMWARE_UPDATE|BATTERY_TEST|PUMP_CALIBRATION|DIAGNOSTIC_RUN|SYSTEM_CHECK|PERFORMANCE_TEST|DATA_SYNC|CONFIGURATION_UPDATE|SECURITY_SCAN|NETWORK_TEST|SENSOR_CALIBRATION|SOFTWARE_INSTALL|LOG_EXPORT",
            message = "Invalid action type. Must be one of: DEVICE_DIAGNOSTIC, BOOT_SEQUENCE, CALIBRATION, FIRMWARE_UPDATE, BATTERY_TEST, PUMP_CALIBRATION, DIAGNOSTIC_RUN, SYSTEM_CHECK, PERFORMANCE_TEST, DATA_SYNC, CONFIGURATION_UPDATE, SECURITY_SCAN, NETWORK_TEST, SENSOR_CALIBRATION, SOFTWARE_INSTALL, LOG_EXPORT")
    private String actionType;

    private String previousActionType;

    @Pattern(regexp = "^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^(([0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4})?::(([0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4})?$|^$",
            message = "IP address must be a valid IPv4 or IPv6 address")
    private String ipAddress;

    private String endpointAccessed;

    private Integer executionTimeMs;

    @NotNull(message = "Success flag is required")
    private Boolean success;

    private Integer responseStatus;

    private String sessionId;

    private String deviceFingerprint;

    private String metadata;

    // ---------------------------------------------------------------------
    // Geolocation fields (issue #1228)
    //
    // Equipment telemetry may include GPS coordinates for geofence validation.
    // These are optional - not all equipment reports location data.
    // ---------------------------------------------------------------------

    @Min(value = -90, message = "Latitude must be between -90 and 90")
    @Max(value = 90, message = "Latitude must be between -90 and 90")
    private Double latitude;

    @Min(value = -180, message = "Longitude must be between -180 and 180")
    @Max(value = 180, message = "Longitude must be between -180 and 180")
    private Double longitude;
}

package com.medtrack.analytics.service;

import com.medtrack.analytics.dto.TelemetryEventRequest;
import com.medtrack.analytics.model.SoftwareTelemetryLog;
import com.medtrack.analytics.repository.SoftwareTelemetryLogRepository;
import com.medtrack.auth.model.User;
import com.medtrack.model.Equipment;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class TelemetryCollectionService {

    private final SoftwareTelemetryLogRepository telemetryLogRepository;
    private final EntityManager entityManager;
    private final GeofenceValidationService geofenceValidationService;

    private static final Pattern IPV4_PATTERN = Pattern.compile(
            "^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$"
    );
    
    private static final Pattern IPV6_PATTERN = Pattern.compile(
            "^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^(([0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4})?::(([0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4})?$"
    );

    private static final String VALID_ACTION_TYPES = 
            "DEVICE_DIAGNOSTIC|BOOT_SEQUENCE|CALIBRATION|FIRMWARE_UPDATE|BATTERY_TEST|PUMP_CALIBRATION|DIAGNOSTIC_RUN|SYSTEM_CHECK|PERFORMANCE_TEST|DATA_SYNC|CONFIGURATION_UPDATE|SECURITY_SCAN|NETWORK_TEST|SENSOR_CALIBRATION|SOFTWARE_INSTALL|LOG_EXPORT";

    @Transactional
    public void collectTelemetry(TelemetryEventRequest request) {
        validateTelemetryRequest(request);
        
        log.debug("Collecting telemetry for user {} action {}", request.getUserId(), request.getActionType());

        // Use getReference to avoid DB query for just setting the foreign key
        User user = entityManager.getReference(User.class, request.getUserId());
        Equipment equipment = null;
        
        if (request.getEquipmentId() != null) {
            equipment = entityManager.getReference(Equipment.class, request.getEquipmentId());
        }

        SoftwareTelemetryLog logEntry = SoftwareTelemetryLog.builder()
                .user(user)
                .equipment(equipment)
                .actionType(request.getActionType())
                .previousActionType(request.getPreviousActionType())
                .timestamp(LocalDateTime.now())
                .ipAddress(request.getIpAddress())
                .endpointAccessed(request.getEndpointAccessed())
                .executionTimeMs(request.getExecutionTimeMs())
                .success(request.getSuccess())
                .responseStatus(request.getResponseStatus())
                .sessionId(request.getSessionId())
                .deviceFingerprint(request.getDeviceFingerprint())
                .metadata(request.getMetadata())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .build();

        telemetryLogRepository.save(logEntry);

        // Validate equipment location against geofence (issue #1228)
        if (equipment != null && request.getLatitude() != null && request.getLongitude() != null) {
            geofenceValidationService.validateEquipmentLocation(
                    equipment.getId(),
                    request.getLatitude(),
                    request.getLongitude()
            );
        }
    }

    private void validateTelemetryRequest(TelemetryEventRequest request) {
        // Validate action type against allowed values
        if (request.getActionType() != null && !VALID_ACTION_TYPES.contains(request.getActionType())) {
            throw new IllegalArgumentException(
                    "Invalid action type: " + request.getActionType() + 
                    ". Must be one of: " + VALID_ACTION_TYPES.replace("|", ", ")
            );
        }

        // Validate IP address format if provided
        if (request.getIpAddress() != null && !request.getIpAddress().trim().isEmpty()) {
            boolean isValidIp = IPV4_PATTERN.matcher(request.getIpAddress()).matches() || 
                              IPV6_PATTERN.matcher(request.getIpAddress()).matches();
            if (!isValidIp) {
                throw new IllegalArgumentException(
                        "Invalid IP address format: " + request.getIpAddress() + 
                        ". Must be a valid IPv4 or IPv6 address"
                );
            }
        }

        // Validate latitude range if provided
        if (request.getLatitude() != null) {
            if (request.getLatitude() < -90 || request.getLatitude() > 90) {
                throw new IllegalArgumentException(
                        "Invalid latitude: " + request.getLatitude() + 
                        ". Must be between -90 and 90"
                );
            }
        }

        // Validate longitude range if provided
        if (request.getLongitude() != null) {
            if (request.getLongitude() < -180 || request.getLongitude() > 180) {
                throw new IllegalArgumentException(
                        "Invalid longitude: " + request.getLongitude() + 
                        ". Must be between -180 and 180"
                );
            }
        }
    }
}

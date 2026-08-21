package com.medtrack.analytics.service;

import com.medtrack.analytics.dto.TelemetryEventRequest;
import com.medtrack.analytics.repository.SoftwareTelemetryLogRepository;
import com.medtrack.auth.model.User;
import com.medtrack.model.Equipment;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

@ExtendWith(MockitoExtension.class)
class TelemetryCollectionServiceValidationTest {

    @Mock
    private SoftwareTelemetryLogRepository telemetryLogRepository;

    @Mock
    private EntityManager entityManager;

    @Mock
    private GeofenceValidationService geofenceValidationService;

    @Mock
    private User user;

    @Mock
    private Equipment equipment;

    private TelemetryCollectionService telemetryCollectionService;

    @BeforeEach
    void setUp() {
        telemetryCollectionService = new TelemetryCollectionService(
                telemetryLogRepository,
                entityManager,
                geofenceValidationService
        );
    }

    @Test
    void validRequestWithAllFieldsPassesValidation() {
        TelemetryEventRequest request = TelemetryEventRequest.builder()
                .userId(1L)
                .equipmentId(100L)
                .actionType("DEVICE_DIAGNOSTIC")
                .previousActionType("BOOT_SEQUENCE")
                .ipAddress("192.168.1.100")
                .endpointAccessed("/api/v1/telemetry/diagnostics")
                .executionTimeMs(145)
                .success(true)
                .responseStatus(200)
                .sessionId("session-123")
                .deviceFingerprint("device-fingerprint-abc")
                .metadata("{\"key\":\"value\"}")
                .latitude(40.7128)
                .longitude(-74.0060)
                .build();

        // Mock the EntityManager to return user and equipment
        org.mockito.Mockito.when(entityManager.getReference(User.class, 1L)).thenReturn(user);
        org.mockito.Mockito.when(entityManager.getReference(Equipment.class, 100L)).thenReturn(equipment);

        assertDoesNotThrow(() -> telemetryCollectionService.collectTelemetry(request));
    }

    @Test
    void validRequestWithIPv6AddressPassesValidation() {
        TelemetryEventRequest request = TelemetryEventRequest.builder()
                .userId(1L)
                .actionType("FIRMWARE_UPDATE")
                .ipAddress("2001:0db8:85a3:0000:0000:8a2e:0370:7334")
                .success(true)
                .build();

        org.mockito.Mockito.when(entityManager.getReference(User.class, 1L)).thenReturn(user);

        assertDoesNotThrow(() -> telemetryCollectionService.collectTelemetry(request));
    }

    @Test
    void validRequestWithShortenedIPv6AddressPassesValidation() {
        TelemetryEventRequest request = TelemetryEventRequest.builder()
                .userId(1L)
                .actionType("CALIBRATION")
                .ipAddress("2001:db8:85a3::8a2e:370:7334")
                .success(true)
                .build();

        org.mockito.Mockito.when(entityManager.getReference(User.class, 1L)).thenReturn(user);

        assertDoesNotThrow(() -> telemetryCollectionService.collectTelemetry(request));
    }

    @Test
    void invalidActionTypeThrowsIllegalArgumentException() {
        TelemetryEventRequest request = TelemetryEventRequest.builder()
                .userId(1L)
                .actionType("INVALID_ACTION_TYPE")
                .success(true)
                .build();

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> telemetryCollectionService.collectTelemetry(request)
        );

        assertEquals("Invalid action type: INVALID_ACTION_TYPE. Must be one of: " +
                "DEVICE_DIAGNOSTIC, BOOT_SEQUENCE, CALIBRATION, FIRMWARE_UPDATE, BATTERY_TEST, " +
                "PUMP_CALIBRATION, DIAGNOSTIC_RUN, SYSTEM_CHECK, PERFORMANCE_TEST, DATA_SYNC, " +
                "CONFIGURATION_UPDATE, SECURITY_SCAN, NETWORK_TEST, SENSOR_CALIBRATION, SOFTWARE_INSTALL, LOG_EXPORT",
                exception.getMessage());
    }

    @Test
    void invalidIPv4AddressThrowsIllegalArgumentException() {
        TelemetryEventRequest request = TelemetryEventRequest.builder()
                .userId(1L)
                .actionType("DEVICE_DIAGNOSTIC")
                .ipAddress("256.1.1.1")
                .success(true)
                .build();

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> telemetryCollectionService.collectTelemetry(request)
        );

        assertEquals("Invalid IP address format: 256.1.1.1. Must be a valid IPv4 or IPv6 address",
                exception.getMessage());
    }

    @Test
    void invalidIPv6AddressThrowsIllegalArgumentException() {
        TelemetryEventRequest request = TelemetryEventRequest.builder()
                .userId(1L)
                .actionType("BOOT_SEQUENCE")
                .ipAddress("2001:::db8::1")
                .success(true)
                .build();

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> telemetryCollectionService.collectTelemetry(request)
        );

        assertEquals("Invalid IP address format: 2001:::db8::1. Must be a valid IPv4 or IPv6 address",
                exception.getMessage());
    }

    @Test
    void latitudeExceedsMaximumThrowsIllegalArgumentException() {
        TelemetryEventRequest request = TelemetryEventRequest.builder()
                .userId(1L)
                .actionType("CALIBRATION")
                .latitude(91.0)
                .success(true)
                .build();

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> telemetryCollectionService.collectTelemetry(request)
        );

        assertEquals("Invalid latitude: 91.0. Must be between -90 and 90",
                exception.getMessage());
    }

    @Test
    void latitudeBelowMinimumThrowsIllegalArgumentException() {
        TelemetryEventRequest request = TelemetryEventRequest.builder()
                .userId(1L)
                .actionType("FIRMWARE_UPDATE")
                .latitude(-91.0)
                .success(true)
                .build();

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> telemetryCollectionService.collectTelemetry(request)
        );

        assertEquals("Invalid latitude: -91.0. Must be between -90 and 90",
                exception.getMessage());
    }

    @Test
    void longitudeExceedsMaximumThrowsIllegalArgumentException() {
        TelemetryEventRequest request = TelemetryEventRequest.builder()
                .userId(1L)
                .actionType("BATTERY_TEST")
                .longitude(181.0)
                .success(true)
                .build();

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> telemetryCollectionService.collectTelemetry(request)
        );

        assertEquals("Invalid longitude: 181.0. Must be between -180 and 180",
                exception.getMessage());
    }

    @Test
    void longitudeBelowMinimumThrowsIllegalArgumentException() {
        TelemetryEventRequest request = TelemetryEventRequest.builder()
                .userId(1L)
                .actionType("PUMP_CALIBRATION")
                .longitude(-181.0)
                .success(true)
                .build();

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> telemetryCollectionService.collectTelemetry(request)
        );

        assertEquals("Invalid longitude: -181.0. Must be between -180 and 180",
                exception.getMessage());
    }

    @Test
    void validBoundaryValuesPassValidation() {
        TelemetryEventRequest request = TelemetryEventRequest.builder()
                .userId(1L)
                .actionType("SYSTEM_CHECK")
                .latitude(90.0)
                .longitude(180.0)
                .success(true)
                .build();

        org.mockito.Mockito.when(entityManager.getReference(User.class, 1L)).thenReturn(user);

        assertDoesNotThrow(() -> telemetryCollectionService.collectTelemetry(request));
    }

    @Test
    void validNegativeBoundaryValuesPassValidation() {
        TelemetryEventRequest request = TelemetryEventRequest.builder()
                .userId(1L)
                .actionType("PERFORMANCE_TEST")
                .latitude(-90.0)
                .longitude(-180.0)
                .success(true)
                .build();

        org.mockito.Mockito.when(entityManager.getReference(User.class, 1L)).thenReturn(user);

        assertDoesNotThrow(() -> telemetryCollectionService.collectTelemetry(request));
    }

    @Test
    void nullIpAddressIsAllowed() {
        TelemetryEventRequest request = TelemetryEventRequest.builder()
                .userId(1L)
                .actionType("DATA_SYNC")
                .ipAddress(null)
                .success(true)
                .build();

        org.mockito.Mockito.when(entityManager.getReference(User.class, 1L)).thenReturn(user);

        assertDoesNotThrow(() -> telemetryCollectionService.collectTelemetry(request));
    }

    @Test
    void emptyIpAddressIsAllowed() {
        TelemetryEventRequest request = TelemetryEventRequest.builder()
                .userId(1L)
                .actionType("CONFIGURATION_UPDATE")
                .ipAddress("")
                .success(true)
                .build();

        org.mockito.Mockito.when(entityManager.getReference(User.class, 1L)).thenReturn(user);

        // Empty string IP address is allowed (treated as not provided)
        assertDoesNotThrow(() -> telemetryCollectionService.collectTelemetry(request));
    }

    @Test
    void nullLatitudeIsAllowed() {
        TelemetryEventRequest request = TelemetryEventRequest.builder()
                .userId(1L)
                .actionType("SECURITY_SCAN")
                .latitude(null)
                .success(true)
                .build();

        org.mockito.Mockito.when(entityManager.getReference(User.class, 1L)).thenReturn(user);

        assertDoesNotThrow(() -> telemetryCollectionService.collectTelemetry(request));
    }

    @Test
    void nullLongitudeIsAllowed() {
        TelemetryEventRequest request = TelemetryEventRequest.builder()
                .userId(1L)
                .actionType("NETWORK_TEST")
                .longitude(null)
                .success(true)
                .build();

        org.mockito.Mockito.when(entityManager.getReference(User.class, 1L)).thenReturn(user);

        assertDoesNotThrow(() -> telemetryCollectionService.collectTelemetry(request));
    }

    @Test
    void allValidActionTypesPassServiceValidation() {
        String[] validActionTypes = {
                "DEVICE_DIAGNOSTIC", "BOOT_SEQUENCE", "CALIBRATION", "FIRMWARE_UPDATE",
                "BATTERY_TEST", "PUMP_CALIBRATION", "DIAGNOSTIC_RUN", "SYSTEM_CHECK",
                "PERFORMANCE_TEST", "DATA_SYNC", "CONFIGURATION_UPDATE", "SECURITY_SCAN",
                "NETWORK_TEST", "SENSOR_CALIBRATION", "SOFTWARE_INSTALL", "LOG_EXPORT"
        };

        org.mockito.Mockito.when(entityManager.getReference(User.class, 1L)).thenReturn(user);

        for (String actionType : validActionTypes) {
            TelemetryEventRequest request = TelemetryEventRequest.builder()
                    .userId(1L)
                    .actionType(actionType)
                    .success(true)
                    .build();

            assertDoesNotThrow(() -> telemetryCollectionService.collectTelemetry(request),
                    "Action type " + actionType + " should pass service validation");
        }
    }

    @Test
    void malformedIpAddressThrowsIllegalArgumentException() {
        TelemetryEventRequest request = TelemetryEventRequest.builder()
                .userId(1L)
                .actionType("SENSOR_CALIBRATION")
                .ipAddress("not.an.ip.address")
                .success(true)
                .build();

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> telemetryCollectionService.collectTelemetry(request)
        );

        assertEquals("Invalid IP address format: not.an.ip.address. Must be a valid IPv4 or IPv6 address",
                exception.getMessage());
    }

    @Test
    void requestWithoutEquipmentIdPassesValidation() {
        TelemetryEventRequest request = TelemetryEventRequest.builder()
                .userId(1L)
                .actionType("SOFTWARE_INSTALL")
                .equipmentId(null)
                .success(true)
                .build();

        org.mockito.Mockito.when(entityManager.getReference(User.class, 1L)).thenReturn(user);

        assertDoesNotThrow(() -> telemetryCollectionService.collectTelemetry(request));
    }
}
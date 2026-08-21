package com.medtrack.analytics.dto;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class TelemetryEventRequestValidationTest {

    private final Validator validator =
            Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void validRequestPassesValidation() {
        TelemetryEventRequest request = TelemetryEventRequest.builder()
                .userId(1L)
                .actionType("DEVICE_DIAGNOSTIC")
                .ipAddress("192.168.1.100")
                .latitude(40.7128)
                .longitude(-74.0060)
                .success(true)
                .build();

        var violations = validator.validate(request);
        assertEquals(0, violations.size());
    }

    @Test
    void validIPv6AddressPassesValidation() {
        TelemetryEventRequest request = TelemetryEventRequest.builder()
                .userId(1L)
                .actionType("FIRMWARE_UPDATE")
                .ipAddress("2001:0db8:85a3:0000:0000:8a2e:0370:7334")
                .success(true)
                .build();

        var violations = validator.validate(request);
        assertEquals(0, violations.size());
    }

    @Test
    void validIPv6ShortenedAddressPassesValidation() {
        TelemetryEventRequest request = TelemetryEventRequest.builder()
                .userId(1L)
                .actionType("CALIBRATION")
                .ipAddress("2001:db8:85a3::8a2e:370:7334")
                .success(true)
                .build();

        var violations = validator.validate(request);
        assertEquals(0, violations.size());
    }

    @Test
    void nullUserIdFailsValidation() {
        TelemetryEventRequest request = TelemetryEventRequest.builder()
                .userId(null)
                .actionType("DEVICE_DIAGNOSTIC")
                .success(true)
                .build();

        var violations = validator.validate(request);
        assertEquals(1, violations.size());
        assertTrue(violations.stream().anyMatch(violation ->
                violation.getPropertyPath().toString().equals("userId") &&
                        violation.getMessage().equals("User ID is required")));
    }

    @Test
    void blankActionTypeFailsValidation() {
        TelemetryEventRequest request = TelemetryEventRequest.builder()
                .userId(1L)
                .actionType("")
                .success(true)
                .build();

        var violations = validator.validate(request);
        assertTrue(violations.size() >= 1, "Should have at least one violation for blank action type");
        assertTrue(violations.stream().anyMatch(violation ->
                violation.getPropertyPath().toString().equals("actionType")));
    }

    @Test
    void nullActionTypeFailsValidation() {
        TelemetryEventRequest request = TelemetryEventRequest.builder()
                .userId(1L)
                .actionType(null)
                .success(true)
                .build();

        var violations = validator.validate(request);
        assertEquals(1, violations.size());
        assertTrue(violations.stream().anyMatch(violation ->
                violation.getPropertyPath().toString().equals("actionType") &&
                        violation.getMessage().equals("Action type is required")));
    }

    @Test
    void invalidActionTypeFailsValidation() {
        TelemetryEventRequest request = TelemetryEventRequest.builder()
                .userId(1L)
                .actionType("INVALID_ACTION")
                .success(true)
                .build();

        var violations = validator.validate(request);
        assertEquals(1, violations.size());
        assertTrue(violations.stream().anyMatch(violation ->
                violation.getPropertyPath().toString().equals("actionType") &&
                        violation.getMessage().contains("Invalid action type")));
    }

    @Test
    void invalidIPv4AddressFailsValidation() {
        TelemetryEventRequest request = TelemetryEventRequest.builder()
                .userId(1L)
                .actionType("DEVICE_DIAGNOSTIC")
                .ipAddress("256.1.1.1")
                .success(true)
                .build();

        var violations = validator.validate(request);
        assertEquals(1, violations.size());
        assertTrue(violations.stream().anyMatch(violation ->
                violation.getPropertyPath().toString().equals("ipAddress") &&
                        violation.getMessage().contains("IP address must be a valid")));
    }

    @Test
    void invalidIPv6AddressFailsValidation() {
        TelemetryEventRequest request = TelemetryEventRequest.builder()
                .userId(1L)
                .actionType("BOOT_SEQUENCE")
                .ipAddress("2001:::db8::1")
                .success(true)
                .build();

        var violations = validator.validate(request);
        assertEquals(1, violations.size());
        assertTrue(violations.stream().anyMatch(violation ->
                violation.getPropertyPath().toString().equals("ipAddress") &&
                        violation.getMessage().contains("IP address must be a valid")));
    }

    @Test
    void latitudeExceedsMaximumFailsValidation() {
        TelemetryEventRequest request = TelemetryEventRequest.builder()
                .userId(1L)
                .actionType("CALIBRATION")
                .latitude(91.0)
                .success(true)
                .build();

        var violations = validator.validate(request);
        assertEquals(1, violations.size());
        assertTrue(violations.stream().anyMatch(violation ->
                violation.getPropertyPath().toString().equals("latitude") &&
                        violation.getMessage().contains("Latitude must be between -90 and 90")));
    }

    @Test
    void latitudeBelowMinimumFailsValidation() {
        TelemetryEventRequest request = TelemetryEventRequest.builder()
                .userId(1L)
                .actionType("FIRMWARE_UPDATE")
                .latitude(-91.0)
                .success(true)
                .build();

        var violations = validator.validate(request);
        assertEquals(1, violations.size());
        assertTrue(violations.stream().anyMatch(violation ->
                violation.getPropertyPath().toString().equals("latitude") &&
                        violation.getMessage().contains("Latitude must be between -90 and 90")));
    }

    @Test
    void longitudeExceedsMaximumFailsValidation() {
        TelemetryEventRequest request = TelemetryEventRequest.builder()
                .userId(1L)
                .actionType("BATTERY_TEST")
                .longitude(181.0)
                .success(true)
                .build();

        var violations = validator.validate(request);
        assertEquals(1, violations.size());
        assertTrue(violations.stream().anyMatch(violation ->
                violation.getPropertyPath().toString().equals("longitude") &&
                        violation.getMessage().contains("Longitude must be between -180 and 180")));
    }

    @Test
    void longitudeBelowMinimumFailsValidation() {
        TelemetryEventRequest request = TelemetryEventRequest.builder()
                .userId(1L)
                .actionType("PUMP_CALIBRATION")
                .longitude(-181.0)
                .success(true)
                .build();

        var violations = validator.validate(request);
        assertEquals(1, violations.size());
        assertTrue(violations.stream().anyMatch(violation ->
                violation.getPropertyPath().toString().equals("longitude") &&
                        violation.getMessage().contains("Longitude must be between -180 and 180")));
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

        var violations = validator.validate(request);
        assertEquals(0, violations.size());
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

        var violations = validator.validate(request);
        assertEquals(0, violations.size());
    }

    @Test
    void nullSuccessFlagFailsValidation() {
        TelemetryEventRequest request = TelemetryEventRequest.builder()
                .userId(1L)
                .actionType("DATA_SYNC")
                .success(null)
                .build();

        var violations = validator.validate(request);
        assertEquals(1, violations.size());
        assertTrue(violations.stream().anyMatch(violation ->
                violation.getPropertyPath().toString().equals("success") &&
                        violation.getMessage().equals("Success flag is required")));
    }

    @Test
    void allValidActionTypesPassValidation() {
        String[] validActionTypes = {
                "DEVICE_DIAGNOSTIC", "BOOT_SEQUENCE", "CALIBRATION", "FIRMWARE_UPDATE",
                "BATTERY_TEST", "PUMP_CALIBRATION", "DIAGNOSTIC_RUN", "SYSTEM_CHECK",
                "PERFORMANCE_TEST", "DATA_SYNC", "CONFIGURATION_UPDATE", "SECURITY_SCAN",
                "NETWORK_TEST", "SENSOR_CALIBRATION", "SOFTWARE_INSTALL", "LOG_EXPORT"
        };

        for (String actionType : validActionTypes) {
            TelemetryEventRequest request = TelemetryEventRequest.builder()
                    .userId(1L)
                    .actionType(actionType)
                    .success(true)
                    .build();

            var violations = validator.validate(request);
            assertEquals(0, violations.size(),
                    "Action type " + actionType + " should pass validation");
        }
    }

    @Test
    void optionalFieldsCanBeNull() {
        TelemetryEventRequest request = TelemetryEventRequest.builder()
                .userId(1L)
                .actionType("DEVICE_DIAGNOSTIC")
                .success(true)
                .ipAddress(null)
                .latitude(null)
                .longitude(null)
                .equipmentId(null)
                .previousActionType(null)
                .endpointAccessed(null)
                .executionTimeMs(null)
                .responseStatus(null)
                .sessionId(null)
                .deviceFingerprint(null)
                .metadata(null)
                .build();

        var violations = validator.validate(request);
        assertEquals(0, violations.size());
    }

    @Test
    void emptyIpAddressIsAllowedWhenNotProvided() {
        TelemetryEventRequest request = TelemetryEventRequest.builder()
                .userId(1L)
                .actionType("CONFIGURATION_UPDATE")
                .ipAddress("")
                .success(true)
                .build();

        var violations = validator.validate(request);
        assertEquals(0, violations.size());
    }
}
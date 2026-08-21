package com.medtrack.dto;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Comprehensive unit test suite for {@link MaintenanceScheduleAmendmentRequest}
 * and custom constraint validation.
 */
@DisplayName("MaintenanceScheduleAmendmentRequest Comprehensive Validation Test Suite")
class MaintenanceScheduleAmendmentValidatorTest {

    private static Validator validator;

    @BeforeAll
    static void setUpValidator() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    @DisplayName("Valid schedule amendment request with future deadline passes validation")
    void validRequestWithFutureDeadlinePassesValidation() {
        MaintenanceScheduleAmendmentRequest request = MaintenanceScheduleAmendmentRequest.builder()
                .deadline(LocalDate.now().plusDays(10))
                .maintenanceType("Inspection")
                .description("Routine quarterly inspection")
                .priority("HIGH")
                .recurrencePeriodDays(90)
                .reason("Scheduled preventive maintenance window shift")
                .build();

        Set<ConstraintViolation<MaintenanceScheduleAmendmentRequest>> violations = validator.validate(request);

        assertTrue(violations.isEmpty(), "Valid schedule amendment request should yield zero violations");
    }

    @Test
    @DisplayName("Valid request with newDeadline fallback passes validation")
    void validRequestWithNewDeadlineFallbackPassesValidation() {
        MaintenanceScheduleAmendmentRequest request = MaintenanceScheduleAmendmentRequest.builder()
                .newDeadline(LocalDate.now().plusDays(5))
                .reason("Rescheduled due to parts delivery")
                .build();

        Set<ConstraintViolation<MaintenanceScheduleAmendmentRequest>> violations = validator.validate(request);

        assertTrue(violations.isEmpty(), "Request using newDeadline fallback should pass validation");
        assertEquals(LocalDate.now().plusDays(5), request.getDeadline());
    }

    @Test
    @DisplayName("Past deadline produces constraint violation for deadline property")
    void pastDeadlineProducesConstraintViolationForDeadline() {
        MaintenanceScheduleAmendmentRequest request = MaintenanceScheduleAmendmentRequest.builder()
                .deadline(LocalDate.now().minusDays(1))
                .reason("Attempting past amendment date")
                .build();

        Set<ConstraintViolation<MaintenanceScheduleAmendmentRequest>> violations = validator.validate(request);

        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v ->
                v.getPropertyPath().toString().equals("deadline")
                        && v.getMessage().equals("Amended deadline cannot be in the past")));
    }

    @Test
    @DisplayName("Past deadline produces constraint violation when newDeadline is set")
    void pastDeadlineProducesConstraintViolationForNewDeadline() {
        MaintenanceScheduleAmendmentRequest request = MaintenanceScheduleAmendmentRequest.builder()
                .newDeadline(LocalDate.now().minusDays(3))
                .reason("Attempting past amendment date via newDeadline")
                .build();

        Set<ConstraintViolation<MaintenanceScheduleAmendmentRequest>> violations = validator.validate(request);

        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v ->
                v.getPropertyPath().toString().equals("deadline")
                        && v.getMessage().equals("Amended deadline cannot be in the past")));
    }

    @Test
    @DisplayName("Blank amendment reason produces constraint violation")
    void blankReasonProducesConstraintViolation() {
        MaintenanceScheduleAmendmentRequest request = MaintenanceScheduleAmendmentRequest.builder()
                .deadline(LocalDate.now().plusDays(3))
                .reason("   ")
                .build();

        Set<ConstraintViolation<MaintenanceScheduleAmendmentRequest>> violations = validator.validate(request);

        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v ->
                v.getPropertyPath().toString().equals("reason")
                        && v.getMessage().equals("Amendment reason is required")));
    }

    @Test
    @DisplayName("Null amendment reason produces constraint violation")
    void nullReasonProducesConstraintViolation() {
        MaintenanceScheduleAmendmentRequest request = MaintenanceScheduleAmendmentRequest.builder()
                .deadline(LocalDate.now().plusDays(3))
                .reason(null)
                .build();

        Set<ConstraintViolation<MaintenanceScheduleAmendmentRequest>> violations = validator.validate(request);

        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v ->
                v.getPropertyPath().toString().equals("reason")));
    }

    @Test
    @DisplayName("Oversized fields produce constraint violations matching persistence bounds")
    void oversizedFieldsProduceConstraintViolations() {
        MaintenanceScheduleAmendmentRequest request = MaintenanceScheduleAmendmentRequest.builder()
                .deadline(LocalDate.now().plusDays(7))
                .maintenanceType("M".repeat(256))
                .description("D".repeat(256))
                .priority("P".repeat(256))
                .recurrencePeriodDays(-1)
                .reason("R".repeat(1_001))
                .build();

        Set<ConstraintViolation<MaintenanceScheduleAmendmentRequest>> violations = validator.validate(request);

        assertEquals(5, violations.size());
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("maintenanceType")));
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("description")));
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("priority")));
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("recurrencePeriodDays")));
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("reason")));
    }

    @Test
    @DisplayName("Zero recurrence period days disables recurrence and passes validation")
    void zeroRecurrencePeriodDaysDisablesRecurrenceAndPassesValidation() {
        MaintenanceScheduleAmendmentRequest request = MaintenanceScheduleAmendmentRequest.builder()
                .deadline(LocalDate.now().plusDays(7))
                .recurrencePeriodDays(0)
                .reason("Disabling schedule recurrence")
                .build();

        Set<ConstraintViolation<MaintenanceScheduleAmendmentRequest>> violations = validator.validate(request);

        assertTrue(violations.isEmpty());
    }

    @Test
    @DisplayName("Negative recurrence period days produces constraint violation")
    void negativeRecurrencePeriodDaysProducesConstraintViolation() {
        MaintenanceScheduleAmendmentRequest request = MaintenanceScheduleAmendmentRequest.builder()
                .deadline(LocalDate.now().plusDays(7))
                .recurrencePeriodDays(-5)
                .reason("Invalid negative recurrence")
                .build();

        Set<ConstraintViolation<MaintenanceScheduleAmendmentRequest>> violations = validator.validate(request);

        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v ->
                v.getPropertyPath().toString().equals("recurrencePeriodDays")
                        && v.getMessage().equals("Recurrence period days must not be negative")));
    }

    @Test
    @DisplayName("Fallback getDeadline resolves deadline over newDeadline when both exist")
    void getDeadlineResolvesPrimaryDeadlineOverNewDeadline() {
        LocalDate primary = LocalDate.now().plusDays(10);
        LocalDate fallback = LocalDate.now().plusDays(20);

        MaintenanceScheduleAmendmentRequest request = MaintenanceScheduleAmendmentRequest.builder()
                .deadline(primary)
                .newDeadline(fallback)
                .reason("Testing deadline precedence")
                .build();

        assertEquals(primary, request.getDeadline());
    }

    @Test
    @DisplayName("Fallback getDeadline returns null when neither deadline is set")
    void getDeadlineReturnsNullWhenNeitherSet() {
        MaintenanceScheduleAmendmentRequest request = MaintenanceScheduleAmendmentRequest.builder()
                .reason("Testing null deadline getter")
                .build();

        assertNull(request.getDeadline());
    }
}

package com.medtrack.dto;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Validation tests for {@link StockAdjustmentRequest}.
 * Ensures that negative stock values are rejected by validation annotations.
 */
@DisplayName("StockAdjustmentRequest validation")
class StockAdjustmentRequestValidationTest {

    private static Validator validator;

    @BeforeAll
    static void setUpValidator() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Nested
    @DisplayName("minimumStock field validation")
    class MinimumStockValidation {

        @Test
        @DisplayName("accepts null minimumStock (optional field)")
        void acceptsNullMinimumStock() {
            StockAdjustmentRequest request = StockAdjustmentRequest.builder()
                    .delta(5)
                    .minimumStock(null)
                    .build();

            Set<ConstraintViolation<StockAdjustmentRequest>> violations = validator.validate(request);
            assertTrue(violations.isEmpty(), "null minimumStock should be valid");
        }

        @Test
        @DisplayName("accepts zero minimumStock")
        void acceptsZeroMinimumStock() {
            StockAdjustmentRequest request = StockAdjustmentRequest.builder()
                    .delta(5)
                    .minimumStock(0)
                    .build();

            Set<ConstraintViolation<StockAdjustmentRequest>> violations = validator.validate(request);
            assertTrue(violations.isEmpty(), "zero minimumStock should be valid");
        }

        @Test
        @DisplayName("accepts positive minimumStock")
        void acceptsPositiveMinimumStock() {
            StockAdjustmentRequest request = StockAdjustmentRequest.builder()
                    .delta(5)
                    .minimumStock(10)
                    .build();

            Set<ConstraintViolation<StockAdjustmentRequest>> violations = validator.validate(request);
            assertTrue(violations.isEmpty(), "positive minimumStock should be valid");
        }

        @Test
        @DisplayName("rejects negative minimumStock")
        void rejectsNegativeMinimumStock() {
            StockAdjustmentRequest request = StockAdjustmentRequest.builder()
                    .delta(5)
                    .minimumStock(-1)
                    .build();

            Set<ConstraintViolation<StockAdjustmentRequest>> violations = validator.validate(request);
            assertEquals(1, violations.size(), "negative minimumStock should violate validation");
            
            ConstraintViolation<StockAdjustmentRequest> violation = violations.iterator().next();
            assertEquals("minimumStock", violation.getPropertyPath().toString());
            assertTrue(violation.getMessage().contains("cannot be negative"), 
                    "error message should mention negative values");
        }

        @Test
        @DisplayName("rejects large negative minimumStock")
        void rejectsLargeNegativeMinimumStock() {
            StockAdjustmentRequest request = StockAdjustmentRequest.builder()
                    .delta(5)
                    .minimumStock(-100)
                    .build();

            Set<ConstraintViolation<StockAdjustmentRequest>> violations = validator.validate(request);
            assertEquals(1, violations.size(), "large negative minimumStock should violate validation");
            
            ConstraintViolation<StockAdjustmentRequest> violation = violations.iterator().next();
            assertEquals("minimumStock", violation.getPropertyPath().toString());
        }
    }

    @Nested
    @DisplayName("delta field validation")
    class DeltaValidation {

        @Test
        @DisplayName("rejects null delta")
        void rejectsNullDelta() {
            StockAdjustmentRequest request = StockAdjustmentRequest.builder()
                    .delta(null)
                    .build();

            Set<ConstraintViolation<StockAdjustmentRequest>> violations = validator.validate(request);
            assertEquals(1, violations.size(), "null delta should violate @NotNull validation");
            
            ConstraintViolation<StockAdjustmentRequest> violation = violations.iterator().next();
            assertEquals("delta", violation.getPropertyPath().toString());
            assertTrue(violation.getMessage().contains("required"), 
                    "error message should mention required field");
        }

        @Test
        @DisplayName("accepts positive delta")
        void acceptsPositiveDelta() {
            StockAdjustmentRequest request = StockAdjustmentRequest.builder()
                    .delta(10)
                    .build();

            Set<ConstraintViolation<StockAdjustmentRequest>> violations = validator.validate(request);
            assertTrue(violations.isEmpty(), "positive delta should be valid");
        }

        @Test
        @DisplayName("accepts negative delta (stock removal)")
        void acceptsNegativeDelta() {
            StockAdjustmentRequest request = StockAdjustmentRequest.builder()
                    .delta(-5)
                    .build();

            Set<ConstraintViolation<StockAdjustmentRequest>> violations = validator.validate(request);
            assertTrue(violations.isEmpty(), "negative delta should be valid (for stock removal)");
        }

        @Test
        @DisplayName("accepts zero delta (business logic will reject, but validation allows)")
        void acceptsZeroDelta() {
            StockAdjustmentRequest request = StockAdjustmentRequest.builder()
                    .delta(0)
                    .build();

            Set<ConstraintViolation<StockAdjustmentRequest>> violations = validator.validate(request);
            assertTrue(violations.isEmpty(), "zero delta passes validation (business logic rejects it)");
        }
    }

    @Nested
    @DisplayName("reason field validation")
    class ReasonValidation {

        @Test
        @DisplayName("accepts null reason (optional field)")
        void acceptsNullReason() {
            StockAdjustmentRequest request = StockAdjustmentRequest.builder()
                    .delta(5)
                    .reason(null)
                    .build();

            Set<ConstraintViolation<StockAdjustmentRequest>> violations = validator.validate(request);
            assertTrue(violations.isEmpty(), "null reason should be valid");
        }

        @Test
        @DisplayName("accepts valid reason within size limit")
        void acceptsValidReason() {
            StockAdjustmentRequest request = StockAdjustmentRequest.builder()
                    .delta(5)
                    .reason("Delivery GRN-4471")
                    .build();

            Set<ConstraintViolation<StockAdjustmentRequest>> violations = validator.validate(request);
            assertTrue(violations.isEmpty(), "valid reason should be accepted");
        }

        @Test
        @DisplayName("rejects reason exceeding 255 characters")
        void rejectsLongReason() {
            String longReason = "a".repeat(256);
            StockAdjustmentRequest request = StockAdjustmentRequest.builder()
                    .delta(5)
                    .reason(longReason)
                    .build();

            Set<ConstraintViolation<StockAdjustmentRequest>> violations = validator.validate(request);
            assertEquals(1, violations.size(), "reason exceeding 255 characters should violate validation");
            
            ConstraintViolation<StockAdjustmentRequest> violation = violations.iterator().next();
            assertEquals("reason", violation.getPropertyPath().toString());
            assertTrue(violation.getMessage().contains("255"), 
                    "error message should mention character limit");
        }
    }

    @Nested
    @DisplayName("combined validation scenarios")
    class CombinedValidation {

        @Test
        @DisplayName("valid request with all fields")
        void acceptsValidCompleteRequest() {
            StockAdjustmentRequest request = StockAdjustmentRequest.builder()
                    .delta(10)
                    .minimumStock(5)
                    .reason("Stock delivery")
                    .build();

            Set<ConstraintViolation<StockAdjustmentRequest>> violations = validator.validate(request);
            assertTrue(violations.isEmpty(), "complete valid request should pass validation");
        }

        @Test
        @DisplayName("valid request with only required fields")
        void acceptsValidMinimalRequest() {
            StockAdjustmentRequest request = StockAdjustmentRequest.builder()
                    .delta(10)
                    .build();

            Set<ConstraintViolation<StockAdjustmentRequest>> violations = validator.validate(request);
            assertTrue(violations.isEmpty(), "minimal valid request should pass validation");
        }

        @Test
        @DisplayName("rejects request with negative minimumStock despite valid delta")
        void rejectsNegativeMinimumStockWithValidDelta() {
            StockAdjustmentRequest request = StockAdjustmentRequest.builder()
                    .delta(10)
                    .minimumStock(-5)
                    .reason("Stock delivery")
                    .build();

            Set<ConstraintViolation<StockAdjustmentRequest>> violations = validator.validate(request);
            assertEquals(1, violations.size(), "negative minimumStock should cause validation failure");
            
            ConstraintViolation<StockAdjustmentRequest> violation = violations.iterator().next();
            assertEquals("minimumStock", violation.getPropertyPath().toString());
        }

        @Test
        @DisplayName("reports multiple violations when multiple fields are invalid")
        void reportsMultipleViolations() {
            String longReason = "a".repeat(256);
            StockAdjustmentRequest request = StockAdjustmentRequest.builder()
                    .delta(null)
                    .minimumStock(-10)
                    .reason(longReason)
                    .build();

            Set<ConstraintViolation<StockAdjustmentRequest>> violations = validator.validate(request);
            assertEquals(3, violations.size(), "should report all validation violations");
        }
    }
}

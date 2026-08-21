package com.medtrack.model;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Validation tests for {@link Equipment} stock-related fields.
 * Ensures that negative stock values are rejected by validation annotations.
 */
@DisplayName("Equipment stock field validation")
class EquipmentStockValidationTest {

    private static ValidatorFactory validatorFactory;
    private static Validator validator;

    @BeforeAll
    static void createValidator() {
        validatorFactory = Validation.buildDefaultValidatorFactory();
        validator = validatorFactory.getValidator();
    }

    @AfterAll
    static void closeValidator() {
        validatorFactory.close();
    }

    private Equipment validEquipment() {
        return Equipment.builder()
                .name("Surgical Gloves")
                .department("Theatre")
                .quantity(10)
                .minimumStock(5)
                .build();
    }

    @Nested
    @DisplayName("quantity field validation")
    class QuantityValidation {

        @Test
        @DisplayName("rejects negative quantity")
        void rejectsNegativeQuantity() {
            Equipment equipment = validEquipment();
            equipment.setQuantity(-1);

            Set<ConstraintViolation<Equipment>> violations = validator.validate(equipment);

            assertEquals(1, violations.size());
            ConstraintViolation<Equipment> violation = violations.iterator().next();
            assertEquals("quantity", violation.getPropertyPath().toString());
            assertEquals("Quantity cannot be negative", violation.getMessage());
        }

        @Test
        @DisplayName("accepts zero quantity")
        void acceptsZeroQuantity() {
            Equipment equipment = validEquipment();
            equipment.setQuantity(0);

            Set<ConstraintViolation<Equipment>> violations = validator.validate(equipment);

            assertTrue(violations.isEmpty(), "zero quantity should be valid");
        }

        @Test
        @DisplayName("accepts positive quantity")
        void acceptsPositiveQuantity() {
            Equipment equipment = validEquipment();
            equipment.setQuantity(100);

            Set<ConstraintViolation<Equipment>> violations = validator.validate(equipment);

            assertTrue(violations.isEmpty(), "positive quantity should be valid");
        }

        @Test
        @DisplayName("rejects large negative quantity")
        void rejectsLargeNegativeQuantity() {
            Equipment equipment = validEquipment();
            equipment.setQuantity(-1000);

            Set<ConstraintViolation<Equipment>> violations = validator.validate(equipment);

            assertEquals(1, violations.size());
            ConstraintViolation<Equipment> violation = violations.iterator().next();
            assertEquals("quantity", violation.getPropertyPath().toString());
            assertEquals("Quantity cannot be negative", violation.getMessage());
        }
    }

    @Nested
    @DisplayName("minimumStock field validation")
    class MinimumStockValidation {

        @Test
        @DisplayName("rejects negative minimumStock")
        void rejectsNegativeMinimumStock() {
            Equipment equipment = validEquipment();
            equipment.setMinimumStock(-1);

            Set<ConstraintViolation<Equipment>> violations = validator.validate(equipment);

            assertEquals(1, violations.size());
            ConstraintViolation<Equipment> violation = violations.iterator().next();
            assertEquals("minimumStock", violation.getPropertyPath().toString());
            assertEquals("Minimum stock cannot be negative", violation.getMessage());
        }

        @Test
        @DisplayName("accepts zero minimumStock")
        void acceptsZeroMinimumStock() {
            Equipment equipment = validEquipment();
            equipment.setMinimumStock(0);

            Set<ConstraintViolation<Equipment>> violations = validator.validate(equipment);

            assertTrue(violations.isEmpty(), "zero minimumStock should be valid");
        }

        @Test
        @DisplayName("accepts positive minimumStock")
        void acceptsPositiveMinimumStock() {
            Equipment equipment = validEquipment();
            equipment.setMinimumStock(10);

            Set<ConstraintViolation<Equipment>> violations = validator.validate(equipment);

            assertTrue(violations.isEmpty(), "positive minimumStock should be valid");
        }

        @Test
        @DisplayName("rejects large negative minimumStock")
        void rejectsLargeNegativeMinimumStock() {
            Equipment equipment = validEquipment();
            equipment.setMinimumStock(-500);

            Set<ConstraintViolation<Equipment>> violations = validator.validate(equipment);

            assertEquals(1, violations.size());
            ConstraintViolation<Equipment> violation = violations.iterator().next();
            assertEquals("minimumStock", violation.getPropertyPath().toString());
            assertEquals("Minimum stock cannot be negative", violation.getMessage());
        }
    }

    @Nested
    @DisplayName("combined stock validation")
    class CombinedStockValidation {

        @Test
        @DisplayName("accepts valid stock configuration")
        void acceptsValidStockConfiguration() {
            Equipment equipment = validEquipment();
            equipment.setQuantity(50);
            equipment.setMinimumStock(10);

            Set<ConstraintViolation<Equipment>> violations = validator.validate(equipment);

            assertTrue(violations.isEmpty(), "valid stock configuration should pass validation");
        }

        @Test
        @DisplayName("accepts zero stock with zero minimum")
        void acceptsZeroStockWithZeroMinimum() {
            Equipment equipment = validEquipment();
            equipment.setQuantity(0);
            equipment.setMinimumStock(0);

            Set<ConstraintViolation<Equipment>> violations = validator.validate(equipment);

            assertTrue(violations.isEmpty(), "zero stock with zero minimum should be valid");
        }

        @Test
        @DisplayName("reports both quantity and minimumStock violations when both are negative")
        void reportsBothStockViolations() {
            Equipment equipment = validEquipment();
            equipment.setQuantity(-10);
            equipment.setMinimumStock(-5);

            Set<ConstraintViolation<Equipment>> violations = validator.validate(equipment);

            assertEquals(2, violations.size(), "should report both stock field violations");
            assertTrue(violations.stream()
                    .anyMatch(violation -> "quantity".equals(violation.getPropertyPath().toString())));
            assertTrue(violations.stream()
                    .anyMatch(violation -> "minimumStock".equals(violation.getPropertyPath().toString())));
        }

        @Test
        @DisplayName("reports only negative quantity when minimumStock is valid")
        void reportsOnlyNegativeQuantityViolation() {
            Equipment equipment = validEquipment();
            equipment.setQuantity(-10);
            equipment.setMinimumStock(5);

            Set<ConstraintViolation<Equipment>> violations = validator.validate(equipment);

            assertEquals(1, violations.size());
            ConstraintViolation<Equipment> violation = violations.iterator().next();
            assertEquals("quantity", violation.getPropertyPath().toString());
        }

        @Test
        @DisplayName("reports only negative minimumStock when quantity is valid")
        void reportsOnlyNegativeMinimumStockViolation() {
            Equipment equipment = validEquipment();
            equipment.setQuantity(10);
            equipment.setMinimumStock(-5);

            Set<ConstraintViolation<Equipment>> violations = validator.validate(equipment);

            assertEquals(1, violations.size());
            ConstraintViolation<Equipment> violation = violations.iterator().next();
            assertEquals("minimumStock", violation.getPropertyPath().toString());
        }
    }

    @Nested
    @DisplayName("builder defaults")
    class BuilderDefaults {

        @Test
        @DisplayName("builder defaults quantity to 0")
        void builderDefaultsQuantityToZero() {
            Equipment equipment = Equipment.builder()
                    .name("Test Equipment")
                    .department("Test Dept")
                    .build();

            assertEquals(0, equipment.getQuantity(), "builder should default quantity to 0");
            
            Set<ConstraintViolation<Equipment>> violations = validator.validate(equipment);
            assertTrue(violations.stream()
                    .noneMatch(violation -> "quantity".equals(violation.getPropertyPath().toString())),
                    "default quantity of 0 should not violate validation");
        }

        @Test
        @DisplayName("builder defaults minimumStock to 10")
        void builderDefaultsMinimumStockToTen() {
            Equipment equipment = Equipment.builder()
                    .name("Test Equipment")
                    .department("Test Dept")
                    .build();

            assertEquals(10, equipment.getMinimumStock(), "builder should default minimumStock to 10");
            
            Set<ConstraintViolation<Equipment>> violations = validator.validate(equipment);
            assertTrue(violations.stream()
                    .noneMatch(violation -> "minimumStock".equals(violation.getPropertyPath().toString())),
                    "default minimumStock of 10 should not violate validation");
        }
    }
}

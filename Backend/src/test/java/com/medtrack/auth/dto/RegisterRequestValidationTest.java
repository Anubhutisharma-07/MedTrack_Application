package com.medtrack.auth.dto;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Comprehensive validation tests for RegisterRequest DTO.
 * Tests email validation and other registration constraints.
 */
@DisplayName("RegisterRequest Validation")
class RegisterRequestValidationTest {

    private Validator validator;

    @BeforeEach
    void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Nested
    @DisplayName("Email validation")
    class EmailValidation {

        @Test
        @DisplayName("Valid email address is accepted")
        void validEmailAccepted() {
            RegisterRequest request = RegisterRequest.builder()
                    .name("Test User")
                    .organization("St. Mary Clinic")
                    .email("valid.email@example.com")
                    .phone("+15551234567")
                    .password("password123")
                    .confirmPassword("password123")
                    .role("TECHNICIAN")
                    .build();

            Set<ConstraintViolation<RegisterRequest>> violations = validator.validate(request);
            assertTrue(violations.isEmpty(), "Valid email should have no violations");
        }

        @Test
        @DisplayName("Invalid email format is rejected")
        void invalidEmailRejected() {
            RegisterRequest request = RegisterRequest.builder()
                    .name("Test User")
                    .organization("St. Mary Clinic")
                    .email("invalid-email-format")
                    .phone("+15551234567")
                    .password("password123")
                    .confirmPassword("password123")
                    .role("TECHNICIAN")
                    .build();

            Set<ConstraintViolation<RegisterRequest>> violations = validator.validate(request);
            assertFalse(violations.isEmpty(), "Invalid email should have violations");
            
            assertTrue(violations.stream()
                    .anyMatch(v -> v.getPropertyPath().toString().equals("email")), 
                    "Email field should have validation error");
        }

        @Test
        @DisplayName("Email without @ symbol is rejected")
        void emailWithoutAtSymbolRejected() {
            RegisterRequest request = RegisterRequest.builder()
                    .name("Test User")
                    .organization("St. Mary Clinic")
                    .email("userexample.com")
                    .phone("+15551234567")
                    .password("password123")
                    .confirmPassword("password123")
                    .role("TECHNICIAN")
                    .build();

            Set<ConstraintViolation<RegisterRequest>> violations = validator.validate(request);
            assertFalse(violations.isEmpty(), "Email without @ should be rejected");
        }

        @Test
        @DisplayName("Blank email is rejected")
        void blankEmailRejected() {
            RegisterRequest request = RegisterRequest.builder()
                    .name("Test User")
                    .organization("St. Mary Clinic")
                    .email("   ")
                    .phone("+15551234567")
                    .password("password123")
                    .confirmPassword("password123")
                    .role("TECHNICIAN")
                    .build();

            Set<ConstraintViolation<RegisterRequest>> violations = validator.validate(request);
            assertFalse(violations.isEmpty(), "Blank email should be rejected");
        }

        @Test
        @DisplayName("Null email is rejected")
        void nullEmailRejected() {
            RegisterRequest request = RegisterRequest.builder()
                    .name("Test User")
                    .organization("St. Mary Clinic")
                    .email(null)
                    .phone("+15551234567")
                    .password("password123")
                    .confirmPassword("password123")
                    .role("TECHNICIAN")
                    .build();

            Set<ConstraintViolation<RegisterRequest>> violations = validator.validate(request);
            assertFalse(violations.isEmpty(), "Null email should be rejected");
        }

        @Test
        @DisplayName("Valid email with subdomain is accepted")
        void validEmailWithSubdomainAccepted() {
            RegisterRequest request = RegisterRequest.builder()
                    .name("Test User")
                    .organization("St. Mary Clinic")
                    .email("user@mail.example.com")
                    .phone("+15551234567")
                    .password("password123")
                    .confirmPassword("password123")
                    .role("TECHNICIAN")
                    .build();

            Set<ConstraintViolation<RegisterRequest>> violations = validator.validate(request);
            assertTrue(violations.isEmpty(), "Valid email with subdomain should be accepted");
        }
    }

    @Nested
    @DisplayName("Complete registration validation")
    class CompleteRegistrationValidation {

        @Test
        @DisplayName("Valid registration request passes all validations")
        void validRegistrationRequest() {
            RegisterRequest request = RegisterRequest.builder()
                    .name("Test User")
                    .organization("St. Mary Clinic")
                    .email("test@example.com")
                    .phone("+15551234567")
                    .password("password123")
                    .confirmPassword("password123")
                    .role("TECHNICIAN")
                    .build();

            Set<ConstraintViolation<RegisterRequest>> violations = validator.validate(request);
            assertTrue(violations.isEmpty(), "Valid request should have no violations");
        }
    }
}
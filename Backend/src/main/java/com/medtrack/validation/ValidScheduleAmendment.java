package com.medtrack.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Custom constraint annotation to validate schedule amendment request date fields.
 * Ensures that if a deadline is provided (either via deadline or newDeadline), it is
 * not in the past.
 */
@Documented
@Constraint(validatedBy = MaintenanceScheduleAmendmentValidator.class)
@Target({ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidScheduleAmendment {
    String message() default "Amended deadline cannot be in the past";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}

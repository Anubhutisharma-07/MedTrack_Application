package com.medtrack.validation;

import com.medtrack.dto.MaintenanceScheduleAmendmentRequest;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.time.LocalDate;

/**
 * Constraint validator for {@link ValidScheduleAmendment}.
 * Ensures schedule amendment requests validate deadline dates appropriately.
 */
public class MaintenanceScheduleAmendmentValidator
        implements ConstraintValidator<ValidScheduleAmendment, MaintenanceScheduleAmendmentRequest> {

    @Override
    public boolean isValid(
            MaintenanceScheduleAmendmentRequest request,
            ConstraintValidatorContext context) {

        if (request == null) {
            return true;
        }

        LocalDate deadline = request.getDeadline();
        if (deadline == null) {
            return true;
        }

        if (deadline.isBefore(LocalDate.now())) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate("Amended deadline cannot be in the past")
                    .addPropertyNode("deadline")
                    .addConstraintViolation();
            return false;
        }

        return true;
    }
}

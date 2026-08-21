package com.medtrack.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Individual field-level validation error within a single request payload.
 *
 * <p>Returned as part of {@link ValidationErrorResponse} so the client can map
 * each error to the exact form field that failed validation.</p>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Individual field-level validation error")
public class ValidationErrorDetail {

    @Schema(description = "Dot-separated path to the failing field", example = "equipment.name")
    private String field;

    @Schema(description = "Human-readable description of the constraint violation", example = "must not be blank")
    private String message;

    @Schema(description = "The rejected value, if applicable", example = "")
    private Object rejectedValue;

    @Schema(description = "Constraint type that was violated", example = "NotBlank")
    private String constraintType;
}

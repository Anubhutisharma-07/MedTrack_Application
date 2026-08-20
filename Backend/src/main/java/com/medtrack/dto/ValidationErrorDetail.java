package com.medtrack.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Individual field-level validation error within a request payload.
 * Returned as part of ValidationErrorResponse for the client to map errors to form fields.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Individual field-level validation error")
public class ValidationErrorDetail {

    @Schema(description = "Dot-separated path to the failing field", example = "equipment.name")
    private String field;

    @Schema(description = "Human-readable constraint violation description", example = "must not be blank")
    private String message;

    @Schema(description = "The rejected value, if applicable")
    private Object rejectedValue;

    @Schema(description = "Constraint type that was violated", example = "NotBlank")
    private String constraintType;
}

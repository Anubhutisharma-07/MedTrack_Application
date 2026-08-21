package com.medtrack.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Generic API response envelope that wraps every REST endpoint response
 * in a consistent structure so the frontend can handle success and error
 * cases uniformly.
 *
 * <p>Every response carries a boolean {@code success} flag, an optional
 * {@code message} for human consumption, an optional {@code data} payload,
 * and an optional {@code error} block. The client checks {@code success}
 * first; if false, it reads the {@code error} object for details.</p>
 *
 * <p>{@link JsonInclude#NON_NULL} ensures that absent fields (e.g.
 * {@code data} on error, {@code error} on success) are omitted from the
 * JSON rather than serialized as {@code null}, keeping the payload
 * compact.</p>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "Standard API response envelope")
public class ApiEnvelope<T> {

    @Schema(description = "Whether the request completed successfully", example = "true")
    private boolean success;

    @Schema(description = "Human-readable status message", example = "Equipment created successfully")
    private String message;

    @Schema(description = "Response payload (present on success)")
    private T data;

    @Schema(description = "Error details (present on failure)")
    private ErrorDetail error;

    /**
     * Create a successful envelope wrapping the given data.
     */
    public static <T> ApiEnvelope<T> ok(T data) {
        return ApiEnvelope.<T>builder()
                .success(true)
                .data(data)
                .build();
    }

    /**
     * Create a successful envelope with a custom message.
     */
    public static <T> ApiEnvelope<T> ok(String message, T data) {
        return ApiEnvelope.<T>builder()
                .success(true)
                .message(message)
                .data(data)
                .build();
    }

    /**
     * Create a failure envelope with an error code and message.
     */
    public static <T> ApiEnvelope<T> error(String code, String message) {
        return ApiEnvelope.<T>builder()
                .success(false)
                .error(ErrorDetail.builder().code(code).message(message).build())
                .build();
    }

    /**
     * Create a failure envelope for a validation error.
     */
    public static <T> ApiEnvelope<T> validationError(String message, java.util.Map<String, String> fieldErrors) {
        return ApiEnvelope.<T>builder()
                .success(false)
                .error(ErrorDetail.builder()
                        .code("VALIDATION_ERROR")
                        .message(message)
                        .fieldErrors(fieldErrors)
                        .build())
                .build();
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "Error details block")
    public static class ErrorDetail {
        @Schema(description = "Machine-readable error code", example = "RESOURCE_NOT_FOUND")
        private String code;

        @Schema(description = "Human-readable error message", example = "Equipment not found with id: 42")
        private String message;

        @Schema(description = "Field-level validation errors (present for 400 Bad Request)")
        private java.util.Map<String, String> fieldErrors;
    }
}

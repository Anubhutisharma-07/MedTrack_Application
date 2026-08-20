package com.medtrack.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * Generic API response envelope for consistent frontend error handling.
 * Every response carries success flag, optional message, data payload, and error block.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "Standard API response envelope")
public class ApiEnvelope<T> {

    @Schema(description = "Whether the request succeeded", example = "true")
    private boolean success;

    @Schema(description = "Human-readable status message")
    private String message;

    @Schema(description = "Response payload (present on success)")
    private T data;

    @Schema(description = "Error details (present on failure)")
    private ErrorDetail error;

    public static <T> ApiEnvelope<T> ok(T data) {
        return ApiEnvelope.<T>builder().success(true).data(data).build();
    }

    public static <T> ApiEnvelope<T> ok(String message, T data) {
        return ApiEnvelope.<T>builder().success(true).message(message).data(data).build();
    }

    public static <T> ApiEnvelope<T> error(String code, String message) {
        return ApiEnvelope.<T>builder().success(false)
                .error(ErrorDetail.builder().code(code).message(message).build()).build();
    }

    public static <T> ApiEnvelope<T> validationError(String message, Map<String, String> fieldErrors) {
        return ApiEnvelope.<T>builder().success(false)
                .error(ErrorDetail.builder().code("VALIDATION_ERROR").message(message).fieldErrors(fieldErrors).build()).build();
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "Error details block")
    public static class ErrorDetail {
        @Schema(description = "Machine-readable error code", example = "RESOURCE_NOT_FOUND")
        private String code;

        @Schema(description = "Human-readable error message")
        private String message;

        @Schema(description = "Field-level validation errors")
        private Map<String, String> fieldErrors;
    }
}

package com.medtrack.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Generic API response wrapper for consistent response formatting.
 *
 * <p>All endpoints should return responses wrapped in this envelope
 * so the frontend always receives a predictable shape.</p>
 *
 * @param <T> the payload type
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApiEnvelope<T> {

    private boolean success;
    private String message;
    private T data;

    public static <T> ApiEnvelope<T> ok(T data) {
        return ApiEnvelope.<T>builder()
                .success(true)
                .message("OK")
                .data(data)
                .build();
    }

    public static <T> ApiEnvelope<T> ok(String message, T data) {
        return ApiEnvelope.<T>builder()
                .success(true)
                .message(message)
                .data(data)
                .build();
    }

    public static <T> ApiEnvelope<T> error(String message) {
        return ApiEnvelope.<T>builder()
                .success(false)
                .message(message)
                .build();
    }
}

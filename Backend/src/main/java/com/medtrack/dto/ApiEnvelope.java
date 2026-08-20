package com.medtrack.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiEnvelope<T> {
    private boolean success;
    private String message;
    private T data;

    public static <T> ApiEnvelope<T> ok(T data) {
        return ApiEnvelope.<T>builder().success(true).message("OK").data(data).build();
    }

    public static <T> ApiEnvelope<T> ok(String message, T data) {
        return ApiEnvelope.<T>builder().success(true).message(message).data(data).build();
    }

    public static <T> ApiEnvelope<T> error(String message) {
        return ApiEnvelope.<T>builder().success(false).message(message).build();
    }
}

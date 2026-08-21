package com.medtrack.exception;

/**
 * Thrown when a requested entity does not exist or is not accessible
 * by the authenticated user.
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }

    public ResourceNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}
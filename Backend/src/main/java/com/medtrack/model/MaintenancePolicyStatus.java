package com.medtrack.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

import java.util.Arrays;

public enum MaintenancePolicyStatus {

    DRAFT("Draft"),
    ACTIVE("Active"),
    PAUSED("Paused"),
    COMPLETED("Completed"),
    ARCHIVED("Archived");

    private final String displayName;

    MaintenancePolicyStatus(String displayName) {
        this.displayName = displayName;
    }

    @JsonValue
    public String getDisplayName() {
        return displayName;
    }

    @JsonCreator
    public static MaintenancePolicyStatus fromValue(String value) {
        return Arrays.stream(values())
                .filter(status ->
                        status.name().equalsIgnoreCase(value)
                                || status.displayName.equalsIgnoreCase(value))
                .findFirst()
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Unknown maintenance policy status: " + value));
    }
}
package com.medtrack.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

import java.util.Arrays;

public enum MaintenanceRuleAuditAction {

    CREATED("Created"),
    UPDATED("Updated"),
    STATUS_CHANGED("Status Changed"),
    ACTIVATED("Activated"),
    DEACTIVATED("Deactivated"),
    DELETED("Deleted");

    private final String displayName;

    MaintenanceRuleAuditAction(String displayName) {
        this.displayName = displayName;
    }

    @JsonValue
    public String getDisplayName() {
        return displayName;
    }

    @JsonCreator
    public static MaintenanceRuleAuditAction fromValue(String value) {
        return Arrays.stream(values())
                .filter(action ->
                        action.name().equalsIgnoreCase(value)
                                || action.displayName.equalsIgnoreCase(value))
                .findFirst()
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Unknown maintenance rule audit action: " + value));
    }
}
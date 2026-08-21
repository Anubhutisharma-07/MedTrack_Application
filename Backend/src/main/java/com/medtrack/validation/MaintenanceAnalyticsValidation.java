package com.medtrack.validation;

import java.time.LocalDate;
import com.medtrack.validation.MaintenanceAnalyticsValidation;

public final class MaintenanceAnalyticsValidation {

    private MaintenanceAnalyticsValidation() {
    }

    public static void validateDateRange(
            LocalDate startDate,
            LocalDate endDate
    ) {

        if (startDate == null || endDate == null) {
            return;
        }

        if (endDate.isBefore(startDate)) {
            throw new IllegalArgumentException(
                    "End date cannot be before start date"
            );
        }

        if (startDate.plusYears(5).isBefore(endDate)) {
            throw new IllegalArgumentException(
                    "Analytics date range cannot exceed five years"
            );
        }
    }
}
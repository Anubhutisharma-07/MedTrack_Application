package com.medtrack.dto.maintenanceanalytics;

import jakarta.validation.constraints.AssertTrue;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaintenanceAnalyticsFilterRequest {

    private LocalDate startDate;

    private LocalDate endDate;

    private String department;

    private Long equipmentId;

    private String equipmentCategory;

    private String maintenanceType;

    private Long technicianId;

    private String status;

    @AssertTrue(
            message = "End date cannot be before start date"
    )
    public boolean isDateRangeValid() {

        if (startDate == null || endDate == null) {
            return true;
        }

        return !endDate.isBefore(startDate);
    }
}

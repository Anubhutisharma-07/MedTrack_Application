package com.medtrack.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

import static com.medtrack.validation.MaintenanceValidationLimits.NOTES_MAX_LENGTH;
import static com.medtrack.validation.MaintenanceValidationLimits.SHORT_TEXT_MAX_LENGTH;

/**
 * Request body for scheduling a maintenance task from the calendar.
 *
 * <p>The hospital is never taken from the request; it is resolved from the authenticated user, so
 * a caller cannot schedule work against another tenant's equipment by naming its id.</p>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaintenanceScheduleRequest {

    @NotNull(message = "Equipment is required")
    private Long equipmentId;

    @NotBlank(message = "Maintenance type is required")
    @Size(max = SHORT_TEXT_MAX_LENGTH, message = "Maintenance type must not exceed 255 characters")
    private String maintenanceType;

    @Size(max = NOTES_MAX_LENGTH, message = "Description is too long")
    private String description;

    @NotNull(message = "Scheduled date is required")
    private LocalDate scheduledDate;

    @Size(max = SHORT_TEXT_MAX_LENGTH, message = "Technician name must not exceed 255 characters")
    private String assignedTechnician;

    @Size(max = SHORT_TEXT_MAX_LENGTH, message = "Priority must not exceed 255 characters")
    private String priority;

    /** Repeat interval in days. {@code null} schedules a one-off task. */
    @Positive(message = "Recurrence must be a positive number of days")
    private Integer recurrencePeriodDays;

    @Size(max = NOTES_MAX_LENGTH, message = "Notes are too long")
    private String notes;
}

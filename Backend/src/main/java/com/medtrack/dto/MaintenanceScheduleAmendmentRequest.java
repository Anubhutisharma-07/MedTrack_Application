package com.medtrack.dto;

import com.medtrack.validation.ValidScheduleAmendment;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

import static com.medtrack.validation.MaintenanceValidationLimits.AMENDMENT_REASON_MAX_LENGTH;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ValidScheduleAmendment
public class MaintenanceScheduleAmendmentRequest {

    private LocalDate newDeadline;
    private LocalDate deadline;

    @Size(max = 255, message = "Maintenance type must not exceed 255 characters")
    private String maintenanceType;

    @Size(max = 255, message = "Description must not exceed 255 characters")
    private String description;

    @Size(max = 255, message = "Priority must not exceed 255 characters")
    private String priority;

    @Min(value = 0, message = "Recurrence period days must not be negative")
    private Integer recurrencePeriodDays;

    @NotBlank(message = "Amendment reason is required")
    @Size(
            max = AMENDMENT_REASON_MAX_LENGTH,
            message = "Amendment reason must not exceed 1000 characters"
    )
    private String reason;

    public LocalDate getDeadline() {
        return deadline != null ? deadline : newDeadline;
    }
}
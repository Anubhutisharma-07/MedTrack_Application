package com.medtrack.dto;

import com.medtrack.model.MaintenanceStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * One scheduled maintenance task as it appears on the calendar.
 *
 * <p>{@code scheduledDate} is the task's deadline - the date the work is due. {@code overdue} and
 * {@code upcoming} are derived server-side against the same "today" used for the rest of the
 * response, so every row on one calendar is classified against one clock.</p>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaintenanceScheduleResponse {

    private Long id;

    private String taskCode;

    private Long equipmentId;

    private String equipmentName;

    private String maintenanceType;

    private String description;

    private String assignedTechnician;

    private String priority;

    private MaintenanceStatus status;

    private LocalDate scheduledDate;

    /** Next occurrence for a recurring task; {@code null} when the task does not repeat. */
    private LocalDate nextMaintenanceDate;

    /** Repeat interval in days; {@code null} for a one-off task. */
    private Integer recurrencePeriodDays;

    private String notes;

    /** Past its deadline and not yet completed. */
    private boolean overdue;

    /** Due within the calendar's look-ahead window and not yet completed. */
    private boolean upcoming;
}

package com.medtrack.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static com.medtrack.validation.MaintenanceValidationLimits.NOTES_MAX_LENGTH;
import static com.medtrack.validation.MaintenanceValidationLimits.SHORT_TEXT_MAX_LENGTH;

/**
 * Append-only audit record for an approved maintenance-task schedule amendment.
 *
 * <p>Each record represents one successful schedule change and preserves the
 * previous and resulting deadline/revision values for compliance history.</p>
 */
@Entity
@Table(name = "maintenance_task_schedule_amendments")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaintenanceTaskScheduleAmendment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Stable reference to the maintenance task whose schedule was amended.
     */
    @NotNull(message = "Maintenance task ID is required")
    @Column(name = "maintenance_task_id", nullable = false)
    private Long maintenanceTaskId;

    /**
     * Stable hospital ownership key used for authorization and tenant isolation.
     */
    @NotNull(message = "Hospital ID is required")
    @Column(name = "hospital_id", nullable = false)
    private Long hospitalId;

    /**
     * Deadline before the approved amendment.
     */
    @NotNull(message = "Previous deadline is required")
    @Column(name = "previous_deadline", nullable = false)
    private LocalDate previousDeadline;

    /**
     * Deadline after the approved amendment.
     */
    @NotNull(message = "New deadline is required")
    @Column(name = "new_deadline", nullable = false)
    private LocalDate newDeadline;

    /**
     * Schedule revision before the amendment.
     */
    @NotNull(message = "Previous schedule revision is required")
    @PositiveOrZero(message = "Previous schedule revision cannot be negative")
    @Column(name = "previous_schedule_revision", nullable = false)
    private Integer previousScheduleRevision;

    /**
     * Schedule revision after the amendment.
     */
    @NotNull(message = "New schedule revision is required")
    @Positive(message = "New schedule revision must be positive")
    @Column(name = "new_schedule_revision", nullable = false)
    private Integer newScheduleRevision;

    /**
     * Identity of the hospital operator who approved the amendment.
     */
    @NotBlank(message = "Amendment actor is required")
    @Size(max = SHORT_TEXT_MAX_LENGTH, message = "Actor must not exceed 255 characters")
    @Column(name = "actor", length = SHORT_TEXT_MAX_LENGTH, nullable = false)
    private String actor;

    /**
     * Business reason supplied for the schedule amendment.
     */
    @NotBlank(message = "Amendment reason is required")
    @Size(max = NOTES_MAX_LENGTH, message = "Amendment reason must not exceed 16000 characters")
    @Column(name = "reason", columnDefinition = "TEXT", nullable = false)
    private String reason;

    /**
     * Immutable creation timestamp for the audit event.
     */
    @NotNull(message = "Amendment timestamp is required")
    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
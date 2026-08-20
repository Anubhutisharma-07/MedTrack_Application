package com.medtrack.dto;

import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaintenanceWorkOrderCompletionRequest {

    @Size(
            max = 16000,
            message = "Completion notes must not exceed 16000 characters"
    )
    private String completionNotes;

    @PositiveOrZero(
            message = "Hours worked cannot be negative"
    )
    private Double hoursWorked;

    @Size(
            max = 4000,
            message = "Parts used must not exceed 4000 characters"
    )
    private String partsUsed;

    @Size(
            max = 60000,
            message = "Signature must not exceed 60000 characters"
    )
    private String signature;
}
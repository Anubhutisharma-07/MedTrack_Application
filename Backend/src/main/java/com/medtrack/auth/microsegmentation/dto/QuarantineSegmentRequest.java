package com.medtrack.auth.microsegmentation.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request payload for triggering emergency zero-trust network quarantine on a segment.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuarantineSegmentRequest {

    @NotBlank(message = "Source segment to isolate is required")
    private String sourceSegment;

    @NotBlank(message = "Quarantine reason is required")
    private String quarantineReason;

    private String incidentTicketId;
    private String emergencyOperator;
    private boolean terminateActiveTunnels;
}

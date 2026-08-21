package com.medtrack.auth.microsegmentation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response DTO for microsegmentation policy violation log entries.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MicrosegmentationViolationResponse {
    private Long id;
    private String violationId;
    private String sourceSegment;
    private String destinationSegment;
    private String sourceIp;
    private String protocol;
    private String destinationPort;
    private String violationReason;
    private String enforcedAction;
    private LocalDateTime detectedAt;
}

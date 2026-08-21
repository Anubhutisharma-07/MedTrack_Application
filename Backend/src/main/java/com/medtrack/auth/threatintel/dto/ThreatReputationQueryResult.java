package com.medtrack.auth.threatintel.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Result DTO for threat indicator reputation lookups.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ThreatReputationQueryResult {
    private String queryIndicator;
    private boolean matchFound;
    private String indicatorType;
    private String category;
    private Integer confidenceScore;
    private String riskLevel; // "CRITICAL", "HIGH", "MEDIUM", "CLEAN"
    private String mitreTechniqueId; // e.g. T1059, T1190
    private String activeMitigationStatus;
    private LocalDateTime lastSeen;
    private String auditStandard;
}

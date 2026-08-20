package com.medtrack.analytics.service;

import com.medtrack.analytics.model.*;
import com.medtrack.analytics.repository.RiskEvaluationEventRepository;
import com.medtrack.analytics.repository.SoftwareTelemetryLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.LocalTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class RiskEvaluationService {

    private final RiskEvaluationEventRepository riskRepository;
    private final SoftwareTelemetryLogRepository telemetryLogRepository;
    private final BehavioralBaselineService baselineService;

    private static final String MODEL_VERSION = "CBRS-v1.0";

    @Transactional
    public RiskEvaluationEvent evaluateRisk(SoftwareTelemetryLog logEntry) {
        String userRole = logEntry.getUser().getRole(); // Assuming user has a string role
        BehavioralBaseline baseline = baselineService.getEffectiveBaseline(logEntry.getUser().getId(), userRole)
                .orElse(null);

        if (baseline == null) {
            log.warn("No baseline found for user {} or role {}. Cannot calculate risk accurately.", logEntry.getUser().getId(), userRole);
            return generateDefaultRisk(logEntry);
        }

        float timeDeviation = calculateTimeDeviation(logEntry, baseline);
        float velocityDeviation = calculateVelocityDeviation(logEntry, baseline);
        float contextDeviation = calculateContextDeviation(logEntry, baseline);
        float sequenceDeviation = calculateSequenceDeviation(logEntry, baseline);
        float equipmentAccessDeviation = calculateEquipmentDeviation(logEntry, baseline);

        // Simple weighted average for final score (0.0 to 100.0)
        // Adjust weights based on mathematical priority
        float finalScore = (timeDeviation * 0.20f) + 
                           (velocityDeviation * 0.25f) + 
                           (contextDeviation * 0.20f) + 
                           (sequenceDeviation * 0.20f) + 
                           (equipmentAccessDeviation * 0.15f);

        RiskLevel riskLevel = determineRiskLevel(finalScore);
        PolicyEnforcement enforcement = determinePolicyEnforcement(riskLevel);

        RiskEvaluationEvent event = RiskEvaluationEvent.builder()
                .telemetryLog(logEntry)
                .timeDeviationScore(timeDeviation)
                .velocityDeviationScore(velocityDeviation)
                .contextDeviationScore(contextDeviation)
                .sequenceDeviationScore(sequenceDeviation)
                .equipmentAccessScore(equipmentAccessDeviation)
                .finalCbrsScore(finalScore)
                .riskLevel(riskLevel)
                .policyEnforcementTaken(enforcement)
                .modelVersion(MODEL_VERSION)
                .evaluationTimestamp(LocalDateTime.now())
                .build();

        return riskRepository.save(event);
    }

    private float calculateTimeDeviation(SoftwareTelemetryLog logEntry, BehavioralBaseline baseline) {
        if (baseline.getTypicalShiftStart() == null || baseline.getTypicalShiftEnd() == null) return 0f;
        LocalTime actionTime = logEntry.getTimestamp().toLocalTime();
        if (actionTime.isBefore(baseline.getTypicalShiftStart()) || actionTime.isAfter(baseline.getTypicalShiftEnd())) {
            return 80.0f; // High risk if outside shift hours
        }
        return 0.0f;
    }

    private float calculateVelocityDeviation(SoftwareTelemetryLog logEntry, BehavioralBaseline baseline) {
        if (baseline.getAvgActionsPerMinute() == null) return 0f;
        
        // Simple heuristic: if execution time is unnaturally fast for this endpoint (e.g., bot)
        if (logEntry.getExecutionTimeMs() != null && logEntry.getExecutionTimeMs() < 50) {
            return 90.0f; 
        }
        return 10.0f; // Normal execution
    }

    private float calculateContextDeviation(SoftwareTelemetryLog logEntry, BehavioralBaseline baseline) {
        if (baseline.getAllowedIpSubnets() == null || logEntry.getIpAddress() == null) return 0f;
        // Simple string contains for MVP. In reality, use IP subnet matching.
        if (!baseline.getAllowedIpSubnets().contains(logEntry.getIpAddress())) {
            return 100.0f; // Absolute context violation
        }
        return 0.0f;
    }

    private float calculateSequenceDeviation(SoftwareTelemetryLog logEntry, BehavioralBaseline baseline) {
        if (baseline.getCommonActionSequences() == null || logEntry.getPreviousActionType() == null) return 0f;
        String sequence = logEntry.getPreviousActionType() + "->" + logEntry.getActionType();
        if (!baseline.getCommonActionSequences().contains(sequence)) {
            return 60.0f; // Uncommon sequence
        }
        return 0.0f;
    }

    private float calculateEquipmentDeviation(SoftwareTelemetryLog logEntry, BehavioralBaseline baseline) {
        if (logEntry.getEquipment() == null) return 0f; 
        // If equipment is accessed, check if they usually access this much
        if (baseline.getTypicalEquipmentCount() != null && baseline.getTypicalEquipmentCount() == 0) {
            return 75.0f; // They normally don't access equipment
        }
        return 15.0f;
    }

    private RiskLevel determineRiskLevel(float score) {
        if (score < 30.0f) return RiskLevel.LOW;
        if (score < 60.0f) return RiskLevel.MODERATE;
        if (score < 85.0f) return RiskLevel.HIGH;
        return RiskLevel.CRITICAL;
    }

    private PolicyEnforcement determinePolicyEnforcement(RiskLevel level) {
        switch (level) {
            case CRITICAL: return PolicyEnforcement.REVOKE;
            case HIGH: return PolicyEnforcement.RESTRICT;
            case MODERATE: return PolicyEnforcement.STEP_UP_AUTH;
            case LOW:
            default:
                return PolicyEnforcement.ALLOW;
        }
    }

    private RiskEvaluationEvent generateDefaultRisk(SoftwareTelemetryLog logEntry) {
        RiskEvaluationEvent event = RiskEvaluationEvent.builder()
                .telemetryLog(logEntry)
                .timeDeviationScore(0f)
                .velocityDeviationScore(0f)
                .contextDeviationScore(0f)
                .sequenceDeviationScore(0f)
                .equipmentAccessScore(0f)
                .finalCbrsScore(0f)
                .riskLevel(RiskLevel.LOW)
                .policyEnforcementTaken(PolicyEnforcement.ALLOW)
                .modelVersion(MODEL_VERSION)
                .evaluationTimestamp(LocalDateTime.now())
                .build();
        return riskRepository.save(event);
    }
}

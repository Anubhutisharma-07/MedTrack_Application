package com.medtrack.analytics.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "risk_evaluation_events")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RiskEvaluationEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID eventId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "telemetry_log_id")
    private SoftwareTelemetryLog telemetryLog;

    @Column(name = "time_deviation_score")
    private Float timeDeviationScore;

    @Column(name = "velocity_deviation_score")
    private Float velocityDeviationScore;

    @Column(name = "context_deviation_score")
    private Float contextDeviationScore;

    @Column(name = "sequence_deviation_score")
    private Float sequenceDeviationScore;

    @Column(name = "equipment_access_score")
    private Float equipmentAccessScore;

    @Column(name = "final_cbrs_score", nullable = false)
    private Float finalCbrsScore;

    @Enumerated(EnumType.STRING)
    @Column(name = "risk_level", length = 30, nullable = false)
    private RiskLevel riskLevel;

    @Enumerated(EnumType.STRING)
    @Column(name = "policy_enforcement_taken", length = 30, nullable = false)
    private PolicyEnforcement policyEnforcementTaken;

    @Column(name = "model_version", length = 50)
    private String modelVersion;

    @Column(name = "evaluation_timestamp", nullable = false)
    private LocalDateTime evaluationTimestamp;
}

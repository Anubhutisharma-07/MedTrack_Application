package com.medtrack.analytics.model;

import com.medtrack.auth.model.User;
import com.medtrack.model.Equipment;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "security_incidents")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SecurityIncident {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID incidentId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "risk_event_id")
    private RiskEvaluationEvent riskEvent;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "equipment_id")
    private Equipment equipment;

    @Column(name = "incident_type", length = 100, nullable = false)
    private String incidentType;

    @Enumerated(EnumType.STRING)
    @Column(length = 30, nullable = false)
    private IncidentSeverity severity;

    @Column(name = "detected_at", nullable = false)
    private LocalDateTime detectedAt;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @Column(name = "response_action", length = 255)
    private String responseAction;

    @Enumerated(EnumType.STRING)
    @Column(length = 30, nullable = false)
    private IncidentStatus status;
}

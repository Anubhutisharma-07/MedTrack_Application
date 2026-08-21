package com.medtrack.auth.siem.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * SiemCorrelationAlert
 * JPA entity persisting an alert raised by the SIEM correlation engine when a
 * configured rule's threshold is met within its time window. Alerts carry a
 * triage lifecycle (OPEN, ACKNOWLEDGED, RESOLVED) with analyst attribution and
 * timestamps, satisfying the incident-handling record-keeping requirements of
 * NIST SP 800-61 Rev. 2 (Section 3.2) and ISO/IEC 27035:2023.
 */
@Entity
@Table(name = "siem_correlation_alerts", indexes = {
        @Index(name = "idx_siem_alert_status", columnList = "status"),
        @Index(name = "idx_siem_alert_created", columnList = "createdAt")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SiemCorrelationAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String alertId; // e.g., ALERT-9d1e4b2c

    @Column(nullable = false)
    private String ruleId;

    @Column(nullable = false)
    private String ruleName;

    @Column(nullable = false)
    private String severity;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, length = 2000)
    private String description;

    @Column(length = 4000)
    private String matchedEventIdsJson;

    private String affectedHost;

    private String affectedUser;

    @Column(nullable = false)
    private String status; // OPEN, ACKNOWLEDGED, RESOLVED

    @Column(nullable = false)
    private Integer matchedEventCount;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private LocalDateTime acknowledgedAt;

    private LocalDateTime resolvedAt;

    private String acknowledgedBy;

    private String resolvedBy;

    private String resolutionNotes;
}

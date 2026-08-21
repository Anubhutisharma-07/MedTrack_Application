package com.medtrack.auth.microsegmentation.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Entity tracking Zero-Trust microsegmentation policy violations and blocked packet attempts.
 */
@Entity
@Table(name = "microsegmentation_violation_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MicrosegmentationViolationLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String violationId;

    @Column(nullable = false)
    private String sourceSegment;

    @Column(nullable = false)
    private String destinationSegment;

    @Column(nullable = false)
    private String sourceIp;

    @Column(nullable = false)
    private String protocol;

    @Column(nullable = false)
    private String destinationPort;

    @Column(nullable = false)
    private String violationReason;

    @Column(nullable = false)
    private String enforcedAction; // "BLOCK", "QUARANTINE_DENY"

    @Column(nullable = false)
    private LocalDateTime detectedAt;
}

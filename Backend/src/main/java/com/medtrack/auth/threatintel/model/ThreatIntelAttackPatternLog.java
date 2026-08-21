package com.medtrack.auth.threatintel.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Entity storing MITRE ATT&CK Matrix v14 attack pattern correlations.
 */
@Entity
@Table(name = "threat_intel_attack_patterns")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ThreatIntelAttackPatternLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String patternId;

    @Column(nullable = false)
    private String mitreTechniqueId; // e.g. "T1071.001"

    @Column(nullable = false)
    private String techniqueName;

    @Column(nullable = false)
    private String tactic; // e.g. "COMMAND_AND_CONTROL", "EXFILTRATION"

    @Column(length = 2000)
    private String description;

    @Column(nullable = false)
    private String affectedComponent;

    @Column(nullable = false)
    private LocalDateTime detectedAt;
}

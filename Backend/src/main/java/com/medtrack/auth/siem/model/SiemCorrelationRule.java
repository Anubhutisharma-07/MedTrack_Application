package com.medtrack.auth.siem.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * SiemCorrelationRule
 * JPA entity modelling a configurable SIEM correlation/detection rule. A rule
 * declares which event category and source types it inspects, optional message
 * keywords, a sliding time window, and a threshold of matching events required
 * before an alert is raised. Rules map directly to NIST SP 800-61 Rev. 2
 * incident detection (Section 2.3) and ISO/IEC 27035:2023 incident identification
 * activities.
 */
@Entity
@Table(name = "siem_correlation_rules")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SiemCorrelationRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String ruleId; // e.g., RULE-7c2e1f0a

    @Column(nullable = false)
    private String ruleName;

    @Column(nullable = false, length = 1000)
    private String description;

    @Column(nullable = false)
    private String severity; // severity of alerts raised by this rule

    private String eventCategory; // category matched; null means match any category

    private String sourceTypesJson; // comma-separated source types; empty means match any

    private String matchKeywordsJson; // comma-separated message keywords; empty means match any

    @Column(nullable = false)
    private Integer timeWindowMinutes; // sliding correlation window

    @Column(nullable = false)
    private Integer threshold; // minimum matching events to raise an alert

    @Column(nullable = false)
    private Boolean enabled;

    @Column(nullable = false)
    private LocalDateTime createdAt;
}

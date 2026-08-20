package com.medtrack.auth.siem.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * SiemLogEvent
 * JPA entity persisting a normalized security log event ingested by the SIEM
 * log correlation hub. Raw heterogeneous log lines (firewall, IDS, EDR, auth
 * service, database, application) are normalized into a single canonical schema
 * with a severity and event category, per NIST SP 800-92 (Guide to Computer
 * Security Log Management) so that correlation rules can reason over events
 * from every source uniformly.
 */
@Entity
@Table(name = "siem_log_events", indexes = {
        @Index(name = "idx_siem_event_category", columnList = "eventCategory"),
        @Index(name = "idx_siem_event_timestamp", columnList = "eventTimestamp"),
        @Index(name = "idx_siem_event_source_host", columnList = "sourceHost"),
        @Index(name = "idx_siem_event_source_type", columnList = "sourceType")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SiemLogEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String eventId; // e.g., EVT-3f2a9c1d

    @Column(nullable = false)
    private String sourceType; // FIREWALL, IDS, EDR, AUTH_SERVICE, DATABASE, APPLICATION, DNS, VPN

    @Column(nullable = false)
    private String eventCategory; // AUTH_FAILURE, BRUTE_FORCE, MALWARE, EXFILTRATION, PRIVILEGE_ESCALATION, ANOMALY, RECON

    @Column(nullable = false)
    private String severity; // INFO, LOW, MEDIUM, HIGH, CRITICAL

    private String sourceHost;

    private String sourceIp;

    private String destinationHost;

    private String destinationIp;

    private String username;

    @Column(nullable = false)
    private String tenantId;

    @Column(nullable = false)
    private LocalDateTime eventTimestamp;

    @Column(nullable = false, length = 2000)
    private String message;

    @Column(length = 4000)
    private String rawPayload;

    @Column(nullable = false)
    private LocalDateTime ingestedAt;
}

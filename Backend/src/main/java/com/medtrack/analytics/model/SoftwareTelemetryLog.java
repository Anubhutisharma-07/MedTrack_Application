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
@Table(name = "software_telemetry_logs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SoftwareTelemetryLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID logId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "equipment_id")
    private Equipment equipment;

    @Column(name = "action_type", nullable = false)
    private String actionType;

    @Column(name = "previous_action_type")
    private String previousActionType;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "endpoint_accessed")
    private String endpointAccessed;

    @Column(name = "execution_time_ms")
    private Integer executionTimeMs;

    @Column(nullable = false)
    private Boolean success;

    @Column(name = "response_status")
    private Integer responseStatus;

    @Column(name = "session_id", length = 100)
    private String sessionId;

    @Column(name = "device_fingerprint", length = 255)
    private String deviceFingerprint;

    // Stored as JSON string
    @Column(columnDefinition = "text")
    private String metadata;

    // ---------------------------------------------------------------------
    // Geolocation fields (issue #1228)
    //
    // GPS coordinates reported by equipment for geofence validation.
    // ---------------------------------------------------------------------

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;
}

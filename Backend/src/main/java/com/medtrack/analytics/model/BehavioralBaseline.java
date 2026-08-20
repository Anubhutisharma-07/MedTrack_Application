package com.medtrack.analytics.model;

import com.medtrack.auth.model.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

@Entity
@Table(name = "behavioral_baselines")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BehavioralBaseline {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID baselineId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id") // Nullable for role-based fallback
    private User user;

    @Column(name = "user_role", length = 50)
    private String userRole;

    @Column(name = "typical_shift_start")
    private LocalTime typicalShiftStart;

    @Column(name = "typical_shift_end")
    private LocalTime typicalShiftEnd;

    @Column(name = "avg_actions_per_minute")
    private Float avgActionsPerMinute;

    @Column(name = "avg_actions_per_session")
    private Float avgActionsPerSession;

    @Column(name = "typical_equipment_count")
    private Integer typicalEquipmentCount;

    // Stored as JSON string
    @Column(name = "allowed_ip_subnets", columnDefinition = "text")
    private String allowedIpSubnets;

    // Stored as JSON string
    @Column(name = "common_action_sequences", columnDefinition = "text")
    private String commonActionSequences;

    @Column(name = "baseline_version")
    private Integer baselineVersion;

    @Column(name = "last_updated")
    private LocalDateTime lastUpdated;
}

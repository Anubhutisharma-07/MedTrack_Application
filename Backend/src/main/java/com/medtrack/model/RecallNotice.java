package com.medtrack.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "recall_notice")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecallNotice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String manufacturer;

    @Column(name = "model_number", length = 255)
    private String modelNumber;

    @Column(name = "serial_number", length = 255)
    private String serialNumber;

    @Column(name = "serial_number_start", length = 255)
    private String serialNumberStart;

    @Column(name = "serial_number_end", length = 255)
    private String serialNumberEnd;

    @Column(name = "lot_number", length = 255)
    private String lotNumber;

    @Column(name = "recall_reference", nullable = false, length = 255)
    private String recallReference;

    @Column(name = "recall_date", nullable = false)
    private LocalDate recallDate;

    @Column(nullable = false, length = 2000)
    private String reason;

    @Column(nullable = false, length = 30)
    private String severity;

    @Column(name = "manufacturer_instructions", length = 4000)
    private String manufacturerInstructions;

    @Column(name = "resolution_deadline")
    private LocalDate resolutionDeadline;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
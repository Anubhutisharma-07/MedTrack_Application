package com.medtrack.dto;

import com.medtrack.model.MaintenanceTaskScheduleAmendment;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class MaintenanceScheduleAmendmentResponse {

    private Long id;
    private Long maintenanceTaskId;
    private Long hospitalId;

    private LocalDate previousDeadline;
    private LocalDate newDeadline;

    private Integer previousScheduleRevision;
    private Integer newScheduleRevision;

    private String actor;
    private String reason;
    private LocalDateTime createdAt;

    public static MaintenanceScheduleAmendmentResponse from(
            MaintenanceTaskScheduleAmendment amendment) {

        return MaintenanceScheduleAmendmentResponse.builder()
                .id(amendment.getId())
                .maintenanceTaskId(amendment.getMaintenanceTaskId())
                .hospitalId(amendment.getHospitalId())
                .previousDeadline(amendment.getPreviousDeadline())
                .newDeadline(amendment.getNewDeadline())
                .previousScheduleRevision(amendment.getPreviousScheduleRevision())
                .newScheduleRevision(amendment.getNewScheduleRevision())
                .actor(amendment.getActor())
                .reason(amendment.getReason())
                .createdAt(amendment.getCreatedAt())
                .build();
    }
}
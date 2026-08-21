package com.medtrack.repository;

import com.medtrack.model.MaintenanceTaskScheduleAmendment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MaintenanceTaskScheduleAmendmentRepository
        extends JpaRepository<MaintenanceTaskScheduleAmendment, Long> {

    List<MaintenanceTaskScheduleAmendment> findByMaintenanceTaskIdAndHospitalIdOrderByCreatedAtDesc(
            Long maintenanceTaskId,
            Long hospitalId);
}
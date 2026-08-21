package com.medtrack.analytics.repository;

import com.medtrack.analytics.model.SoftwareTelemetryLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface SoftwareTelemetryLogRepository extends JpaRepository<SoftwareTelemetryLog, UUID> {
}

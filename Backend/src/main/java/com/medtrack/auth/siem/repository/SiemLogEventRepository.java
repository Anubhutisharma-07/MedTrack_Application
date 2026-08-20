package com.medtrack.auth.siem.repository;

import com.medtrack.auth.siem.model.SiemLogEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface SiemLogEventRepository extends JpaRepository<SiemLogEvent, Long> {

    Optional<SiemLogEvent> findByEventId(String eventId);

    List<SiemLogEvent> findBySourceType(String sourceType);

    List<SiemLogEvent> findBySeverity(String severity);

    List<SiemLogEvent> findByEventCategory(String eventCategory);

    List<SiemLogEvent> findByTenantId(String tenantId);

    List<SiemLogEvent> findByEventTimestampAfter(LocalDateTime timestamp);

    List<SiemLogEvent> findTop50ByOrderByEventTimestampDesc();

    long countBySeverity(String severity);

    long countByEventCategory(String eventCategory);

    long countBySourceType(String sourceType);

    long deleteByEventTimestampBefore(LocalDateTime cutoff);
}

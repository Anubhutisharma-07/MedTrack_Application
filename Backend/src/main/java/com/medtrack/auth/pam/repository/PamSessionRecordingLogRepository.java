package com.medtrack.auth.pam.repository;

import com.medtrack.auth.pam.model.PamSessionRecordingLog;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PamSessionRecordingLogRepository extends JpaRepository<PamSessionRecordingLog, Long> {

    Optional<PamSessionRecordingLog> findBySessionId(String sessionId);

    List<PamSessionRecordingLog> findByUserId(String userId);

    List<PamSessionRecordingLog> findByActiveTrue();
}

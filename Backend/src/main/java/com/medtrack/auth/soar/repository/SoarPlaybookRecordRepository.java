package com.medtrack.auth.soar.repository;

import com.medtrack.auth.soar.model.SoarPlaybookRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SoarPlaybookRecordRepository extends JpaRepository<SoarPlaybookRecord, Long> {

    Optional<SoarPlaybookRecord> findByPlaybookId(String playbookId);

    List<SoarPlaybookRecord> findByExecutionStatus(String executionStatus);

    List<SoarPlaybookRecord> findBySeverity(String severity);
}

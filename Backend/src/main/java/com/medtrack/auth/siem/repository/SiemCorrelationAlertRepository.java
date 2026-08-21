package com.medtrack.auth.siem.repository;

import com.medtrack.auth.siem.model.SiemCorrelationAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SiemCorrelationAlertRepository extends JpaRepository<SiemCorrelationAlert, Long> {

    Optional<SiemCorrelationAlert> findByAlertId(String alertId);

    List<SiemCorrelationAlert> findByStatus(String status);

    List<SiemCorrelationAlert> findBySeverity(String severity);

    List<SiemCorrelationAlert> findByRuleId(String ruleId);

    List<SiemCorrelationAlert> findByRuleIdAndStatus(String ruleId, String status);

    List<SiemCorrelationAlert> findByStatusOrderByCreatedAtDesc(String status);

    List<SiemCorrelationAlert> findTop100ByOrderByCreatedAtDesc();

    long countByStatus(String status);
}

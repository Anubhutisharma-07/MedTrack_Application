package com.medtrack.auth.siem.repository;

import com.medtrack.auth.siem.model.SiemCorrelationRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SiemCorrelationRuleRepository extends JpaRepository<SiemCorrelationRule, Long> {

    Optional<SiemCorrelationRule> findByRuleId(String ruleId);

    List<SiemCorrelationRule> findByEnabled(Boolean enabled);

    List<SiemCorrelationRule> findBySeverity(String severity);

    List<SiemCorrelationRule> findAllByOrderByCreatedAtDesc();
}

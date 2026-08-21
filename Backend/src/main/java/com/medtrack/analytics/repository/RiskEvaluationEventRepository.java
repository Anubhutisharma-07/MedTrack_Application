package com.medtrack.analytics.repository;

import com.medtrack.analytics.model.RiskEvaluationEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface RiskEvaluationEventRepository extends JpaRepository<RiskEvaluationEvent, UUID> {
}

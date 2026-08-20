package com.medtrack.auth.threatintel.repository;

import com.medtrack.auth.threatintel.model.ThreatIntelAttackPatternLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository interface for ThreatIntelAttackPatternLog entity.
 */
@Repository
public interface ThreatIntelAttackPatternLogRepository extends JpaRepository<ThreatIntelAttackPatternLog, Long> {

    Optional<ThreatIntelAttackPatternLog> findByPatternId(String patternId);

    List<ThreatIntelAttackPatternLog> findByMitreTechniqueId(String mitreTechniqueId);

    List<ThreatIntelAttackPatternLog> findByTactic(String tactic);
}

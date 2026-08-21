package com.medtrack.analytics.repository;

import com.medtrack.analytics.model.BehavioralBaseline;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface BehavioralBaselineRepository extends JpaRepository<BehavioralBaseline, UUID> {
    Optional<BehavioralBaseline> findByUserId(Long userId);
    Optional<BehavioralBaseline> findByUserRole(String userRole);
}

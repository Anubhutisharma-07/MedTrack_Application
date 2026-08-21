package com.medtrack.analytics.service;

import com.medtrack.analytics.model.BehavioralBaseline;
import com.medtrack.analytics.repository.BehavioralBaselineRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class BehavioralBaselineService {

    private final BehavioralBaselineRepository baselineRepository;

    /**
     * Retrieves the effective behavioral baseline for a given user.
     * It first tries to find a user-specific baseline. 
     * If not found, it falls back to the role-based baseline.
     */
    @Transactional(readOnly = true)
    public Optional<BehavioralBaseline> getEffectiveBaseline(Long userId, String userRole) {
        log.debug("Fetching effective baseline for user {} with role {}", userId, userRole);
        
        Optional<BehavioralBaseline> userBaseline = baselineRepository.findByUserId(userId);
        
        if (userBaseline.isPresent()) {
            return userBaseline;
        }
        
        log.debug("User baseline not found for user {}, falling back to role baseline for {}", userId, userRole);
        return baselineRepository.findByUserRole(userRole);
    }

    /**
     * Retrieves a user-specific baseline.
     */
    @Transactional(readOnly = true)
    public Optional<BehavioralBaseline> getUserBaseline(Long userId) {
        return baselineRepository.findByUserId(userId);
    }

    /**
     * Retrieves a role-specific baseline.
     */
    @Transactional(readOnly = true)
    public Optional<BehavioralBaseline> getRoleBaseline(String userRole) {
        return baselineRepository.findByUserRole(userRole);
    }

    /**
     * Saves or updates a baseline.
     */
    @Transactional
    public BehavioralBaseline saveBaseline(BehavioralBaseline baseline) {
        log.debug("Saving behavioral baseline: {}", baseline.getBaselineId());
        return baselineRepository.save(baseline);
    }
}

package com.medtrack.auth.security;

import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.exception.ResourceNotFoundException;
import com.medtrack.model.Hospital;
import com.medtrack.repository.HospitalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Shared utility for resolving the hospital profile from an authenticated user's email.
 * Replaces the duplicated getHospitalForUser pattern across EquipmentService,
 * EquipmentLifecycleService, and EquipmentTimelineService.
 */
@Component
@RequiredArgsConstructor
public class HospitalAccessGuard {

    private final UserRepository userRepository;
    private final HospitalRepository hospitalRepository;

    public Hospital resolveHospitalFromEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        return hospitalRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Hospital profile not found for user"));
    }

    public Long resolveHospitalIdFromEmail(String email) {
        return resolveHospitalFromEmail(email).getId();
    }

    public User resolveUserFromEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }
}

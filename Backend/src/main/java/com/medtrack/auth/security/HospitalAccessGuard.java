package com.medtrack.auth.security;

import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.exception.ResourceNotFoundException;
import com.medtrack.model.Hospital;
import com.medtrack.repository.HospitalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Shared utility for resolving the hospital profile from an authenticated user's identity.
 *
 * <p>Three service classes (EquipmentService, EquipmentLifecycleService,
 * EquipmentTimelineService) each contained an identical private
 * getHospitalForUser(String username) method. Beyond being a DRY violation, those
 * methods used UserRepository.findByUsername() but the JWT subject is the user's
 * email (set by JwtUtil.generateToken), so the lookup silently failed for
 * every real user.</p>
 *
 * <p>This component centralises the email-to-user-to-hospital resolution in one place so that
 * (a) the fix is applied once and cannot drift, and (b) new services get the correct lookup
 * for free.</p>
 */
@Component
@RequiredArgsConstructor
public class HospitalAccessGuard {

    private final UserRepository userRepository;
    private final HospitalRepository hospitalRepository;

    /**
     * Resolves the hospital profile for the given email address.
     *
     * @param email the authenticated user's email (from JWT subject)
     * @return the hospital profile linked to this user
     * @throws ResourceNotFoundException if the user or hospital profile is not found
     */
    public Hospital resolveHospitalFromEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        return hospitalRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Hospital profile not found for user"));
    }

    /**
     * Resolves the hospital ID for the given email address.
     *
     * @param email the authenticated user's email
     * @return the hospital database ID
     * @throws ResourceNotFoundException if the user or hospital profile is not found
     */
    public Long resolveHospitalIdFromEmail(String email) {
        return resolveHospitalFromEmail(email).getId();
    }

    /**
     * Resolves the user entity for the given email address.
     *
     * @param email the authenticated user's email
     * @return the user entity
     * @throws ResourceNotFoundException if the user is not found
     */
    public User resolveUserFromEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }
}

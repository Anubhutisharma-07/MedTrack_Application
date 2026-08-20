package com.medtrack.auth.security;

import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.exception.ResourceNotFoundException;
import com.medtrack.model.Hospital;
import com.medtrack.repository.HospitalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

/**
 * Shared component that resolves the currently-authenticated user's hospital
 * from the JWT principal.
 *
 * <p>Many controllers and services repeat the same 3-step lookup (email -> user -> hospital);
 * this guard centralises it so ownership checks cannot drift.</p>
 */
@Component
@RequiredArgsConstructor
public class HospitalAccessGuard {

    private final UserRepository userRepository;
    private final HospitalRepository hospitalRepository;

    /**
     * Resolves the hospital belonging to the authenticated user.
     *
     * @param authentication the Spring Security authentication object
     * @return the hospital profile
     * @throws ResourceNotFoundException if the user or hospital cannot be found
     */
    public Hospital resolveHospital(Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        return hospitalRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Hospital profile not found for user"));
    }

    /**
     * Resolves the user entity for the authenticated principal.
     *
     * @param authentication the Spring Security authentication object
     * @return the user
     * @throws ResourceNotFoundException if the user cannot be found
     */
    public User resolveUser(Authentication authentication) {
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }
}

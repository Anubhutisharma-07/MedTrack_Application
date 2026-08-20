package com.medtrack.service;

import com.medtrack.exception.InvalidStatusTransitionException;
import com.medtrack.exception.ResourceNotFoundException;
import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.model.Hospital;
import com.medtrack.repository.HospitalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class HospitalService {

    private final HospitalRepository hospitalRepository;
    private final UserRepository userRepository;

    /**
     * Create a new hospital profile and link it to the authenticated user.
     * 
     * @param hospital  the hospital details
     * @param userEmail the email of the authenticated user
     * @return the saved hospital
     */
    @Transactional
    public Hospital createHospitalProfile(Hospital hospital, String userEmail) {

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + userEmail));

        // Ensure user is actually a hospital role
        if (!"hospital".equalsIgnoreCase(user.getRole())) {
            throw new InvalidStatusTransitionException("Only users with role 'HOSPITAL' can create a hospital profile.");
        }

        // Check if hospital profile already exists for this user
        if (hospitalRepository.findByUserId(user.getId()).isPresent()) {
            throw new InvalidStatusTransitionException("A hospital profile already exists for this user.");
        }

        hospital.setUser(user);
        return hospitalRepository.save(hospital);
    }

    /**
     * Get a hospital profile by the associated user's ID.
     * 
     * @param userId the user ID
     * @return the Hospital
     */
    public Hospital getHospitalByUserId(Long userId) {
        return hospitalRepository.findByUserId(userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Hospital profile not found for user ID: " + userId));
    }
}
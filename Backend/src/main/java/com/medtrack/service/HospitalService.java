package com.medtrack.service;

import com.medtrack.model.Hospital;
import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.repository.HospitalRepository;
import com.medtrack.exception.InvalidStatusTransitionException;
import com.medtrack.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class HospitalService {
    private static final Logger logger = LoggerFactory.getLogger(HospitalService.class);
    private final HospitalRepository hospitalRepository;
    private final UserRepository userRepository;

    @Transactional
    public Hospital createHospitalProfile(Hospital hospital, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + userEmail));
        if (!"hospital".equalsIgnoreCase(user.getRole())) {
            throw new InvalidStatusTransitionException("Only users with role 'hospital' can create a hospital profile.");
        }
        if (hospitalRepository.findByUserId(user.getId()).isPresent()) {
            throw new IllegalArgumentException("A hospital profile already exists for this user.");
        }
        hospital.setUser(user);
        Hospital saved = hospitalRepository.save(hospital);
        logger.info("Hospital profile created | User: {} | Hospital ID: {}", userEmail, saved.getId());
        return saved;
    }

    public Hospital getHospitalByUserId(Long userId) {
        return hospitalRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Hospital profile not found for user ID: " + userId));
    }
}

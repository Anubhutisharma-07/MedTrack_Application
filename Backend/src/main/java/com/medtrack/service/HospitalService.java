package com.medtrack.service;

import com.medtrack.model.Hospital;
import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.repository.HospitalRepository;
import com.medtrack.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
@RequiredArgsConstructor
public class HospitalService {

    private static final Logger log = LoggerFactory.getLogger(HospitalService.class);

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
    @CacheEvict(value = "hospitalByUserId", allEntries = true)
    public Hospital createHospitalProfile(Hospital hospital, String userEmail) {

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + userEmail));

        // Ensure user is actually a hospital role
        if (!"hospital".equalsIgnoreCase(user.getRole())) {
            throw new RuntimeException("Only users with role 'hospital' can create a hospital profile.");
        }

        // Check if hospital profile already exists for this user
        if (hospitalRepository.findByUserId(user.getId()).isPresent()) {
            throw new RuntimeException("A hospital profile already exists for this user.");
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
    @Cacheable(value = "hospitalByUserId", key = "#userId")
    public Hospital getHospitalByUserId(Long userId) {
        return hospitalRepository.findByUserId(userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Hospital profile not found for user ID: " + userId));
    }

    /**
     * Soft deletes (archives) a hospital profile by setting the deleted flag.
     *
     * @param id the hospital id to archive
     * @param requestedBy the username of the user requesting the archive
     * @return the archived hospital
     */
    @Transactional
    @Caching(evict = { 
        @CacheEvict(value = "hospitalByUserId", allEntries = true)
    })
    public Hospital archiveHospital(Long id, String requestedBy) {
        Hospital hospital = hospitalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Hospital not found"));

        hospital.setDeleted(true);
        hospital.setDeletedAt(LocalDateTime.now());
        hospital.setDeletedBy(requestedBy);

        Hospital archived = hospitalRepository.save(hospital);

        log.info("Hospital archived | Requested By: {} | Hospital ID: {} | Name: {}",
                requestedBy, archived.getId(), archived.getName());

        return archived;
    }

    /**
     * Retrieves all archived (soft-deleted) hospitals.
     */
    public List<Hospital> getArchivedHospitals() {
        return hospitalRepository.findAllDeleted();
    }
}
package com.medtrack.controller;

import com.medtrack.model.Hospital;
import com.medtrack.service.HospitalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

/**
 * REST controller for managing hospital profiles.
 * Provides endpoints for creating and managing
 * hospital-related information.
 */
@RestController
@RequestMapping("/api/hospital")
@RequiredArgsConstructor
public class HospitalController {

    private final HospitalService hospitalService;

    /**
     * Creates a hospital profile for the authenticated hospital user.
     * Accessible only to users with the HOSPITAL role.
     *
     * @param hospital the hospital profile details to be created
     * @return the newly created hospital profile with HTTP 201 Created,
     *         or HTTP 400 Bad Request if profile creation fails
     */
    @PostMapping("/create")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<Hospital> createHospitalProfile(@Valid @RequestBody Hospital hospital) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = authentication.getName();

        try {
            Hospital createdHospital = hospitalService.createHospitalProfile(hospital, userEmail);
            return new ResponseEntity<>(createdHospital, HttpStatus.CREATED);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Archives a hospital profile (soft delete).
     *
     * @param id the ID of the hospital to archive
     * @param principal the authenticated user making the request
     * @return the archived hospital
     */
    @PostMapping("/{id}/archive")
    @PreAuthorize("hasRole('ADMIN') or hasRole('HOSPITAL')")
    public ResponseEntity<Hospital> archiveHospital(@PathVariable Long id, Principal principal) {
        Hospital archived = hospitalService.archiveHospital(id, principal.getName());
        return ResponseEntity.ok(archived);
    }

    /**
     * Retrieves all archived hospital profiles.
     * Accessible only to ADMIN users.
     *
     * @return list of archived hospitals
     */
    @GetMapping("/archived")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Hospital>> getArchivedHospitals() {
        return ResponseEntity.ok(hospitalService.getArchivedHospitals());
    }
}
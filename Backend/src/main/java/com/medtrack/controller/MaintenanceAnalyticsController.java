package com.medtrack.controller;

import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.dto.MaintenanceAnalyticsResponse;
import com.medtrack.exception.ResourceNotFoundException;
import com.medtrack.model.Hospital;
import com.medtrack.repository.HospitalRepository;
import com.medtrack.service.MaintenanceAnalyticsService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Locale;

/**
 * REST controller for the maintenance analytics subsystem.
 *
 * <p>Exposes endpoints for hospital users to retrieve high-level maintenance analytics,
 * including activity breakdowns, overdue rates, SLA compliance, and technician performance metrics.</p>
 */
@RestController
@RequestMapping("/api/maintenance/analytics")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class MaintenanceAnalyticsController {

    private static final Logger log = LoggerFactory.getLogger(MaintenanceAnalyticsController.class);
    private static final long MAX_DATE_RANGE_DAYS = 1825L;

    private final MaintenanceAnalyticsService analyticsService;
    private final UserRepository userRepository;
    private final HospitalRepository hospitalRepository;

    /**
     * Complete maintenance analytics dashboard.
     *
     * <p>Accepts optional date filtering parameters (startDate and endDate in ISO DATE format).</p>
     *
     * @param startDate optional start date for filtering analytics metrics
     * @param endDate optional end date for filtering analytics metrics
     * @param principal authenticated user principal
     * @return response containing comprehensive maintenance analytics metrics
     */
    @GetMapping
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<MaintenanceAnalyticsResponse> getAnalytics(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate startDate,

            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate endDate,

            Principal principal
    ) {
        validateDateRange(startDate, endDate);
        Long hospitalId = resolveHospitalId(principal);

        log.debug("Fetching maintenance analytics for hospitalId={} between {} and {}", hospitalId, startDate, endDate);

        return ResponseEntity.ok(
                analyticsService.getAnalytics(
                        hospitalId,
                        startDate,
                        endDate
                )
        );
    }

    /**
     * Current-month analytics shortcut.
     *
     * @param principal authenticated user principal
     * @return response containing maintenance analytics metrics for the current month
     */
    @GetMapping("/current-month")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<MaintenanceAnalyticsResponse> getCurrentMonthAnalytics(
            Principal principal
    ) {
        Long hospitalId = resolveHospitalId(principal);

        log.debug("Fetching current-month maintenance analytics for hospitalId={}", hospitalId);

        return ResponseEntity.ok(
                analyticsService.getCurrentMonthAnalytics(
                        hospitalId
                )
        );
    }

    /**
     * Validates date range boundary criteria for analytics queries.
     *
     * @param startDate optional start date
     * @param endDate optional end date
     * @throws IllegalArgumentException if dates are out of chronological order or exceed max horizon
     */
    private void validateDateRange(LocalDate startDate, LocalDate endDate) {
        if (startDate != null && endDate != null) {
            if (startDate.isAfter(endDate)) {
                throw new IllegalArgumentException("Start date cannot be after end date");
            }
            long rangeDays = ChronoUnit.DAYS.between(startDate, endDate);
            if (rangeDays > MAX_DATE_RANGE_DAYS) {
                throw new IllegalArgumentException("Date range cannot exceed " + MAX_DATE_RANGE_DAYS + " days");
            }
        }
    }

    /**
     * Resolves the hospital ID for the authenticated principal.
     *
     * <p>Finds the associated User entity by username or email, then queries the Hospital profile
     * assigned to that user.</p>
     *
     * @param principal authenticated user principal
     * @return resolved hospital ID
     * @throws IllegalArgumentException if principal or username is missing
     * @throws ResourceNotFoundException if user or hospital profile is not found
     */
    private Long resolveHospitalId(Principal principal) {
        validatePrincipal(principal);

        String identifier = principal.getName().trim();

        User user = userRepository.findByUsername(identifier)
                .or(() -> userRepository.findByEmail(identifier.toLowerCase(Locale.ROOT)))
                .orElseThrow(() -> new ResourceNotFoundException("User not found with username: " + identifier));

        Hospital hospital = hospitalRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Hospital profile not found for user: " + identifier));

        return hospital.getId();
    }

    /**
     * Validates that the provided principal contains a valid, non-blank username.
     *
     * @param principal security principal to validate
     * @throws IllegalArgumentException if principal is null or has a blank name
     */
    private void validatePrincipal(Principal principal) {
        if (principal == null || principal.getName() == null || principal.getName().isBlank()) {
            throw new IllegalArgumentException("Authenticated principal username is required");
        }
    }
}
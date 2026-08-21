package com.medtrack.analytics.service;

import com.medtrack.analytics.model.IncidentSeverity;
import com.medtrack.analytics.model.IncidentStatus;
import com.medtrack.analytics.model.RiskEvaluationEvent;
import com.medtrack.analytics.model.SecurityIncident;
import com.medtrack.analytics.repository.SecurityIncidentRepository;
import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.model.Equipment;
import com.medtrack.model.FacilityLocation;
import com.medtrack.repository.EquipmentRepository;
import com.medtrack.repository.FacilityLocationRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Geofence validation service for equipment telemetry (issue #1228).
 *
 * <p>Validates incoming equipment GPS coordinates against the assigned facility location's
 * geofence boundary. Creates SECURITY_ALERT incidents when equipment leaves the permitted
 * boundary, with duplicate prevention for ongoing violations.</p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class GeofenceValidationService {

    private final EquipmentRepository equipmentRepository;
    private final FacilityLocationRepository facilityLocationRepository;
    private final SecurityIncidentRepository securityIncidentRepository;
    private final UserRepository userRepository;
    private final EntityManager entityManager;

    /**
     * Validates equipment telemetry coordinates against the assigned facility boundary.
     *
     * @param equipmentId the equipment identifier
     * @param latitude the reported latitude
     * @param longitude the reported longitude
     */
    @Transactional
    public void validateEquipmentLocation(Long equipmentId, Double latitude, Double longitude) {
        if (equipmentId == null) {
            log.debug("Skipping geofence validation: no equipment ID provided");
            return;
        }

        if (latitude == null || longitude == null) {
            log.debug("Skipping geofence validation for equipment {}: missing coordinates", equipmentId);
            return;
        }

        if (!isValidCoordinate(latitude, longitude)) {
            log.warn("Skipping geofence validation for equipment {}: invalid coordinates ({}, {})",
                    equipmentId, latitude, longitude);
            return;
        }

        Equipment equipment = equipmentRepository.findById(equipmentId).orElse(null);
        if (equipment == null) {
            log.debug("Skipping geofence validation: equipment {} not found", equipmentId);
            return;
        }

        FacilityLocation location = equipment.getLocation();
        if (location == null) {
            log.debug("Skipping geofence validation for equipment {}: no facility location assigned",
                    equipmentId);
            return;
        }

        if (location.getLatitude() == null || location.getLongitude() == null
                || location.getGeofenceRadiusMeters() == null) {
            log.debug("Skipping geofence validation for equipment {}: location {} has no geofence configured",
                    equipmentId, location.getId());
            return;
        }

        boolean withinBoundary = isWithinGeofence(
                latitude, longitude,
                location.getLatitude(), location.getLongitude(),
                location.getGeofenceRadiusMeters()
        );

        if (!withinBoundary) {
            handleBoundaryViolation(equipment, location, latitude, longitude);
        } else {
            log.debug("Equipment {} within geofence boundary of location {}",
                    equipmentId, location.getId());
        }
    }

    /**
     * Checks if a point is within a circular geofence.
     *
     * @param pointLat the point latitude
     * @param pointLon the point longitude
     * @param centerLat the center latitude
     * @param centerLon the center longitude
     * @param radiusMeters the radius in meters
     * @return true if the point is within the boundary
     */
    private boolean isWithinGeofence(double pointLat, double pointLon,
                                       double centerLat, double centerLon,
                                       int radiusMeters) {
        double distance = haversineDistance(pointLat, pointLon, centerLat, centerLon);
        return distance <= radiusMeters;
    }

    /**
     * Calculates the Haversine distance between two points on Earth.
     *
     * @param lat1 first point latitude
     * @param lon1 first point longitude
     * @param lat2 second point latitude
     * @param lon2 second point longitude
     * @return distance in meters
     */
    private double haversineDistance(double lat1, double lon1, double lat2, double lon2) {
        final double EARTH_RADIUS = 6371000; // meters

        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return EARTH_RADIUS * c;
    }

    /**
     * Validates that coordinates are within valid ranges.
     *
     * @param latitude the latitude to validate
     * @param longitude the longitude to validate
     * @return true if coordinates are valid
     */
    private boolean isValidCoordinate(double latitude, double longitude) {
        return latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
    }

    /**
     * Handles a geofence boundary violation by creating a security alert.
     * Prevents duplicate alerts for the same ongoing violation.
     *
     * @param equipment the equipment that violated the boundary
     * @param location the facility location whose boundary was violated
     * @param latitude the reported latitude
     * @param longitude the reported longitude
     */
    private void handleBoundaryViolation(Equipment equipment, FacilityLocation location,
                                          double latitude, double longitude) {
        // Check for existing open alert for this equipment and location
        List<SecurityIncident> existingAlerts = securityIncidentRepository
                .findByEquipmentIdAndIncidentTypeAndStatus(
                        equipment.getId(),
                        "SECURITY_ALERT",
                        IncidentStatus.OPEN
                );

        // Check if there's an existing alert for this specific location violation
        boolean alreadyAlerted = existingAlerts.stream()
                .anyMatch(incident -> {
                    String metadata = incident.getResponseAction();
                    return metadata != null && metadata.contains("locationId:" + location.getId());
                });

        if (alreadyAlerted) {
            log.debug("Equipment {} already has an open alert for location {} boundary violation",
                    equipment.getId(), location.getId());
            return;
        }

        // Create a new security alert
        createSecurityAlert(equipment, location, latitude, longitude);
    }

    /**
     * Creates a SECURITY_ALERT incident for geofence violation.
     *
     * @param equipment the equipment that violated the boundary
     * @param location the facility location
     * @param latitude the reported latitude
     * @param longitude the reported longitude
     */
    private void createSecurityAlert(Equipment equipment, FacilityLocation location,
                                     double latitude, double longitude) {
        // Get a system user for the incident
        User systemUser = userRepository.findByUsername("system")
                .orElseGet(() -> userRepository.save(User.builder()
                        .name("System")
                        .username("system")
                        .email("system@medtrack.internal")
                        .password("system-password-at-least-six-chars")
                        .role("ADMIN")
                        .phone("+1 (555) 000-0000")
                        .organization("MedTrack System")
                        .accountStatus(com.medtrack.auth.model.AccountStatus.ACTIVE)
                        .build()));

        String metadata = String.format(
                "Geofence violation - equipmentId:%d, locationId:%d, coordinates:%.8f,%.8f, timestamp:%s",
                equipment.getId(),
                location.getId(),
                latitude,
                longitude,
                LocalDateTime.now()
        );

        // Create security incident without risk event for geofence violations
        // Geofence alerts are standalone and don't require telemetry-based risk evaluation
        SecurityIncident incident = SecurityIncident.builder()
                .riskEvent(null)
                .user(systemUser)
                .equipment(equipment)
                .incidentType("SECURITY_ALERT")
                .severity(IncidentSeverity.HIGH)
                .detectedAt(LocalDateTime.now())
                .status(IncidentStatus.OPEN)
                .responseAction(metadata)
                .build();

        securityIncidentRepository.save(incident);

        log.warn("Created SECURITY_ALERT for equipment {} at location {} - coordinates: {}, {}",
                equipment.getId(), location.getId(), latitude, longitude);
    }
}

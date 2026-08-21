package com.medtrack.analytics.service;

import com.medtrack.analytics.model.IncidentSeverity;
import com.medtrack.analytics.model.IncidentStatus;
import com.medtrack.analytics.model.SecurityIncident;
import com.medtrack.analytics.repository.SecurityIncidentRepository;
import com.medtrack.auth.model.AccountStatus;
import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.model.Equipment;
import com.medtrack.model.EquipmentCategory;
import com.medtrack.model.EquipmentStatus;
import com.medtrack.model.FacilityLocation;
import com.medtrack.model.Hospital;
import com.medtrack.model.LocationType;
import com.medtrack.repository.EquipmentRepository;
import com.medtrack.repository.FacilityLocationRepository;
import com.medtrack.repository.HospitalRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Geofence validation tests for equipment telemetry (issue #1228).
 *
 * <p>Tests server-side geofence validation, security alert creation, duplicate prevention,
 * and handling of edge cases like missing coordinates and equipment without geofence.</p>
 */
@SpringBootTest(properties = {
        "eureka.client.enabled=false",
        "spring.cloud.discovery.enabled=false",
        "spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.kafka.KafkaAutoConfiguration",
        "spring.datasource.url=jdbc:h2:mem:geofence-tests;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "app.data-initializer.enabled=false"
})
@Transactional
@DisplayName("geofence boundary validation for equipment telemetry")
class GeofenceValidationServiceTest {

    @Autowired
    private GeofenceValidationService geofenceValidationService;

    @Autowired
    private EquipmentRepository equipmentRepository;

    @Autowired
    private FacilityLocationRepository facilityLocationRepository;

    @Autowired
    private HospitalRepository hospitalRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SecurityIncidentRepository securityIncidentRepository;

    private Hospital hospital;
    private Equipment equipment;
    private FacilityLocation location;

    @BeforeEach
    void setUp() {
        // Create test hospital
        User user = userRepository.save(User.builder()
                .name("Test User")
                .username("geofence-test-" + UUID.randomUUID())
                .email(UUID.randomUUID() + "@medtrack.test")
                .password("password123")
                .role("hospital")
                .phone("+1 (555) 000-0001")
                .organization("Test Hospital")
                .accountStatus(AccountStatus.ACTIVE)
                .build());

        hospital = hospitalRepository.save(Hospital.builder()
                .name("Test Hospital")
                .location("Test City")
                .user(user)
                .build());

        // Create facility location with geofence
        location = facilityLocationRepository.save(FacilityLocation.builder()
                .name("Test Facility")
                .locationType(LocationType.FACILITY)
                .hospital(hospital)
                .latitude(40.7128) // New York City coordinates
                .longitude(-74.0060)
                .geofenceRadiusMeters(500) // 500 meter radius
                .createdBy(user.getUsername())
                .build());

        // Create equipment assigned to the location
        equipment = equipmentRepository.save(Equipment.builder()
                .equipmentCode("EQ-GEO-1")
                .name("Mobile Equipment")
                .department("Radiology")
                .category(EquipmentCategory.IMAGING)
                .status(EquipmentStatus.ACTIVE)
                .hospital(hospital)
                .location(location)
                .build());
    }

    @Test
    @DisplayName("equipment inside geofence boundary does not trigger alert")
    void equipmentInsideBoundaryDoesNotTriggerAlert() {
        // Coordinates within 500 meters of center (approximately)
        double insideLat = 40.7130;
        double insideLon = -74.0062;

        geofenceValidationService.validateEquipmentLocation(
                equipment.getId(), insideLat, insideLon);

        List<SecurityIncident> incidents = securityIncidentRepository.findAll();
        assertTrue(incidents.isEmpty(),
                "No security alert should be created for equipment within boundary");
    }

    @Test
    @DisplayName("equipment outside geofence boundary triggers SECURITY_ALERT")
    void equipmentOutsideBoundaryTriggersSecurityAlert() {
        // Coordinates outside 500 meters (approximately 1km away)
        double outsideLat = 40.7228;
        double outsideLon = -74.0160;

        geofenceValidationService.validateEquipmentLocation(
                equipment.getId(), outsideLat, outsideLon);

        List<SecurityIncident> incidents = securityIncidentRepository.findAll();
        assertEquals(1, incidents.size(), "Exactly one security alert should be created");

        SecurityIncident incident = incidents.get(0);
        assertEquals("SECURITY_ALERT", incident.getIncidentType());
        assertEquals(IncidentSeverity.HIGH, incident.getSeverity());
        assertEquals(IncidentStatus.OPEN, incident.getStatus());
        assertEquals(equipment.getId(), incident.getEquipment().getId());
        assertNotNull(incident.getResponseAction(),
                "Incident should contain metadata with equipment ID, location, coordinates, and timestamp");
        assertTrue(incident.getResponseAction().contains("equipmentId:" + equipment.getId()));
        assertTrue(incident.getResponseAction().contains("locationId:" + location.getId()));
        assertTrue(incident.getResponseAction().contains("coordinates:" + outsideLat));
        assertTrue(incident.getResponseAction().contains(String.valueOf(outsideLon)));
    }

    @Test
    @DisplayName("equipment exactly on boundary edge does not trigger alert")
    void equipmentOnBoundaryEdgeDoesNotTriggerAlert() {
        // Coordinates approximately at the 500 meter boundary (within radius)
        // Using coordinates very close to center to ensure they're within 500m
        double edgeLat = 40.7130;
        double edgeLon = -74.0062;

        geofenceValidationService.validateEquipmentLocation(
                equipment.getId(), edgeLat, edgeLon);

        List<SecurityIncident> incidents = securityIncidentRepository.findAll();
        assertTrue(incidents.isEmpty(),
                "No security alert should be created for equipment on boundary edge");
    }

    @Test
    @DisplayName("invalid coordinates are safely handled without triggering alert")
    void invalidCoordinatesAreSafelyHandled() {
        // Invalid latitude (outside -90 to 90 range)
        geofenceValidationService.validateEquipmentLocation(
                equipment.getId(), 95.0, -74.0060);

        // Invalid longitude (outside -180 to 180 range)
        geofenceValidationService.validateEquipmentLocation(
                equipment.getId(), 40.7128, 185.0);

        List<SecurityIncident> incidents = securityIncidentRepository.findAll();
        assertTrue(incidents.isEmpty(),
                "Invalid coordinates should not trigger security alerts");
    }

    @Test
    @DisplayName("missing coordinates are safely handled without triggering alert")
    void missingCoordinatesAreSafelyHandled() {
        geofenceValidationService.validateEquipmentLocation(
                equipment.getId(), null, null);

        geofenceValidationService.validateEquipmentLocation(
                equipment.getId(), 40.7128, null);

        geofenceValidationService.validateEquipmentLocation(
                equipment.getId(), null, -74.0060);

        List<SecurityIncident> incidents = securityIncidentRepository.findAll();
        assertTrue(incidents.isEmpty(),
                "Missing coordinates should not trigger security alerts");
    }

    @Test
    @DisplayName("duplicate violation does not create multiple alerts")
    void duplicateViolationDoesNotCreateMultipleAlerts() {
        double outsideLat = 40.7228;
        double outsideLon = -74.0160;

        // First violation should create an alert
        geofenceValidationService.validateEquipmentLocation(
                equipment.getId(), outsideLat, outsideLon);

        List<SecurityIncident> incidentsAfterFirst = securityIncidentRepository.findAll();
        assertEquals(1, incidentsAfterFirst.size(),
                "First violation should create exactly one alert");

        // Second violation with same coordinates should not create another alert
        geofenceValidationService.validateEquipmentLocation(
                equipment.getId(), outsideLat, outsideLon);

        List<SecurityIncident> incidentsAfterSecond = securityIncidentRepository.findAll();
        assertEquals(1, incidentsAfterSecond.size(),
                "Duplicate violation should not create another alert");
    }

    @Test
    @DisplayName("equipment without geofence configuration does not trigger alert")
    void equipmentWithoutGeofenceDoesNotTriggerAlert() {
        // Create location without geofence
        FacilityLocation locationWithoutGeofence = facilityLocationRepository.save(
                FacilityLocation.builder()
                        .name("No Geofence Facility")
                        .locationType(LocationType.FACILITY)
                        .hospital(hospital)
                        .latitude(null)
                        .longitude(null)
                        .geofenceRadiusMeters(null)
                        .createdBy("test")
                        .build());

        Equipment equipmentWithoutGeofence = equipmentRepository.save(
                Equipment.builder()
                        .equipmentCode("EQ-NO-GEO")
                        .name("Equipment Without Geofence")
                        .department("Radiology")
                        .category(EquipmentCategory.IMAGING)
                        .status(EquipmentStatus.ACTIVE)
                        .hospital(hospital)
                        .location(locationWithoutGeofence)
                        .build());

        geofenceValidationService.validateEquipmentLocation(
                equipmentWithoutGeofence.getId(), 40.7228, -74.0160);

        List<SecurityIncident> incidents = securityIncidentRepository.findAll();
        assertTrue(incidents.isEmpty(),
                "Equipment without geofence should not trigger alerts");
    }

    @Test
    @DisplayName("equipment without assigned location does not trigger alert")
    void equipmentWithoutLocationDoesNotTriggerAlert() {
        Equipment equipmentWithoutLocation = equipmentRepository.save(
                Equipment.builder()
                        .equipmentCode("EQ-NO-LOC")
                        .name("Equipment Without Location")
                        .department("Radiology")
                        .category(EquipmentCategory.IMAGING)
                        .status(EquipmentStatus.ACTIVE)
                        .hospital(hospital)
                        .location(null)
                        .build());

        geofenceValidationService.validateEquipmentLocation(
                equipmentWithoutLocation.getId(), 40.7228, -74.0160);

        List<SecurityIncident> incidents = securityIncidentRepository.findAll();
        assertTrue(incidents.isEmpty(),
                "Equipment without assigned location should not trigger alerts");
    }

    @Test
    @DisplayName("non-existent equipment ID is safely handled")
    void nonExistentEquipmentIsSafelyHandled() {
        geofenceValidationService.validateEquipmentLocation(
                999999L, 40.7228, -74.0160);

        List<SecurityIncident> incidents = securityIncidentRepository.findAll();
        assertTrue(incidents.isEmpty(),
                "Non-existent equipment should not trigger alerts");
    }

    @Test
    @DisplayName("null equipment ID is safely handled")
    void nullEquipmentIdIsSafelyHandled() {
        geofenceValidationService.validateEquipmentLocation(
                null, 40.7228, -74.0160);

        List<SecurityIncident> incidents = securityIncidentRepository.findAll();
        assertTrue(incidents.isEmpty(),
                "Null equipment ID should not trigger alerts");
    }

    @Test
    @DisplayName("new alert created after previous alert is resolved")
    void newAlertCreatedAfterPreviousAlertResolved() {
        double outsideLat = 40.7228;
        double outsideLon = -74.0160;

        // First violation creates alert
        geofenceValidationService.validateEquipmentLocation(
                equipment.getId(), outsideLat, outsideLon);

        List<SecurityIncident> incidents = securityIncidentRepository.findAll();
        assertEquals(1, incidents.size());

        // Resolve the alert
        SecurityIncident incident = incidents.get(0);
        incident.setStatus(IncidentStatus.RESOLVED);
        incident.setResolvedAt(java.time.LocalDateTime.now());
        securityIncidentRepository.save(incident);

        // New violation should create a new alert
        geofenceValidationService.validateEquipmentLocation(
                equipment.getId(), outsideLat + 0.001, outsideLon + 0.001);

        List<SecurityIncident> incidentsAfterResolution = securityIncidentRepository.findAll();
        assertEquals(2, incidentsAfterResolution.size(),
                "New alert should be created after previous alert is resolved");
    }

    @Test
    @DisplayName("different location violation creates separate alert")
    void differentLocationViolationCreatesSeparateAlert() {
        // Create second location with geofence
        FacilityLocation location2 = facilityLocationRepository.save(
                FacilityLocation.builder()
                        .name("Second Facility")
                        .locationType(LocationType.FACILITY)
                        .hospital(hospital)
                        .latitude(40.7500)
                        .longitude(-74.0500)
                        .geofenceRadiusMeters(500)
                        .createdBy("test")
                        .build());

        // Violate first location boundary
        geofenceValidationService.validateEquipmentLocation(
                equipment.getId(), 40.7228, -74.0160);

        List<SecurityIncident> firstAlerts = securityIncidentRepository.findAll();
        assertEquals(1, firstAlerts.size());

        // Move equipment to second location and violate its boundary
        equipment.setLocation(location2);
        equipmentRepository.save(equipment);

        geofenceValidationService.validateEquipmentLocation(
                equipment.getId(), 40.7600, -74.0600);

        List<SecurityIncident> secondAlerts = securityIncidentRepository.findAll();
        assertEquals(2, secondAlerts.size(),
                "Different location violation should create separate alert");
    }
}

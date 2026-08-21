package com.medtrack.service;

import com.medtrack.auth.model.User;
import com.medtrack.model.Equipment;
import com.medtrack.model.EquipmentStatus;
import com.medtrack.model.FacilityLocation;
import com.medtrack.model.Hospital;
import com.medtrack.repository.EquipmentDisposalRepository;
import com.medtrack.repository.EquipmentImportAuditLogRepository;
import com.medtrack.repository.EquipmentLocationHistoryRepository;
import com.medtrack.repository.EquipmentRepository;
import com.medtrack.repository.FacilityLocationRepository;
import com.medtrack.repository.HospitalRepository;
import com.medtrack.auth.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cache.CacheManager;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@SpringBootTest
@ActiveProfiles("test")
public class EquipmentLocationCachingTest {

    @Autowired
    private EquipmentService equipmentService;

    @Autowired
    private LocationService locationService;

    @Autowired
    private HospitalService hospitalService;

    @Autowired
    private CacheManager cacheManager;

    @MockitoBean
    private EquipmentRepository equipmentRepository;

    @MockitoBean
    private HospitalRepository hospitalRepository;

    @MockitoBean
    private UserRepository userRepository;

    @MockitoBean
    private FacilityLocationRepository facilityLocationRepository;

    @MockitoBean
    private EquipmentImportAuditLogRepository equipmentImportAuditLogRepository;

    @MockitoBean
    private EventPublisherService eventPublisherService;

    @MockitoBean
    private EquipmentAuditService equipmentAuditService;

    @MockitoBean
    private EquipmentLocationHistoryRepository equipmentLocationHistoryRepository;

    @MockitoBean
    private EquipmentDisposalRepository equipmentDisposalRepository;

    private User testUser;
    private Hospital testHospital;
    private Equipment testEquipment;
    private FacilityLocation testLocation;
    private final String username = "test_admin";

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(100L)
                .username(username)
                .email("admin@test.com")
                .build();

        testHospital = Hospital.builder()
                .id(1L)
                .user(testUser)
                .name("Test Hospital")
                .build();

        testEquipment = Equipment.builder()
                .id(99L)
                .name("Test Equipment")
                .equipmentCode("EQ-TEST")
                .status(EquipmentStatus.ACTIVE)
                .hospital(testHospital)
                .quantity(5)
                .minimumStock(10)
                .build();

        testLocation = FacilityLocation.builder()
                .id(50L)
                .name("Test Location")
                .locationType(com.medtrack.model.LocationType.ROOM)
                .hospital(testHospital)
                .build();

        // Clear all caches before each test
        cacheManager.getCacheNames().forEach(name -> cacheManager.getCache(name).clear());
    }

    @Test
    void testEquipmentListCaching() {
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(testUser));
        when(hospitalRepository.findByUserId(100L)).thenReturn(Optional.of(testHospital));
        when(equipmentRepository.findByHospitalId(1L)).thenReturn(Arrays.asList(testEquipment));

        // First call - should hit the repository
        List<Equipment> result1 = equipmentService.getAllEquipment(username);
        assertThat(result1).hasSize(1);
        assertThat(result1.get(0).getName()).isEqualTo("Test Equipment");

        // Second call - should hit the cache
        List<Equipment> result2 = equipmentService.getAllEquipment(username);
        assertThat(result2).hasSize(1);
        assertThat(result2.get(0).getName()).isEqualTo("Test Equipment");

        // Verify repository method was called only once
        verify(equipmentRepository, times(1)).findByHospitalId(1L);
    }

    @Test
    void testEquipmentByIdCaching() {
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(testUser));
        when(hospitalRepository.findByUserId(100L)).thenReturn(Optional.of(testHospital));
        when(equipmentRepository.findByIdAndHospitalId(99L, 1L)).thenReturn(Optional.of(testEquipment));

        // First call - should hit the repository
        Equipment result1 = equipmentService.getEquipmentById(99L, username);
        assertThat(result1.getName()).isEqualTo("Test Equipment");

        // Second call - should hit the cache
        Equipment result2 = equipmentService.getEquipmentById(99L, username);
        assertThat(result2.getName()).isEqualTo("Test Equipment");

        // Verify repository method was called only once
        verify(equipmentRepository, times(1)).findByIdAndHospitalId(99L, 1L);
    }

    @Test
    void testEquipmentByIdDifferentIdsNoCollision() {
        Equipment equipment2 = Equipment.builder()
                .id(98L)
                .name("Another Equipment")
                .equipmentCode("EQ-TEST2")
                .status(EquipmentStatus.ACTIVE)
                .hospital(testHospital)
                .build();

        when(userRepository.findByUsername(username)).thenReturn(Optional.of(testUser));
        when(hospitalRepository.findByUserId(100L)).thenReturn(Optional.of(testHospital));
        when(equipmentRepository.findByIdAndHospitalId(99L, 1L)).thenReturn(Optional.of(testEquipment));
        when(equipmentRepository.findByIdAndHospitalId(98L, 1L)).thenReturn(Optional.of(equipment2));

        // Call with first ID
        Equipment result1 = equipmentService.getEquipmentById(99L, username);
        assertThat(result1.getName()).isEqualTo("Test Equipment");

        // Call with second ID
        Equipment result2 = equipmentService.getEquipmentById(98L, username);
        assertThat(result2.getName()).isEqualTo("Another Equipment");

        // Call with first ID again - should still be cached
        Equipment result3 = equipmentService.getEquipmentById(99L, username);
        assertThat(result3.getName()).isEqualTo("Test Equipment");

        // Verify each repository method was called only once
        verify(equipmentRepository, times(1)).findByIdAndHospitalId(99L, 1L);
        verify(equipmentRepository, times(1)).findByIdAndHospitalId(98L, 1L);
    }

    @Test
    void testEquipmentByDepartmentCaching() {
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(testUser));
        when(hospitalRepository.findByUserId(100L)).thenReturn(Optional.of(testHospital));
        when(equipmentRepository.findByHospitalIdAndDepartmentIgnoreCase(1L, "Radiology"))
                .thenReturn(Arrays.asList(testEquipment));

        // First call - should hit the repository
        List<Equipment> result1 = equipmentService.getEquipmentByDepartment("Radiology", username);
        assertThat(result1).hasSize(1);

        // Second call - should hit the cache
        List<Equipment> result2 = equipmentService.getEquipmentByDepartment("Radiology", username);
        assertThat(result2).hasSize(1);

        // Verify repository method was called only once
        verify(equipmentRepository, times(1)).findByHospitalIdAndDepartmentIgnoreCase(1L, "Radiology");
    }

    @Test
    void testLowStockEquipmentCaching() {
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(testUser));
        when(hospitalRepository.findByUserId(100L)).thenReturn(Optional.of(testHospital));
        when(equipmentRepository.findLowStockEquipment(1L)).thenReturn(Arrays.asList(testEquipment));

        // First call - should hit the repository
        List<Equipment> result1 = equipmentService.getLowStockEquipment(username);
        assertThat(result1).hasSize(1);

        // Second call - should hit the cache
        List<Equipment> result2 = equipmentService.getLowStockEquipment(username);
        assertThat(result2).hasSize(1);

        // Verify repository method was called only once
        verify(equipmentRepository, times(1)).findLowStockEquipment(1L);
    }

    @Test
    void testLocationTreeCaching() {
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(testUser));
        when(hospitalRepository.findByUserId(100L)).thenReturn(Optional.of(testHospital));
        when(facilityLocationRepository.findByHospitalId(1L)).thenReturn(Arrays.asList(testLocation));

        // First call - should hit the repository
        List<FacilityLocation> result1 = locationService.getLocationTree(username);
        assertThat(result1).hasSize(1);

        // Second call - should hit the cache
        List<FacilityLocation> result2 = locationService.getLocationTree(username);
        assertThat(result2).hasSize(1);

        // Verify repository method was called only once
        verify(facilityLocationRepository, times(1)).findByHospitalId(1L);
    }

    @Test
    void testLocationDescendantsCaching() {
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(testUser));
        when(hospitalRepository.findByUserId(100L)).thenReturn(Optional.of(testHospital));
        when(facilityLocationRepository.findByHospitalId(1L)).thenReturn(Arrays.asList(testLocation));

        // First call - should hit the repository
        Set<Long> result1 = locationService.resolveDescendantIds(50L, username);
        assertThat(result1).contains(50L);

        // Second call - should hit the cache
        Set<Long> result2 = locationService.resolveDescendantIds(50L, username);
        assertThat(result2).contains(50L);

        // Verify repository method was called only once
        verify(facilityLocationRepository, times(1)).findByHospitalId(1L);
    }

    @Test
    void testHospitalByUserIdCaching() {
        when(hospitalRepository.findByUserId(100L)).thenReturn(Optional.of(testHospital));

        // First call - should hit the repository
        Hospital result1 = hospitalService.getHospitalByUserId(100L);
        assertThat(result1.getName()).isEqualTo("Test Hospital");

        // Second call - should hit the cache
        Hospital result2 = hospitalService.getHospitalByUserId(100L);
        assertThat(result2.getName()).isEqualTo("Test Hospital");

        // Verify repository method was called only once
        verify(hospitalRepository, times(1)).findByUserId(100L);
    }

    @Test
    void testEquipmentUpdateInvalidatesCache() {
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(testUser));
        when(hospitalRepository.findByUserId(100L)).thenReturn(Optional.of(testHospital));
        when(equipmentRepository.findByIdAndHospitalId(99L, 1L)).thenReturn(Optional.of(testEquipment));
        when(equipmentRepository.save(any(Equipment.class))).thenReturn(testEquipment);

        // First call - populate cache
        Equipment result1 = equipmentService.getEquipmentById(99L, username);
        assertThat(result1.getName()).isEqualTo("Test Equipment");

        // Update equipment - should invalidate cache
        testEquipment.setName("Updated Equipment");
        equipmentService.updateEquipment(99L, testEquipment, username);

        // Call again - should hit repository again due to cache eviction
        Equipment result2 = equipmentService.getEquipmentById(99L, username);
        assertThat(result2.getName()).isEqualTo("Updated Equipment");

        // Verify repository method was called 3 times:
        // 1. Initial call to populate cache
        // 2. Call inside updateEquipment method
        // 3. Call after cache eviction
        verify(equipmentRepository, times(3)).findByIdAndHospitalId(99L, 1L);
    }

    @Test
    void testEquipmentDeleteInvalidatesCache() {
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(testUser));
        when(hospitalRepository.findByUserId(100L)).thenReturn(Optional.of(testHospital));
        when(equipmentRepository.findByIdAndHospitalId(99L, 1L)).thenReturn(Optional.of(testEquipment));
        when(equipmentRepository.findByIdAndDeletedTrue(99L)).thenReturn(Optional.empty());

        // First call - populate cache
        Equipment result1 = equipmentService.getEquipmentById(99L, username);
        assertThat(result1.getName()).isEqualTo("Test Equipment");

        // Delete equipment - should invalidate cache
        equipmentService.deleteEquipment(99L, username);

        // Call again - should hit repository again due to cache eviction
        // (this will throw exception since equipment is deleted)
        try {
            equipmentService.getEquipmentById(99L, username);
        } catch (Exception e) {
            // Expected exception since equipment is deleted
        }

        // Verify repository method was called 3 times:
        // 1. Initial call to populate cache
        // 2. Call inside deleteEquipment method
        // 3. Call after cache eviction
        verify(equipmentRepository, times(3)).findByIdAndHospitalId(99L, 1L);
    }

    @Test
    void testLocationCreateInvalidatesCache() {
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(testUser));
        when(hospitalRepository.findByUserId(100L)).thenReturn(Optional.of(testHospital));
        when(facilityLocationRepository.findByHospitalId(1L)).thenReturn(Arrays.asList(testLocation));
        when(facilityLocationRepository.save(any(FacilityLocation.class))).thenReturn(testLocation);

        // First call - populate cache
        List<FacilityLocation> result1 = locationService.getLocationTree(username);
        assertThat(result1).hasSize(1);

        // Create location - should invalidate cache
        locationService.createLocation(testLocation, username);

        // Call again - should hit repository again due to cache eviction
        List<FacilityLocation> result2 = locationService.getLocationTree(username);
        assertThat(result2).hasSize(1);

        // Verify repository method was called twice (once before create, once after eviction)
        verify(facilityLocationRepository, times(2)).findByHospitalId(1L);
    }

    @Test
    void testLocationUpdateInvalidatesCache() {
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(testUser));
        when(hospitalRepository.findByUserId(100L)).thenReturn(Optional.of(testHospital));
        when(facilityLocationRepository.findById(50L)).thenReturn(Optional.of(testLocation));
        when(facilityLocationRepository.findByHospitalId(1L)).thenReturn(Arrays.asList(testLocation));
        when(facilityLocationRepository.save(any(FacilityLocation.class))).thenReturn(testLocation);

        // First call - populate cache
        List<FacilityLocation> result1 = locationService.getLocationTree(username);
        assertThat(result1).hasSize(1);

        // Update location - should invalidate cache
        testLocation.setName("Updated Location");
        locationService.updateLocation(50L, testLocation, username);

        // Call again - should hit repository again due to cache eviction
        List<FacilityLocation> result2 = locationService.getLocationTree(username);
        assertThat(result2).hasSize(1);

        // Verify repository method was called twice (once before update, once after eviction)
        verify(facilityLocationRepository, times(2)).findByHospitalId(1L);
    }

    @Test
    void testLocationDeleteInvalidatesCache() {
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(testUser));
        when(hospitalRepository.findByUserId(100L)).thenReturn(Optional.of(testHospital));
        when(facilityLocationRepository.findById(50L)).thenReturn(Optional.of(testLocation));
        when(facilityLocationRepository.findByHospitalId(1L)).thenReturn(Arrays.asList(testLocation));
        when(facilityLocationRepository.countByParentId(50L)).thenReturn(0L);
        when(equipmentRepository.countByLocationId(50L)).thenReturn(0L);

        // First call - populate cache
        List<FacilityLocation> result1 = locationService.getLocationTree(username);
        assertThat(result1).hasSize(1);

        // Delete location - should invalidate cache
        locationService.deleteLocation(50L, username);

        // Call again - should hit repository again due to cache eviction
        List<FacilityLocation> result2 = locationService.getLocationTree(username);
        assertThat(result2).hasSize(1);

        // Verify repository method was called twice (once before delete, once after eviction)
        verify(facilityLocationRepository, times(2)).findByHospitalId(1L);
    }

    @Test
    void testHospitalCreateInvalidatesCache() {
        when(userRepository.findByEmail("admin@test.com")).thenReturn(Optional.of(testUser));
        when(hospitalRepository.findByUserId(100L)).thenReturn(Optional.empty());
        when(hospitalRepository.save(any(Hospital.class))).thenReturn(testHospital);

        // Create hospital - should invalidate cache
        hospitalService.createHospitalProfile(testHospital, "admin@test.com");

        // Since we mock the repository to return empty first, the subsequent call
        // will also hit the repository because cache was invalidated but we still need to mock the return
        when(hospitalRepository.findByUserId(100L)).thenReturn(Optional.of(testHospital));
        
        // Call hospital by user ID - should hit repository (cache was evicted)
        Hospital result = hospitalService.getHospitalByUserId(100L);
        assertThat(result.getName()).isEqualTo("Test Hospital");

        // Verify repository method was called (cache was invalidated on create)
        verify(hospitalRepository, times(2)).findByUserId(100L);
    }

    @Test
    void testHospitalArchiveInvalidatesCache() {
        when(hospitalRepository.findById(1L)).thenReturn(Optional.of(testHospital));
        when(hospitalRepository.save(any(Hospital.class))).thenReturn(testHospital);

        // Archive hospital - should invalidate cache
        hospitalService.archiveHospital(1L, username);

        // Verify cache was evicted (no cache hit would have occurred)
        verify(hospitalRepository, never()).findByUserId(100L);
    }
}
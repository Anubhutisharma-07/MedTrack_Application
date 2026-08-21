package com.medtrack.service;

import com.medtrack.auth.model.User;
import com.medtrack.model.Hospital;
import com.medtrack.model.Equipment;
import com.medtrack.dto.EquipmentDashboardResponse;
import com.medtrack.dto.MaintenanceWorkOrderDashboardResponse;
import com.medtrack.repository.EquipmentRepository;
import com.medtrack.repository.HospitalRepository;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.repository.MaintenanceWorkOrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.cache.CacheManager;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@SpringBootTest
@ActiveProfiles("test")
public class DashboardCacheIntegrationTest {

    @Autowired
    private EquipmentService equipmentService;

    @Autowired
    private MaintenanceWorkOrderService workOrderService;

    @Autowired
    private CacheManager cacheManager;

    @MockitoBean
    private EquipmentRepository equipmentRepository;

    @MockitoBean
    private HospitalRepository hospitalRepository;

    @MockitoBean
    private UserRepository userRepository;

    @MockitoBean
    private MaintenanceWorkOrderRepository workOrderRepository;

    @MockitoBean
    private EquipmentAuditService equipmentAuditService;
    
    @MockitoBean
    private EquipmentFinancialService financialService;

    private User testUser;
    private Hospital testHospital;

    @BeforeEach
    void setUp() {
        testUser = User.builder().id(100L).username("admin").email("admin@test.com").build();
        testHospital = Hospital.builder().id(1L).user(testUser).name("Test Hospital").build();

        cacheManager.getCacheNames().forEach(name -> cacheManager.getCache(name).clear());
    }

    @Test
    void testEquipmentDashboardCaching() {
        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(testUser));
        when(hospitalRepository.findByUserId(100L)).thenReturn(Optional.of(testHospital));
        when(equipmentRepository.countByHospitalId(1L)).thenReturn(10L);
        when(equipmentRepository.countByHospitalIdAndStatus(eq(1L), any())).thenReturn(5L);

        // First call - should hit the repository
        EquipmentDashboardResponse res1 = equipmentService.getDashboardOverview("admin");
        assertThat(res1.getTotalEquipment()).isEqualTo(10L);

        // Second call - should hit the cache
        EquipmentDashboardResponse res2 = equipmentService.getDashboardOverview("admin");
        assertThat(res2.getTotalEquipment()).isEqualTo(10L);

        // Verify repository method was called only once
        verify(equipmentRepository, times(1)).countByHospitalId(1L);

        // Now trigger cache eviction
        Equipment equipment = new Equipment();
        equipment.setId(99L);
        when(equipmentRepository.findByIdAndHospitalId(99L, 1L)).thenReturn(Optional.of(equipment));
        
        equipmentService.deleteEquipment(99L, "admin");

        // Third call - should hit the repository again because cache was evicted
        EquipmentDashboardResponse res3 = equipmentService.getDashboardOverview("admin");
        
        verify(equipmentRepository, times(2)).countByHospitalId(1L);
    }
    
    @Test
    void testWorkOrderDashboardCaching() {
        when(workOrderRepository.count(org.mockito.ArgumentMatchers.<org.springframework.data.jpa.domain.Specification<com.medtrack.model.MaintenanceWorkOrder>>any())).thenReturn(20L);
        when(workOrderRepository.countByHospitalIdAndStatus(eq(1L), any())).thenReturn(10L);

        // First call
        MaintenanceWorkOrderDashboardResponse res1 = workOrderService.getDashboard(1L);
        
        // Second call
        MaintenanceWorkOrderDashboardResponse res2 = workOrderService.getDashboard(1L);

        // Repository should be called only once for count
        verify(workOrderRepository, times(6)).countByHospitalIdAndStatus(eq(1L), any());

        // Cache eviction
        when(workOrderRepository.findByIdAndHospitalId(100L, 1L)).thenReturn(Optional.of(new com.medtrack.model.MaintenanceWorkOrder()));

        workOrderService.archiveWorkOrder(100L, 1L, "admin");

        // Third call
        MaintenanceWorkOrderDashboardResponse res3 = workOrderService.getDashboard(1L);
        
        verify(workOrderRepository, times(12)).countByHospitalIdAndStatus(eq(1L), any());
    }
}

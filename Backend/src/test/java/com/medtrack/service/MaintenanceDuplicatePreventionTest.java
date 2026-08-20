package com.medtrack.service;

import com.medtrack.auth.model.User;
import com.medtrack.auth.model.AccountStatus;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.dto.MaintenanceCreateRequest;
import com.medtrack.dto.MaintenanceUpdateRequest;
import com.medtrack.model.Equipment;
import com.medtrack.model.Hospital;
import com.medtrack.model.MaintenanceStatus;
import com.medtrack.model.MaintenanceTask;
import com.medtrack.repository.EquipmentRepository;
import com.medtrack.repository.HospitalRepository;
import com.medtrack.repository.MaintenanceTaskRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Enterprise unit test suite testing duplicate maintenance task prevention.
 */
@ExtendWith(MockitoExtension.class)
public class MaintenanceDuplicatePreventionTest {

    @Mock
    private MaintenanceTaskRepository taskRepository;

    @Mock
    private EquipmentRepository equipmentRepository;

    @Mock
    private HospitalRepository hospitalRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private MaintenanceActivityService activityService;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private MaintenanceService maintenanceService;

    private Hospital hospital;
    private User hospitalUser;
    private User technician;
    private Equipment equipment;

    @BeforeEach
    void setUp() {
        hospitalUser = new User();
        hospitalUser.setId(10L);
        hospitalUser.setEmail("admin@hospital.org");
        hospitalUser.setUsername("admin_user");
        hospitalUser.setRole("hospital");
        hospitalUser.setAccountStatus(AccountStatus.ACTIVE);

        hospital = new Hospital();
        hospital.setId(100L);
        hospital.setName("City General Hospital");
        hospital.setUser(hospitalUser);

        technician = new User();
        technician.setId(20L);
        technician.setEmail("tech@hospital.org");
        technician.setName("John Tech");
        technician.setRole("technician");
        technician.setAccountStatus(AccountStatus.ACTIVE);

        equipment = new Equipment();
        equipment.setId(500L);
        equipment.setEquipmentCode("EQ-VENT-001");
        equipment.setName("Ventilator Unit 1");
        equipment.setHospital(hospital);
    }

    @Test
    @DisplayName("scheduleTask throws exception when active task exists for equipment")
    void testScheduleTaskThrowsOnDuplicateActiveTask() {
        when(authentication.getName()).thenReturn("admin@hospital.org");
        when(userRepository.findByEmail("admin@hospital.org")).thenReturn(Optional.of(hospitalUser));
        when(hospitalRepository.findByUserId(10L)).thenReturn(Optional.of(hospital));
        when(equipmentRepository.findByEquipmentCode("EQ-VENT-001"))
                .thenReturn(Optional.of(equipment));

        when(taskRepository.existsActiveTaskForEquipmentWithCode(
                eq(100L), eq(500L), eq("EQ-VENT-001"), eq("Preventive"), anyList()))
                .thenReturn(true);

        MaintenanceCreateRequest request = new MaintenanceCreateRequest();
        request.setEquipmentId("EQ-VENT-001");
        request.setMaintenanceType("Preventive");
        request.setPriority("Normal");
        request.setDeadline(LocalDate.now().plusDays(7));

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> maintenanceService.scheduleTask(request, authentication)
        );

        assertTrue(ex.getMessage().contains("already exists"));
        verify(taskRepository, never()).save(any(MaintenanceTask.class));
    }

    @Test
    @DisplayName("scheduleTask succeeds when no active task exists for equipment")
    void testScheduleTaskSucceedsWhenNoDuplicate() {
        when(authentication.getName()).thenReturn("admin@hospital.org");
        when(userRepository.findByEmail("admin@hospital.org")).thenReturn(Optional.of(hospitalUser));
        when(hospitalRepository.findByUserId(10L)).thenReturn(Optional.of(hospital));
        when(equipmentRepository.findByEquipmentCode("EQ-VENT-001"))
                .thenReturn(Optional.of(equipment));

        when(taskRepository.existsActiveTaskForEquipmentWithCode(
                eq(100L), eq(500L), eq("EQ-VENT-001"), eq("Preventive"), anyList()))
                .thenReturn(false);

        MaintenanceTask savedTask = MaintenanceTask.builder()
                .id(1L)
                .taskCode("MNT-TEST-123")
                .equipmentId("EQ-VENT-001")
                .hospitalId(100L)
                .status(MaintenanceStatus.SCHEDULED)
                .build();

        when(taskRepository.save(any(MaintenanceTask.class))).thenReturn(savedTask);

        MaintenanceCreateRequest request = new MaintenanceCreateRequest();
        request.setEquipmentId("EQ-VENT-001");
        request.setMaintenanceType("Preventive");
        request.setPriority("Normal");
        request.setDeadline(LocalDate.now().plusDays(7));

        MaintenanceTask result = maintenanceService.scheduleTask(request, authentication);

        assertNotNull(result);
        assertEquals("MNT-TEST-123", result.getTaskCode());
        verify(taskRepository, times(1)).save(any(MaintenanceTask.class));
    }

    @Test
    @DisplayName("scheduleTask performs case-insensitive duplicate type validation")
    void testScheduleTaskCaseInsensitiveDuplicateCheck() {
        when(authentication.getName()).thenReturn("admin@hospital.org");
        when(userRepository.findByEmail("admin@hospital.org")).thenReturn(Optional.of(hospitalUser));
        when(hospitalRepository.findByUserId(10L)).thenReturn(Optional.of(hospital));
        when(equipmentRepository.findByEquipmentCode("EQ-VENT-001"))
                .thenReturn(Optional.of(equipment));

        when(taskRepository.existsActiveTaskForEquipmentWithCode(
                eq(100L), eq(500L), eq("EQ-VENT-001"), eq("corrective"), anyList()))
                .thenReturn(true);

        MaintenanceCreateRequest request = new MaintenanceCreateRequest();
        request.setEquipmentId("EQ-VENT-001");
        request.setMaintenanceType(" corrective ");
        request.setPriority("High");
        request.setDeadline(LocalDate.now().plusDays(3));

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> maintenanceService.scheduleTask(request, authentication)
        );

        assertTrue(ex.getMessage().contains("already exists"));
    }

    @Test
    @DisplayName("updateTask completing recurring task skips next task when duplicate active exists")
    void testUpdateTaskSkipsNextTaskOnExistingActiveTask() {
        when(authentication.getName()).thenReturn("tech@hospital.org");
        when(userRepository.findByEmail("tech@hospital.org")).thenReturn(Optional.of(technician));

        MaintenanceTask existingTask = MaintenanceTask.builder()
                .id(99L)
                .taskCode("MNT-RECUR-01")
                .hospitalId(100L)
                .equipmentId("EQ-VENT-001")
                .equipmentRecord(equipment)
                .maintenanceType("Preventive")
                .status(MaintenanceStatus.IN_PROGRESS)
                .recurrencePeriodDays(30)
                .assignedTechnicianRecord(technician)
                .build();

        when(taskRepository.findByIdAndAssignedTechnicianIdForUpdate(eq(99L), eq(20L)))
                .thenReturn(Optional.of(existingTask));

        when(taskRepository.countSchedulableEquipment(eq(500L), eq(100L))).thenReturn(1L);

        when(taskRepository.existsActiveTaskForEquipmentWithCode(
                eq(100L), eq(500L), eq("EQ-VENT-001"), eq("Preventive"), anyList()))
                .thenReturn(true);

        when(taskRepository.save(any(MaintenanceTask.class))).thenAnswer(invocation -> invocation.getArgument(0));

        MaintenanceUpdateRequest updateRequest = new MaintenanceUpdateRequest();
        updateRequest.setStatus(MaintenanceStatus.COMPLETED);
        updateRequest.setSignature("John Tech");

        MaintenanceTask result = maintenanceService.updateTask(99L, updateRequest, authentication);

        assertNotNull(result);
        assertEquals(MaintenanceStatus.COMPLETED, result.getStatus());
        verify(taskRepository, times(1)).save(any(MaintenanceTask.class));
    }
}

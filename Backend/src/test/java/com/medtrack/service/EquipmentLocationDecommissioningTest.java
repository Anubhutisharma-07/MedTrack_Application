package com.medtrack.service;

import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.dto.EquipmentDisposalResponse;
import com.medtrack.dto.EquipmentLifecycleActionResponse;
import com.medtrack.model.Equipment;
import com.medtrack.model.EquipmentDisposal;
import com.medtrack.model.EquipmentDisposalMethod;
import com.medtrack.model.EquipmentDisposalStatus;
import com.medtrack.model.EquipmentLifecycleAction;
import com.medtrack.model.EquipmentLifecycleActionType;
import com.medtrack.model.EquipmentLifecycleStatus;
import com.medtrack.model.EquipmentStatus;
import com.medtrack.model.FacilityLocation;
import com.medtrack.model.Hospital;
import com.medtrack.model.LocationType;
import com.medtrack.repository.EquipmentDisposalRepository;
import com.medtrack.repository.EquipmentLifecycleActionRepository;
import com.medtrack.repository.EquipmentRepository;
import com.medtrack.repository.FacilityLocationRepository;
import com.medtrack.repository.HospitalRepository;
import com.medtrack.repository.MaintenanceTaskRepository;
import com.medtrack.repository.MaintenanceWorkOrderRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EquipmentLocationDecommissioningTest {

    private static final String USERNAME = "admin@hospital.com";
    private static final Long HOSPITAL_ID = 100L;
    private static final Long LOCATION_ID = 200L;

    @Mock
    private EquipmentDisposalRepository disposalRepository;

    @Mock
    private EquipmentLifecycleActionRepository lifecycleRepository;

    @Mock
    private EquipmentRepository equipmentRepository;

    @Mock
    private HospitalRepository hospitalRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private FacilityLocationRepository facilityLocationRepository;

    @Mock
    private MaintenanceWorkOrderRepository workOrderRepository;

    @Mock
    private MaintenanceTaskRepository taskRepository;

    @Mock
    private PreventiveMaintenanceService preventiveMaintenanceService;

    @InjectMocks
    private EquipmentDisposalService disposalService;

    @InjectMocks
    private EquipmentLifecycleService lifecycleService;

    @InjectMocks
    private LocationService locationService;

    private Hospital hospital;
    private User user;
    private FacilityLocation location;
    private Equipment activeEquipment;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .id(1L)
                .username(USERNAME)
                .email(USERNAME)
                .build();

        hospital = Hospital.builder()
                .id(HOSPITAL_ID)
                .name("General Hospital")
                .user(user)
                .build();

        location = FacilityLocation.builder()
                .id(LOCATION_ID)
                .name("ICU Room 101")
                .locationType(LocationType.ROOM)
                .hospital(hospital)
                .build();

        activeEquipment = Equipment.builder()
                .id(500L)
                .equipmentCode("EQ-500")
                .name("Ventilator v1")
                .hospital(hospital)
                .status(EquipmentStatus.ACTIVE)
                .location(location)
                .roomLocation("Room 101")
                .wardLocation("ICU Ward")
                .build();
    }

    @Test
    @DisplayName("completeDisposal - Clears location and room/ward details on disposal completion")
    void completeDisposal_ClearsLocationAndRoomWardDetails() {
        EquipmentDisposal disposal = EquipmentDisposal.builder()
                .id(10L)
                .equipment(activeEquipment)
                .hospital(hospital)
                .status(EquipmentDisposalStatus.APPROVED)
                .storesPatientData(false)
                .disposalMethod(EquipmentDisposalMethod.SCRAP)
                .effectiveDate(LocalDate.now())
                .requestedBy(USERNAME)
                .approvedBy(USERNAME)
                .build();

        when(userRepository.findByUsername(USERNAME)).thenReturn(Optional.of(user));
        when(hospitalRepository.findByUserId(1L)).thenReturn(Optional.of(hospital));
        when(disposalRepository.findByIdAndHospitalId(10L, HOSPITAL_ID)).thenReturn(Optional.of(disposal));
        when(workOrderRepository.findAllByHospitalIdAndEquipmentIdOrderByCreatedAtDesc(HOSPITAL_ID, 500L))
                .thenReturn(List.of());
        when(taskRepository.findByHospitalIdAndEquipmentRecordId(HOSPITAL_ID, 500L))
                .thenReturn(List.of());
        when(disposalRepository.save(any(EquipmentDisposal.class))).thenAnswer(i -> i.getArgument(0));
        when(equipmentRepository.save(any(Equipment.class))).thenAnswer(i -> i.getArgument(0));

        EquipmentDisposalResponse response = disposalService.completeDisposal(10L, USERNAME);

        assertNotNull(response);
        assertEquals(EquipmentDisposalStatus.COMPLETED, response.getStatus());
        assertEquals(EquipmentStatus.DISPOSED, activeEquipment.getStatus());
        assertNull(activeEquipment.getLocation(), "Facility location reference should be cleared upon disposal");
        assertNull(activeEquipment.getRoomLocation(), "Room location should be cleared upon disposal");
        assertNull(activeEquipment.getWardLocation(), "Ward location should be cleared upon disposal");
    }

    @Test
    @DisplayName("completeAction - Retirement clears location and room/ward details")
    void completeAction_Retirement_ClearsLocationDetails() {
        EquipmentLifecycleAction action = EquipmentLifecycleAction.builder()
                .id(20L)
                .equipment(activeEquipment)
                .hospital(hospital)
                .actionType(EquipmentLifecycleActionType.RETIREMENT)
                .status(EquipmentLifecycleStatus.APPROVED)
                .approvedBy(USERNAME)
                .build();

        when(userRepository.findByUsername(USERNAME)).thenReturn(Optional.of(user));
        when(hospitalRepository.findByUserId(1L)).thenReturn(Optional.of(hospital));
        when(lifecycleRepository.findByIdAndHospitalId(20L, HOSPITAL_ID)).thenReturn(Optional.of(action));
        when(lifecycleRepository.save(any(EquipmentLifecycleAction.class))).thenAnswer(i -> i.getArgument(0));
        when(equipmentRepository.save(any(Equipment.class))).thenAnswer(i -> i.getArgument(0));

        EquipmentLifecycleActionResponse response = lifecycleService.completeAction(20L, USERNAME);

        assertNotNull(response);
        assertEquals(EquipmentLifecycleStatus.COMPLETED, response.getStatus());
        assertEquals(EquipmentStatus.RETIRED, activeEquipment.getStatus());
        assertNull(activeEquipment.getLocation(), "Facility location reference should be cleared upon retirement");
        assertNull(activeEquipment.getRoomLocation(), "Room location should be cleared upon retirement");
        assertNull(activeEquipment.getWardLocation(), "Ward location should be cleared upon retirement");
    }

    @Test
    @DisplayName("completeAction - Disposal clears location and room/ward details")
    void completeAction_Disposal_ClearsLocationDetails() {
        EquipmentLifecycleAction action = EquipmentLifecycleAction.builder()
                .id(22L)
                .equipment(activeEquipment)
                .hospital(hospital)
                .actionType(EquipmentLifecycleActionType.DISPOSAL)
                .status(EquipmentLifecycleStatus.APPROVED)
                .approvedBy(USERNAME)
                .build();

        when(userRepository.findByUsername(USERNAME)).thenReturn(Optional.of(user));
        when(hospitalRepository.findByUserId(1L)).thenReturn(Optional.of(hospital));
        when(lifecycleRepository.findByIdAndHospitalId(22L, HOSPITAL_ID)).thenReturn(Optional.of(action));
        when(lifecycleRepository.save(any(EquipmentLifecycleAction.class))).thenAnswer(i -> i.getArgument(0));
        when(equipmentRepository.save(any(Equipment.class))).thenAnswer(i -> i.getArgument(0));

        EquipmentLifecycleActionResponse response = lifecycleService.completeAction(22L, USERNAME);

        assertNotNull(response);
        assertEquals(EquipmentLifecycleStatus.COMPLETED, response.getStatus());
        assertEquals(EquipmentStatus.DISPOSED, activeEquipment.getStatus());
        assertNull(activeEquipment.getLocation(), "Facility location reference should be cleared upon disposal action");
        assertNull(activeEquipment.getRoomLocation(), "Room location should be cleared upon disposal action");
        assertNull(activeEquipment.getWardLocation(), "Ward location should be cleared upon disposal action");
    }

    @Test
    @DisplayName("completeAction - Replacement clears location and room/ward details")
    void completeAction_Replacement_ClearsLocationDetails() {
        Equipment replacementEquipment = Equipment.builder()
                .id(501L)
                .equipmentCode("EQ-501")
                .name("Ventilator v2")
                .hospital(hospital)
                .status(EquipmentStatus.ACTIVE)
                .build();

        EquipmentLifecycleAction action = EquipmentLifecycleAction.builder()
                .id(21L)
                .equipment(activeEquipment)
                .replacementEquipment(replacementEquipment)
                .hospital(hospital)
                .actionType(EquipmentLifecycleActionType.REPLACEMENT)
                .status(EquipmentLifecycleStatus.APPROVED)
                .approvedBy(USERNAME)
                .build();

        when(userRepository.findByUsername(USERNAME)).thenReturn(Optional.of(user));
        when(hospitalRepository.findByUserId(1L)).thenReturn(Optional.of(hospital));
        when(lifecycleRepository.findByIdAndHospitalId(21L, HOSPITAL_ID)).thenReturn(Optional.of(action));
        when(lifecycleRepository.save(any(EquipmentLifecycleAction.class))).thenAnswer(i -> i.getArgument(0));
        when(equipmentRepository.save(any(Equipment.class))).thenAnswer(i -> i.getArgument(0));

        EquipmentLifecycleActionResponse response = lifecycleService.completeAction(21L, USERNAME);

        assertNotNull(response);
        assertEquals(EquipmentLifecycleStatus.COMPLETED, response.getStatus());
        assertEquals(EquipmentStatus.RETIRED, activeEquipment.getStatus());
        assertEquals(replacementEquipment, activeEquipment.getReplacementEquipment());
        assertNull(activeEquipment.getLocation(), "Facility location reference should be cleared upon replacement");
        assertNull(activeEquipment.getRoomLocation(), "Room location should be cleared upon replacement");
        assertNull(activeEquipment.getWardLocation(), "Ward location should be cleared upon replacement");
    }

    @Test
    @DisplayName("deleteLocation - Allows deletion when countByLocationId returns 0 for active assets")
    void deleteLocation_SucceedsWhenNoLiveAssetsAssigned() {
        when(userRepository.findByUsername(USERNAME)).thenReturn(Optional.of(user));
        when(hospitalRepository.findByUserId(1L)).thenReturn(Optional.of(hospital));
        when(facilityLocationRepository.findById(LOCATION_ID)).thenReturn(Optional.of(location));
        when(facilityLocationRepository.countByParentId(LOCATION_ID)).thenReturn(0L);
        when(equipmentRepository.countByLocationId(LOCATION_ID)).thenReturn(0L);

        assertDoesNotThrow(() -> locationService.deleteLocation(LOCATION_ID, USERNAME));

        verify(equipmentRepository).clearLocationReference(LOCATION_ID);
        verify(facilityLocationRepository).delete(location);
    }

    @Test
    @DisplayName("deleteLocation - Fails when active equipment is currently assigned")
    void deleteLocation_FailsWhenActiveAssetsAreAssigned() {
        when(userRepository.findByUsername(USERNAME)).thenReturn(Optional.of(user));
        when(hospitalRepository.findByUserId(1L)).thenReturn(Optional.of(hospital));
        when(facilityLocationRepository.findById(LOCATION_ID)).thenReturn(Optional.of(location));
        when(facilityLocationRepository.countByParentId(LOCATION_ID)).thenReturn(0L);
        when(equipmentRepository.countByLocationId(LOCATION_ID)).thenReturn(2L);

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> locationService.deleteLocation(LOCATION_ID, USERNAME)
        );

        assertTrue(exception.getMessage().contains("2 asset(s) are currently assigned to this location"));
        verify(facilityLocationRepository, never()).delete(any());
    }
}

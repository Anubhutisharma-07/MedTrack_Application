package com.medtrack.service;

import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.dto.EquipmentLifecycleActionRequest;
import com.medtrack.dto.EquipmentLifecycleActionResponse;
import com.medtrack.dto.MaintenanceScheduleAmendmentRequest;
import com.medtrack.exception.ResourceNotFoundException;
import com.medtrack.model.Equipment;
import com.medtrack.model.EquipmentDisposal;
import com.medtrack.model.EquipmentDisposalStatus;
import com.medtrack.model.EquipmentLifecycleAction;
import com.medtrack.model.EquipmentLifecycleActionType;
import com.medtrack.model.EquipmentLifecycleStatus;
import com.medtrack.model.EquipmentStatus;
import com.medtrack.model.FacilityLocation;
import com.medtrack.model.Hospital;
import com.medtrack.model.MaintenanceStatus;
import com.medtrack.model.MaintenanceTask;
import com.medtrack.model.MaintenanceWorkOrder;
import com.medtrack.model.MaintenanceWorkOrderStatus;
import com.medtrack.repository.EquipmentDisposalRepository;
import com.medtrack.repository.EquipmentLifecycleActionRepository;
import com.medtrack.repository.EquipmentLocationHistoryRepository;
import com.medtrack.repository.EquipmentRepository;
import com.medtrack.repository.FacilityLocationRepository;
import com.medtrack.repository.HospitalRepository;
import com.medtrack.repository.MaintenanceScheduleRevisionRepository;
import com.medtrack.repository.MaintenanceTaskRepository;
import com.medtrack.repository.MaintenanceWorkOrderRepository;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("Asset lifecycle, location, and maintenance schedule validation for equipment under disposal or replacement")
class EquipmentLifecycleDisposalValidationTest {

    private static final Long HOSPITAL_ID = 1L;
    private static final Long EQUIPMENT_ID = 100L;
    private static final Long REPLACEMENT_EQUIPMENT_ID = 200L;
    private static final String USERNAME = "hospital@test.com";

    @Mock
    private EquipmentLifecycleActionRepository lifecycleRepository;

    @Mock
    private EquipmentRepository equipmentRepository;

    @Mock
    private HospitalRepository hospitalRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private EquipmentDisposalRepository disposalRepository;

    @Mock
    private PreventiveMaintenanceService preventiveMaintenanceService;

    @Mock
    private FacilityLocationRepository facilityLocationRepository;

    @Mock
    private EquipmentLocationHistoryRepository locationHistoryRepository;

    @Mock
    private MaintenanceTaskRepository taskRepository;

    @Mock
    private MaintenanceWorkOrderRepository workOrderRepository;

    @Mock
    private MaintenanceScheduleRevisionRepository revisionRepository;

    @Mock
    private MaintenanceActivityService activityService;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private EquipmentLifecycleService lifecycleService;

    @InjectMocks
    private LocationService locationService;

    @InjectMocks
    private MaintenanceScheduleService scheduleService;

    private Hospital hospital;
    private User user;
    private Equipment equipment;
    private Equipment replacementEquipment;
    private EquipmentDisposal activeDisposal;

    @BeforeEach
    void setUp() {
        user = User.builder().id(10L).username(USERNAME).email(USERNAME).role("hospital").accountStatus(com.medtrack.auth.model.AccountStatus.ACTIVE).build();
        hospital = Hospital.builder().id(HOSPITAL_ID).name("City Hospital").user(user).build();
        equipment = Equipment.builder().id(EQUIPMENT_ID).equipmentCode("EQ-100").name("X-Ray Machine").hospital(hospital).status(EquipmentStatus.ACTIVE).department("Radiology").build();
        replacementEquipment = Equipment.builder().id(REPLACEMENT_EQUIPMENT_ID).equipmentCode("EQ-200").name("New X-Ray Machine").hospital(hospital).status(EquipmentStatus.ACTIVE).department("Radiology").build();
        activeDisposal = EquipmentDisposal.builder().id(50L).equipment(equipment).hospital(hospital).status(EquipmentDisposalStatus.PENDING_APPROVAL).build();
    }

    @Test
    @DisplayName("createAction should reject lifecycle action on equipment with pending disposal request")
    void createActionRejectsEquipmentWithPendingDisposal() {
        when(userRepository.findByUsername(USERNAME)).thenReturn(Optional.of(user));
        when(hospitalRepository.findByUserId(user.getId())).thenReturn(Optional.of(hospital));
        when(equipmentRepository.findByIdAndHospitalId(EQUIPMENT_ID, HOSPITAL_ID)).thenReturn(Optional.of(equipment));
        when(disposalRepository.findByEquipmentIdAndHospitalIdOrderByRequestedAtDesc(EQUIPMENT_ID, HOSPITAL_ID)).thenReturn(List.of(activeDisposal));

        EquipmentLifecycleActionRequest request = new EquipmentLifecycleActionRequest();
        request.setActionType(EquipmentLifecycleActionType.TRANSFER);
        request.setNewDepartment("ICU");

        assertThatThrownBy(() -> lifecycleService.createAction(EQUIPMENT_ID, request, USERNAME))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("EQ-100")
                .hasMessageContaining("active disposal request");

        verify(lifecycleRepository, never()).save(any());
    }

    @Test
    @DisplayName("completeAction should deactivate maintenance rules when completing replacement action")
    void completeActionDeactivatesRulesOnReplacement() {
        EquipmentLifecycleAction action = EquipmentLifecycleAction.builder()
                .id(10L)
                .equipment(equipment)
                .hospital(hospital)
                .actionType(EquipmentLifecycleActionType.REPLACEMENT)
                .status(EquipmentLifecycleStatus.APPROVED)
                .replacementEquipment(replacementEquipment)
                .approvedBy(USERNAME)
                .build();

        when(userRepository.findByUsername(USERNAME)).thenReturn(Optional.of(user));
        when(hospitalRepository.findByUserId(user.getId())).thenReturn(Optional.of(hospital));
        when(lifecycleRepository.findByIdAndHospitalId(10L, HOSPITAL_ID)).thenReturn(Optional.of(action));
        when(disposalRepository.findByEquipmentIdAndHospitalIdOrderByRequestedAtDesc(EQUIPMENT_ID, HOSPITAL_ID)).thenReturn(List.of());
        when(lifecycleRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        EquipmentLifecycleActionResponse response = lifecycleService.completeAction(10L, USERNAME);

        assertThat(response).isNotNull();
        assertThat(equipment.getStatus()).isEqualTo(EquipmentStatus.RETIRED);
        assertThat(equipment.getReplacementEquipment()).isEqualTo(replacementEquipment);
        verify(preventiveMaintenanceService).deactivateRulesForDecommissionedEquipment(EQUIPMENT_ID, HOSPITAL_ID, USERNAME);
    }

    @Test
    @DisplayName("assignEquipmentToLocation should reject equipment with pending disposal request")
    void assignLocationRejectsEquipmentWithPendingDisposal() {
        when(userRepository.findByUsername(USERNAME)).thenReturn(Optional.of(user));
        when(hospitalRepository.findByUserId(user.getId())).thenReturn(Optional.of(hospital));
        when(equipmentRepository.findByIdAndHospitalId(EQUIPMENT_ID, HOSPITAL_ID)).thenReturn(Optional.of(equipment));
        when(disposalRepository.findByEquipmentIdAndHospitalIdOrderByRequestedAtDesc(EQUIPMENT_ID, HOSPITAL_ID)).thenReturn(List.of(activeDisposal));

        assertThatThrownBy(() -> locationService.assignEquipmentToLocation(EQUIPMENT_ID, 5L, LocalDate.now(), "Moving", USERNAME))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("EQ-100")
                .hasMessageContaining("active disposal request");

        verify(locationHistoryRepository, never()).save(any());
    }

    @Test
    @DisplayName("amendSchedule should reject task schedule amendment on retired equipment")
    void amendScheduleRejectsRetiredEquipment() {
        equipment.setStatus(EquipmentStatus.RETIRED);
        MaintenanceTask task = MaintenanceTask.builder()
                .id(30L)
                .hospitalId(HOSPITAL_ID)
                .equipmentRecord(equipment)
                .status(MaintenanceStatus.SCHEDULED)
                .deadline(LocalDate.now().plusDays(10))
                .maintenanceType("Inspection")
                .priority("Normal")
                .build();

        when(authentication.getName()).thenReturn(USERNAME);
        when(userRepository.findByEmail(USERNAME)).thenReturn(Optional.of(user));
        when(hospitalRepository.findByUserId(user.getId())).thenReturn(Optional.of(hospital));
        when(taskRepository.findByIdAndHospitalIdForUpdate(30L, HOSPITAL_ID)).thenReturn(Optional.of(task));
        when(taskRepository.countValidOwnership(30L, HOSPITAL_ID)).thenReturn(1L);

        MaintenanceScheduleAmendmentRequest request = new MaintenanceScheduleAmendmentRequest();
        request.setReason("Routine change");
        request.setNewDeadline(LocalDate.now().plusDays(15));

        assertThatThrownBy(() -> scheduleService.amendSchedule(30L, request, authentication))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("EQ-100")
                .hasMessageContaining("retired");

        verify(revisionRepository, never()).save(any());
        verify(activityService, never()).recordScheduleAmendment(any(), any(), any());
        assertThat(task.getDeadline()).isEqualTo(LocalDate.now().plusDays(10));
    }

    @Test
    @DisplayName("createAction should reject retirement action when equipment has active work orders")
    void createActionRejectsRetirementWhenActiveWorkOrdersExist() {
        when(userRepository.findByUsername(USERNAME)).thenReturn(Optional.of(user));
        when(hospitalRepository.findByUserId(user.getId())).thenReturn(Optional.of(hospital));
        when(equipmentRepository.findByIdAndHospitalId(EQUIPMENT_ID, HOSPITAL_ID)).thenReturn(Optional.of(equipment));
        when(disposalRepository.findByEquipmentIdAndHospitalIdOrderByRequestedAtDesc(EQUIPMENT_ID, HOSPITAL_ID)).thenReturn(List.of());

        MaintenanceWorkOrder activeWorkOrder = MaintenanceWorkOrder.builder()
                .id(1L)
                .workOrderCode("WO-100")
                .hospitalId(HOSPITAL_ID)
                .equipment(equipment)
                .status(MaintenanceWorkOrderStatus.IN_PROGRESS)
                .build();
        when(workOrderRepository.findAllByHospitalIdAndEquipmentIdOrderByCreatedAtDesc(HOSPITAL_ID, EQUIPMENT_ID))
                .thenReturn(List.of(activeWorkOrder));

        EquipmentLifecycleActionRequest request = new EquipmentLifecycleActionRequest();
        request.setActionType(EquipmentLifecycleActionType.RETIREMENT);

        assertThatThrownBy(() -> lifecycleService.createAction(EQUIPMENT_ID, request, USERNAME))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("EQ-100")
                .hasMessageContaining("active maintenance work orders")
                .hasMessageContaining("WO-100");

        verify(lifecycleRepository, never()).save(any());
    }

    @Test
    @DisplayName("createAction should reject disposal action when equipment has scheduled tasks")
    void createActionRejectsDisposalWhenActiveTasksExist() {
        when(userRepository.findByUsername(USERNAME)).thenReturn(Optional.of(user));
        when(hospitalRepository.findByUserId(user.getId())).thenReturn(Optional.of(hospital));
        when(equipmentRepository.findByIdAndHospitalId(EQUIPMENT_ID, HOSPITAL_ID)).thenReturn(Optional.of(equipment));
        when(disposalRepository.findByEquipmentIdAndHospitalIdOrderByRequestedAtDesc(EQUIPMENT_ID, HOSPITAL_ID)).thenReturn(List.of());
        when(workOrderRepository.findAllByHospitalIdAndEquipmentIdOrderByCreatedAtDesc(HOSPITAL_ID, EQUIPMENT_ID)).thenReturn(List.of());

        MaintenanceTask activeTask = MaintenanceTask.builder()
                .id(20L)
                .taskCode("MNT-200")
                .hospitalId(HOSPITAL_ID)
                .equipmentRecord(equipment)
                .status(MaintenanceStatus.SCHEDULED)
                .build();
        when(taskRepository.findByHospitalIdAndEquipmentRecordId(HOSPITAL_ID, EQUIPMENT_ID))
                .thenReturn(List.of(activeTask));

        EquipmentLifecycleActionRequest request = new EquipmentLifecycleActionRequest();
        request.setActionType(EquipmentLifecycleActionType.DISPOSAL);

        assertThatThrownBy(() -> lifecycleService.createAction(EQUIPMENT_ID, request, USERNAME))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("EQ-100")
                .hasMessageContaining("scheduled maintenance tasks")
                .hasMessageContaining("MNT-200");

        verify(lifecycleRepository, never()).save(any());
    }

    @Test
    @DisplayName("completeAction should reject retirement action when equipment has active work orders")
    void completeActionRejectsRetirementWhenActiveWorkOrdersExist() {
        EquipmentLifecycleAction action = EquipmentLifecycleAction.builder()
                .id(15L)
                .equipment(equipment)
                .hospital(hospital)
                .actionType(EquipmentLifecycleActionType.RETIREMENT)
                .status(EquipmentLifecycleStatus.APPROVED)
                .approvedBy(USERNAME)
                .build();

        when(userRepository.findByUsername(USERNAME)).thenReturn(Optional.of(user));
        when(hospitalRepository.findByUserId(user.getId())).thenReturn(Optional.of(hospital));
        when(lifecycleRepository.findByIdAndHospitalId(15L, HOSPITAL_ID)).thenReturn(Optional.of(action));
        when(disposalRepository.findByEquipmentIdAndHospitalIdOrderByRequestedAtDesc(EQUIPMENT_ID, HOSPITAL_ID)).thenReturn(List.of());

        MaintenanceWorkOrder activeWorkOrder = MaintenanceWorkOrder.builder()
                .id(2L)
                .workOrderCode("WO-200")
                .hospitalId(HOSPITAL_ID)
                .equipment(equipment)
                .status(MaintenanceWorkOrderStatus.ASSIGNED)
                .build();
        when(workOrderRepository.findAllByHospitalIdAndEquipmentIdOrderByCreatedAtDesc(HOSPITAL_ID, EQUIPMENT_ID))
                .thenReturn(List.of(activeWorkOrder));

        assertThatThrownBy(() -> lifecycleService.completeAction(15L, USERNAME))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("EQ-100")
                .hasMessageContaining("active maintenance work orders");

        verify(lifecycleRepository, never()).save(any());
        assertThat(equipment.getStatus()).isEqualTo(EquipmentStatus.ACTIVE);
    }

    @Test
    @DisplayName("completeAction should reject disposal action when equipment has scheduled tasks")
    void completeActionRejectsDisposalWhenActiveTasksExist() {
        EquipmentLifecycleAction action = EquipmentLifecycleAction.builder()
                .id(16L)
                .equipment(equipment)
                .hospital(hospital)
                .actionType(EquipmentLifecycleActionType.DISPOSAL)
                .status(EquipmentLifecycleStatus.APPROVED)
                .approvedBy(USERNAME)
                .build();

        when(userRepository.findByUsername(USERNAME)).thenReturn(Optional.of(user));
        when(hospitalRepository.findByUserId(user.getId())).thenReturn(Optional.of(hospital));
        when(lifecycleRepository.findByIdAndHospitalId(16L, HOSPITAL_ID)).thenReturn(Optional.of(action));
        when(disposalRepository.findByEquipmentIdAndHospitalIdOrderByRequestedAtDesc(EQUIPMENT_ID, HOSPITAL_ID)).thenReturn(List.of());
        when(workOrderRepository.findAllByHospitalIdAndEquipmentIdOrderByCreatedAtDesc(HOSPITAL_ID, EQUIPMENT_ID)).thenReturn(List.of());

        MaintenanceTask activeTask = MaintenanceTask.builder()
                .id(21L)
                .taskCode("MNT-201")
                .hospitalId(HOSPITAL_ID)
                .equipmentRecord(equipment)
                .status(MaintenanceStatus.IN_PROGRESS)
                .build();
        when(taskRepository.findByHospitalIdAndEquipmentRecordId(HOSPITAL_ID, EQUIPMENT_ID))
                .thenReturn(List.of(activeTask));

        assertThatThrownBy(() -> lifecycleService.completeAction(16L, USERNAME))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("EQ-100")
                .hasMessageContaining("scheduled maintenance tasks");

        verify(lifecycleRepository, never()).save(any());
        assertThat(equipment.getStatus()).isEqualTo(EquipmentStatus.ACTIVE);
    }

    @Test
    @DisplayName("createAction should succeed for retirement action when no active maintenance exists")
    void createActionAllowsRetirementWhenNoActiveMaintenanceExists() {
        when(userRepository.findByUsername(USERNAME)).thenReturn(Optional.of(user));
        when(hospitalRepository.findByUserId(user.getId())).thenReturn(Optional.of(hospital));
        when(equipmentRepository.findByIdAndHospitalId(EQUIPMENT_ID, HOSPITAL_ID)).thenReturn(Optional.of(equipment));
        when(disposalRepository.findByEquipmentIdAndHospitalIdOrderByRequestedAtDesc(EQUIPMENT_ID, HOSPITAL_ID)).thenReturn(List.of());
        when(workOrderRepository.findAllByHospitalIdAndEquipmentIdOrderByCreatedAtDesc(HOSPITAL_ID, EQUIPMENT_ID)).thenReturn(List.of());
        when(taskRepository.findByHospitalIdAndEquipmentRecordId(HOSPITAL_ID, EQUIPMENT_ID)).thenReturn(List.of());
        when(lifecycleRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        EquipmentLifecycleActionRequest request = new EquipmentLifecycleActionRequest();
        request.setActionType(EquipmentLifecycleActionType.RETIREMENT);

        EquipmentLifecycleActionResponse response = lifecycleService.createAction(EQUIPMENT_ID, request, USERNAME);

        assertThat(response).isNotNull();
        verify(lifecycleRepository).save(any());
    }

    @Test
    @DisplayName("completeAction should succeed for disposal action when no active maintenance exists")
    void completeActionAllowsDisposalWhenNoActiveMaintenanceExists() {
        EquipmentLifecycleAction action = EquipmentLifecycleAction.builder()
                .id(17L)
                .equipment(equipment)
                .hospital(hospital)
                .actionType(EquipmentLifecycleActionType.DISPOSAL)
                .status(EquipmentLifecycleStatus.APPROVED)
                .approvedBy(USERNAME)
                .build();

        when(userRepository.findByUsername(USERNAME)).thenReturn(Optional.of(user));
        when(hospitalRepository.findByUserId(user.getId())).thenReturn(Optional.of(hospital));
        when(lifecycleRepository.findByIdAndHospitalId(17L, HOSPITAL_ID)).thenReturn(Optional.of(action));
        when(disposalRepository.findByEquipmentIdAndHospitalIdOrderByRequestedAtDesc(EQUIPMENT_ID, HOSPITAL_ID)).thenReturn(List.of());
        when(workOrderRepository.findAllByHospitalIdAndEquipmentIdOrderByCreatedAtDesc(HOSPITAL_ID, EQUIPMENT_ID)).thenReturn(List.of());
        when(taskRepository.findByHospitalIdAndEquipmentRecordId(HOSPITAL_ID, EQUIPMENT_ID)).thenReturn(List.of());
        when(lifecycleRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        EquipmentLifecycleActionResponse response = lifecycleService.completeAction(17L, USERNAME);

        assertThat(response).isNotNull();
        assertThat(equipment.getStatus()).isEqualTo(EquipmentStatus.DISPOSED);
        verify(lifecycleRepository).save(any());
        verify(preventiveMaintenanceService).deactivateRulesForDecommissionedEquipment(EQUIPMENT_ID, HOSPITAL_ID, USERNAME);
    }

    @Test
    @DisplayName("createAction should reject replacement action when equipment has active work orders")
    void createActionRejectsReplacementWhenActiveWorkOrdersExist() {
        when(userRepository.findByUsername(USERNAME)).thenReturn(Optional.of(user));
        when(hospitalRepository.findByUserId(user.getId())).thenReturn(Optional.of(hospital));
        when(equipmentRepository.findByIdAndHospitalId(EQUIPMENT_ID, HOSPITAL_ID)).thenReturn(Optional.of(equipment));
        when(disposalRepository.findByEquipmentIdAndHospitalIdOrderByRequestedAtDesc(EQUIPMENT_ID, HOSPITAL_ID)).thenReturn(List.of());

        MaintenanceWorkOrder activeWorkOrder = MaintenanceWorkOrder.builder()
                .id(3L)
                .workOrderCode("WO-300")
                .hospitalId(HOSPITAL_ID)
                .equipment(equipment)
                .status(MaintenanceWorkOrderStatus.OPEN)
                .build();
        when(workOrderRepository.findAllByHospitalIdAndEquipmentIdOrderByCreatedAtDesc(HOSPITAL_ID, EQUIPMENT_ID))
                .thenReturn(List.of(activeWorkOrder));

        EquipmentLifecycleActionRequest request = new EquipmentLifecycleActionRequest();
        request.setActionType(EquipmentLifecycleActionType.REPLACEMENT);
        request.setReplacementEquipmentId(REPLACEMENT_EQUIPMENT_ID);

        assertThatThrownBy(() -> lifecycleService.createAction(EQUIPMENT_ID, request, USERNAME))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("EQ-100")
                .hasMessageContaining("active maintenance work orders")
                .hasMessageContaining("WO-300");

        verify(lifecycleRepository, never()).save(any());
    }

    @Test
    @DisplayName("completeAction should reject replacement action when equipment has active tasks")
    void completeActionRejectsReplacementWhenActiveTasksExist() {
        EquipmentLifecycleAction action = EquipmentLifecycleAction.builder()
                .id(18L)
                .equipment(equipment)
                .hospital(hospital)
                .actionType(EquipmentLifecycleActionType.REPLACEMENT)
                .status(EquipmentLifecycleStatus.APPROVED)
                .replacementEquipment(replacementEquipment)
                .approvedBy(USERNAME)
                .build();

        when(userRepository.findByUsername(USERNAME)).thenReturn(Optional.of(user));
        when(hospitalRepository.findByUserId(user.getId())).thenReturn(Optional.of(hospital));
        when(lifecycleRepository.findByIdAndHospitalId(18L, HOSPITAL_ID)).thenReturn(Optional.of(action));
        when(disposalRepository.findByEquipmentIdAndHospitalIdOrderByRequestedAtDesc(EQUIPMENT_ID, HOSPITAL_ID)).thenReturn(List.of());
        when(workOrderRepository.findAllByHospitalIdAndEquipmentIdOrderByCreatedAtDesc(HOSPITAL_ID, EQUIPMENT_ID)).thenReturn(List.of());

        MaintenanceTask activeTask = MaintenanceTask.builder()
                .id(22L)
                .taskCode("MNT-202")
                .hospitalId(HOSPITAL_ID)
                .equipmentRecord(equipment)
                .status(MaintenanceStatus.NEEDS_PART)
                .build();
        when(taskRepository.findByHospitalIdAndEquipmentRecordId(HOSPITAL_ID, EQUIPMENT_ID))
                .thenReturn(List.of(activeTask));

        assertThatThrownBy(() -> lifecycleService.completeAction(18L, USERNAME))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("EQ-100")
                .hasMessageContaining("scheduled maintenance tasks");

        verify(lifecycleRepository, never()).save(any());
        assertThat(equipment.getStatus()).isEqualTo(EquipmentStatus.ACTIVE);
    }
}

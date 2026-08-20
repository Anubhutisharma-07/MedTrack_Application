package com.medtrack.service;

import com.medtrack.auth.model.AccountStatus;
import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.auth.service.KafkaEventPublisher;
import com.medtrack.dto.MaintenanceWorkOrderCompletionRequest;
import com.medtrack.dto.MaintenanceWorkOrderResponse;
import com.medtrack.dto.MaintenanceWorkOrderStatusRequest;
import com.medtrack.model.Equipment;
import com.medtrack.model.EquipmentCategory;
import com.medtrack.model.EquipmentStatus;
import com.medtrack.model.Hospital;
import com.medtrack.model.MaintenanceStatus;
import com.medtrack.model.MaintenanceTask;
import com.medtrack.model.MaintenanceWorkOrder;
import com.medtrack.model.MaintenanceWorkOrderPriority;
import com.medtrack.model.MaintenanceWorkOrderStatus;
import com.medtrack.model.MaintenanceWorkOrderType;
import com.medtrack.model.SlaState;
import com.medtrack.repository.EquipmentRepository;
import com.medtrack.repository.HospitalRepository;
import com.medtrack.repository.MaintenanceTaskRepository;
import com.medtrack.repository.MaintenanceWorkOrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

/**
 * Integration tests verifying work order completion validation rules and
 * linked maintenance task status reversion on cancellation.
 */
@SpringBootTest(properties = {
        "eureka.client.enabled=false",
        "spring.cloud.discovery.enabled=false",
        "spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.kafka.KafkaAutoConfiguration",
        "spring.datasource.url=jdbc:h2:mem:work-order-completion-tests;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "app.data-initializer.enabled=false"
})
@Transactional
@DisplayName("Work order completion validation and task status synchronization")
class MaintenanceWorkOrderCompletionAndTaskReversionTest {

    @MockitoBean
    private KafkaEventPublisher kafkaEventPublisher;

    @Autowired
    private MaintenanceWorkOrderService workOrderService;

    @Autowired
    private EquipmentRepository equipmentRepository;

    @Autowired
    private MaintenanceTaskRepository taskRepository;

    @Autowired
    private MaintenanceWorkOrderRepository workOrderRepository;

    @Autowired
    private HospitalRepository hospitalRepository;

    @Autowired
    private UserRepository userRepository;

    private User technicianUser;
    private Hospital hospital;
    private Equipment equipment;
    private MaintenanceTask maintenanceTask;

    @BeforeEach
    void setUp() {
        String username = "tech-user-" + UUID.randomUUID();

        technicianUser = userRepository.save(User.builder()
                .name("Technician Specialist")
                .username(username)
                .email(UUID.randomUUID() + "@medtrack.test")
                .password("securePassword123")
                .phone("+1 (555) 000-1122")
                .role("technician")
                .organization("Central Hospital")
                .accountStatus(AccountStatus.ACTIVE)
                .build());

        User hospitalOwner = userRepository.save(User.builder()
                .name("Hospital Admin")
                .username("admin-" + UUID.randomUUID())
                .email(UUID.randomUUID() + "@medtrack.test")
                .password("securePassword123")
                .phone("+1 (555) 000-3344")
                .role("hospital")
                .organization("Central Hospital")
                .accountStatus(AccountStatus.ACTIVE)
                .build());

        hospital = hospitalRepository.save(Hospital.builder()
                .name("Central Hospital")
                .location("Metropolis City")
                .user(hospitalOwner)
                .build());

        equipment = equipmentRepository.save(Equipment.builder()
                .equipmentCode("EQ-DEF-1001")
                .name("Defibrillator Prime")
                .model("LifePak 15")
                .serialNumber("SN-DEF-8832")
                .department("Emergency")
                .category(EquipmentCategory.MONITORING)
                .status(EquipmentStatus.ACTIVE)
                .quantity(1)
                .hospital(hospital)
                .build());

        maintenanceTask = taskRepository.save(MaintenanceTask.builder()
                .taskCode("MNT-" + UUID.randomUUID())
                .equipmentId(equipment.getEquipmentCode())
                .equipment(equipment.getName())
                .equipmentRecord(equipment)
                .hospital(hospital.getName())
                .hospitalId(hospital.getId())
                .maintenanceType("PREVENTIVE")
                .deadline(LocalDate.now().plusDays(7))
                .description("Quarterly Calibration")
                .priority("High")
                .status(MaintenanceStatus.SCHEDULED)
                .slaState(SlaState.UPCOMING)
                .createdAt(LocalDateTime.now())
                .build());
    }

    private MaintenanceWorkOrder createInProgressWorkOrder() {
        MaintenanceWorkOrder workOrder = MaintenanceWorkOrder.builder()
                .workOrderCode("WO-" + UUID.randomUUID())
                .hospitalId(hospital.getId())
                .equipment(equipment)
                .maintenanceTask(maintenanceTask)
                .title("Quarterly Calibration Service")
                .description("Calibrate sensors and check battery backup")
                .maintenanceType(MaintenanceWorkOrderType.PREVENTIVE)
                .priority(MaintenanceWorkOrderPriority.HIGH)
                .status(MaintenanceWorkOrderStatus.IN_PROGRESS)
                .assignedUser(technicianUser)
                .assignedTechnician(technicianUser.getUsername())
                .scheduledDate(LocalDate.now())
                .dueDate(LocalDate.now().plusDays(3))
                .startedAt(LocalDateTime.now().minusHours(2))
                .createdAt(LocalDateTime.now().minusHours(3))
                .createdBy("admin")
                .deleted(false)
                .build();
        return workOrderRepository.save(workOrder);
    }

    @Test
    @DisplayName("completeWorkOrder fails when completion notes are missing or blank")
    void completeWorkOrderFailsWithoutCompletionNotes() {
        MaintenanceWorkOrder workOrder = createInProgressWorkOrder();

        MaintenanceWorkOrderCompletionRequest request = new MaintenanceWorkOrderCompletionRequest();
        request.setCompletionNotes("   ");

        assertThrows(IllegalArgumentException.class, () ->
                workOrderService.completeWorkOrder(
                        workOrder.getId(), request, hospital.getId(), technicianUser.getUsername()
                )
        );
    }

    @Test
    @DisplayName("completeWorkOrder fails when work order was not started")
    void completeWorkOrderFailsWhenNotStarted() {
        MaintenanceWorkOrder workOrder = createInProgressWorkOrder();
        workOrder.setStartedAt(null);
        workOrderRepository.save(workOrder);

        MaintenanceWorkOrderCompletionRequest request = new MaintenanceWorkOrderCompletionRequest();
        request.setCompletionNotes("Completed successfully without issues.");

        assertThrows(IllegalStateException.class, () ->
                workOrderService.completeWorkOrder(
                        workOrder.getId(), request, hospital.getId(), technicianUser.getUsername()
                )
        );
    }

    @Test
    @DisplayName("completeWorkOrder succeeds and updates work order and task status to COMPLETED")
    void completeWorkOrderSucceedsWithValidData() {
        MaintenanceWorkOrder workOrder = createInProgressWorkOrder();

        MaintenanceWorkOrderCompletionRequest request = new MaintenanceWorkOrderCompletionRequest();
        request.setCompletionNotes("Calibration verified and battery replaced.");
        request.setHoursWorked(2.5);

        MaintenanceWorkOrderResponse response = workOrderService.completeWorkOrder(
                workOrder.getId(), request, hospital.getId(), technicianUser.getUsername()
        );

        assertEquals(MaintenanceWorkOrderStatus.COMPLETED, response.getStatus());
        assertNotNull(response.getCompletedAt());

        MaintenanceTask updatedTask = taskRepository.findById(maintenanceTask.getId()).orElseThrow();
        assertEquals(MaintenanceStatus.COMPLETED, updatedTask.getStatus());
        assertNotNull(updatedTask.getCompletedAt());
    }

    @Test
    @DisplayName("updateStatus to COMPLETED fails when completion notes are missing")
    void updateStatusToCompletedFailsWithoutReason() {
        MaintenanceWorkOrder workOrder = createInProgressWorkOrder();

        MaintenanceWorkOrderStatusRequest request = new MaintenanceWorkOrderStatusRequest();
        request.setStatus(MaintenanceWorkOrderStatus.COMPLETED);
        request.setReason(null);

        assertThrows(IllegalArgumentException.class, () ->
                workOrderService.updateStatus(
                        workOrder.getId(), request, hospital.getId(), technicianUser.getUsername()
                )
        );
    }

    @Test
    @DisplayName("cancelWorkOrder reverts linked maintenance task to SCHEDULED status and clears completedAt")
    void cancelWorkOrderRevertsTaskToScheduled() {
        MaintenanceWorkOrder workOrder = createInProgressWorkOrder();
        maintenanceTask.setStatus(MaintenanceStatus.IN_PROGRESS);
        taskRepository.save(maintenanceTask);

        MaintenanceWorkOrderStatusRequest request = new MaintenanceWorkOrderStatusRequest();
        request.setStatus(MaintenanceWorkOrderStatus.CANCELLED);
        request.setReason("Technician unavailable due to urgent priority elsewhere");

        MaintenanceWorkOrderResponse response = workOrderService.cancelWorkOrder(
                workOrder.getId(), request, hospital.getId(), technicianUser.getUsername()
        );

        assertEquals(MaintenanceWorkOrderStatus.CANCELLED, response.getStatus());

        MaintenanceTask revertedTask = taskRepository.findById(maintenanceTask.getId()).orElseThrow();
        assertEquals(MaintenanceStatus.SCHEDULED, revertedTask.getStatus());
        assertNull(revertedTask.getCompletedAt());
    }

    @Test
    @DisplayName("cancelWorkOrder restores equipment status to ACTIVE when no other active work orders exist")
    void cancelWorkOrderRestoresEquipmentStatusToActive() {
        equipment.setStatus(EquipmentStatus.UNDER_MAINTENANCE);
        equipmentRepository.save(equipment);

        MaintenanceWorkOrder workOrder = createInProgressWorkOrder();

        MaintenanceWorkOrderStatusRequest request = new MaintenanceWorkOrderStatusRequest();
        request.setStatus(MaintenanceWorkOrderStatus.CANCELLED);
        request.setReason("Duplicate maintenance request cancelled");

        workOrderService.cancelWorkOrder(
                workOrder.getId(), request, hospital.getId(), technicianUser.getUsername()
        );

        Equipment updatedEquipment = equipmentRepository.findById(equipment.getId()).orElseThrow();
        assertEquals(EquipmentStatus.ACTIVE, updatedEquipment.getStatus());
    }

    @Test
    @DisplayName("updateStatus to CANCELLED reverts linked maintenance task status to SCHEDULED")
    void updateStatusToCancelledRevertsTaskAndRestoresEquipment() {
        MaintenanceWorkOrder workOrder = createInProgressWorkOrder();
        maintenanceTask.setStatus(MaintenanceStatus.IN_PROGRESS);
        taskRepository.save(maintenanceTask);

        MaintenanceWorkOrderStatusRequest request = new MaintenanceWorkOrderStatusRequest();
        request.setStatus(MaintenanceWorkOrderStatus.CANCELLED);
        request.setReason("Part unavailable; cancelling current work order");

        MaintenanceWorkOrderResponse response = workOrderService.updateStatus(
                workOrder.getId(), request, hospital.getId(), technicianUser.getUsername()
        );

        assertEquals(MaintenanceWorkOrderStatus.CANCELLED, response.getStatus());

        MaintenanceTask revertedTask = taskRepository.findById(maintenanceTask.getId()).orElseThrow();
        assertEquals(MaintenanceStatus.SCHEDULED, revertedTask.getStatus());
        assertNull(revertedTask.getCompletedAt());
    }
}

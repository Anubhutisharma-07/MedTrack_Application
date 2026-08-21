package com.medtrack.service;
import org.mockito.Spy;

import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.dto.MaintenanceWorkOrderAssignmentRequest;
import com.medtrack.dto.MaintenanceWorkOrderCompletionRequest;
import com.medtrack.dto.MaintenanceWorkOrderRequest;
import com.medtrack.dto.MaintenanceWorkOrderResponse;
import com.medtrack.model.Equipment;
import com.medtrack.model.EquipmentStatus;
import com.medtrack.model.Hospital;
import com.medtrack.model.MaintenanceStatus;
import com.medtrack.model.MaintenanceTask;
import com.medtrack.model.MaintenanceWorkOrder;
import com.medtrack.model.MaintenanceWorkOrderPriority;
import com.medtrack.model.MaintenanceWorkOrderStatus;
import com.medtrack.model.MaintenanceWorkOrderType;
import com.medtrack.repository.EquipmentDisposalRepository;
import com.medtrack.repository.EquipmentRepository;
import com.medtrack.repository.MaintenanceTaskRepository;
import com.medtrack.repository.MaintenanceWorkOrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MaintenanceWorkOrderServiceTest {

    @Mock
    private MaintenanceWorkOrderRepository workOrderRepository;

    @Mock
    private EquipmentRepository equipmentRepository;

    @Mock
    private MaintenanceTaskRepository maintenanceTaskRepository;

    @Mock
    private UserRepository userRepository;

    @Spy
    private MaintenanceWorkOrderValidator workOrderValidator;

    @Mock
    private SparePartService sparePartService;

    @Mock
    private com.medtrack.repository.EquipmentDisposalRepository disposalRepository;

    private MaintenanceWorkOrderService workOrderService;

    private Hospital hospital;

    private Equipment equipment;

    private final Long hospitalId = 1L;

    private final String username = "hospital@test.com";

    @BeforeEach
    void setUp() {
        workOrderService = new MaintenanceWorkOrderService(
                workOrderRepository,
                equipmentRepository,
                maintenanceTaskRepository,
                userRepository,
                workOrderValidator,
                disposalRepository,
                sparePartService
        );

        hospital = Hospital.builder()
                .id(hospitalId)
                .name("City General")
                .build();

        equipment = Equipment.builder()
                .id(100L)
                .equipmentCode("EQ-100")
                .name("MRI Scanner")
                .department("Radiology")
                .hospital(hospital)
                .build();
    }

    @Test
    void shouldCreateWorkOrderSuccessfully() {

        MaintenanceWorkOrderRequest request =
                MaintenanceWorkOrderRequest.builder()
                        .equipmentId(100L)
                        .title("MRI preventive maintenance")
                        .description("Routine inspection")
                        .maintenanceType(
                                MaintenanceWorkOrderType.PREVENTIVE
                        )
                        .priority(
                                MaintenanceWorkOrderPriority.HIGH
                        )
                        .scheduledDate(
                                LocalDate.now()
                        )
                        .dueDate(
                                LocalDate.now().plusDays(5)
                        )
                        .build();

        when(equipmentRepository.findById(100L))
                .thenReturn(Optional.of(equipment));

        when(workOrderRepository.existsByWorkOrderCode(any()))
                .thenReturn(false);

        when(workOrderRepository.save(any()))
                .thenAnswer(invocation ->
                        invocation.getArgument(0));

        MaintenanceWorkOrderResponse response =
                workOrderService.createWorkOrder(
                        request,
                        hospitalId,
                        username
                );

        assertNotNull(response);

        assertEquals(
                "MRI preventive maintenance",
                response.getTitle()
        );

        assertEquals(
                MaintenanceWorkOrderStatus.OPEN,
                response.getStatus()
        );

        assertEquals(
                100L,
                response.getEquipmentId()
        );

        verify(workOrderRepository)
                .save(any(MaintenanceWorkOrder.class));
    }

    @Test
    void shouldRejectWorkOrderWhenEquipmentDoesNotExist() {

        MaintenanceWorkOrderRequest request =
                MaintenanceWorkOrderRequest.builder()
                        .equipmentId(999L)
                        .title("Maintenance")
                        .maintenanceType(
                                MaintenanceWorkOrderType.PREVENTIVE
                        )
                        .priority(
                                MaintenanceWorkOrderPriority.MEDIUM
                        )
                        .build();

        when(equipmentRepository.findById(999L))
                .thenReturn(Optional.empty());

        assertThrows(
                jakarta.persistence.EntityNotFoundException.class,
                () -> workOrderService.createWorkOrder(
                        request,
                        hospitalId,
                        username
                )
        );

        verify(workOrderRepository, never())
                .save(any());
    }

    @Test
    void shouldAssignWorkOrderSuccessfully() {

        MaintenanceWorkOrder workOrder =
                buildWorkOrder(
                        MaintenanceWorkOrderStatus.OPEN
                );

        User technician = User.builder()
                .id(20L)
                .username("technician@test.com")
                .build();

        when(workOrderRepository
                .findByIdAndHospitalId(10L, hospitalId))
                .thenReturn(Optional.of(workOrder));

        when(userRepository.findById(20L))
                .thenReturn(Optional.of(technician));

        when(workOrderRepository.save(any()))
                .thenAnswer(invocation ->
                        invocation.getArgument(0));

        MaintenanceWorkOrderAssignmentRequest request =
                MaintenanceWorkOrderAssignmentRequest.builder()
                        .assignedUserId(20L)
                        .assignedTechnician(
                                "technician@test.com"
                        )
                        .build();

        MaintenanceWorkOrderResponse response =
                workOrderService.assignWorkOrder(
                        10L,
                        request,
                        hospitalId,
                        username
                );

        assertEquals(
                MaintenanceWorkOrderStatus.ASSIGNED,
                response.getStatus()
        );

        assertEquals(
                20L,
                response.getAssignedUserId()
        );
    }

    @Test
    void shouldStartAssignedWorkOrder() {

        MaintenanceWorkOrder workOrder =
                buildWorkOrder(
                        MaintenanceWorkOrderStatus.ASSIGNED
                );

        User technician = mock(User.class);

        workOrder.setAssignedUser(technician);

        when(workOrderRepository
                .findByIdAndHospitalId(10L, hospitalId))
                .thenReturn(Optional.of(workOrder));

        when(workOrderRepository.save(any()))
                .thenAnswer(invocation ->
                        invocation.getArgument(0));

        MaintenanceWorkOrderResponse response =
                workOrderService.startWorkOrder(
                        10L,
                        hospitalId,
                        username
                );

        assertEquals(
                MaintenanceWorkOrderStatus.IN_PROGRESS,
                response.getStatus()
        );

        assertNotNull(
                response.getStartedAt()
        );
    }

    @Test
    void shouldRejectStartingUnassignedWorkOrder() {

        MaintenanceWorkOrder workOrder =
                buildWorkOrder(
                        MaintenanceWorkOrderStatus.ASSIGNED
                );

        when(workOrderRepository
                .findByIdAndHospitalId(10L, hospitalId))
                .thenReturn(Optional.of(workOrder));

        assertThrows(
                IllegalStateException.class,
                () -> workOrderService.startWorkOrder(
                        10L,
                        hospitalId,
                        username
                )
        );

        verify(workOrderRepository, never())
                .save(any());
    }

    @Test
    void shouldCompleteInProgressWorkOrder() {

        MaintenanceWorkOrder workOrder =
                buildWorkOrder(
                        MaintenanceWorkOrderStatus.IN_PROGRESS
                );

        workOrder.setStartedAt(
                LocalDateTime.now().minusHours(2)
        );

        when(workOrderRepository
                .findByIdAndHospitalId(10L, hospitalId))
                .thenReturn(Optional.of(workOrder));

        when(workOrderRepository.save(any()))
                .thenAnswer(invocation ->
                        invocation.getArgument(0));

        MaintenanceWorkOrderCompletionRequest request =
                MaintenanceWorkOrderCompletionRequest.builder()
                        .completionNotes(
                                "Maintenance completed successfully"
                        )
                        .hoursWorked(2.0)
                        .partsUsed("Filter replacement")
                        .signature("technician-signature")
                        .build();

        MaintenanceWorkOrderResponse response =
                workOrderService.completeWorkOrder(
                        10L,
                        request,
                        hospitalId,
                        username
                );

        assertEquals(
                MaintenanceWorkOrderStatus.COMPLETED,
                response.getStatus()
        );

        assertNotNull(
                response.getCompletedAt()
        );

        assertEquals(
                2.0,
                response.getHoursWorked()
        );
    }

    @Test
    void shouldRejectCompletingNonInProgressWorkOrder() {

        MaintenanceWorkOrder workOrder =
                buildWorkOrder(
                        MaintenanceWorkOrderStatus.ASSIGNED
                );

        when(workOrderRepository
                .findByIdAndHospitalId(10L, hospitalId))
                .thenReturn(Optional.of(workOrder));
        doThrow(new IllegalStateException("Only IN_PROGRESS work orders can be completed"))
                .when(workOrderValidator).validateCompletion(eq(workOrder), any());

        MaintenanceWorkOrderCompletionRequest request =
                MaintenanceWorkOrderCompletionRequest.builder()
                        .completionNotes("Completed")
                        .build();

        assertThrows(
                IllegalStateException.class,
                () -> workOrderService.completeWorkOrder(
                        10L,
                        request,
                        hospitalId,
                        username
                )
        );

        verify(workOrderRepository, never())
                .save(any());
    }

    @Test
    void shouldRejectCancellingCompletedWorkOrder() {

        MaintenanceWorkOrder workOrder =
                buildWorkOrder(
                        MaintenanceWorkOrderStatus.COMPLETED
                );

        when(workOrderRepository
                .findByIdAndHospitalId(10L, hospitalId))
                .thenReturn(Optional.of(workOrder));

        var request =
                com.medtrack.dto.MaintenanceWorkOrderStatusRequest
                        .builder()
                        .status(
                                MaintenanceWorkOrderStatus.CANCELLED
                        )
                        .reason("Duplicate request")
                        .build();

        assertThrows(
                IllegalStateException.class,
                () -> workOrderService.cancelWorkOrder(
                        10L,
                        request,
                        hospitalId,
                        username
                )
        );

        verify(workOrderRepository, never())
                .save(any());
    }

    @Test
    void shouldValidateStatusTransition() {

        MaintenanceWorkOrder workOrder =
                buildWorkOrder(
                        MaintenanceWorkOrderStatus.COMPLETED
                );

        when(workOrderRepository
                .findByIdAndHospitalId(10L, hospitalId))
                .thenReturn(Optional.of(workOrder));

        var request =
                com.medtrack.dto.MaintenanceWorkOrderStatusRequest
                        .builder()
                        .status(
                                MaintenanceWorkOrderStatus.IN_PROGRESS
                        )
                        .build();

        assertThrows(
                IllegalStateException.class,
                () -> workOrderService.updateStatus(
                        10L,
                        request,
                        hospitalId,
                        username
                )
        );
    }

    @Test
    void shouldRejectDuplicateWorkOrderWhenActiveWorkOrderExistsForTask() {
        Long taskId = 50L;
        MaintenanceWorkOrderRequest request =
                MaintenanceWorkOrderRequest.builder()
                        .equipmentId(100L)
                        .maintenanceTaskId(taskId)
                        .title("Duplicate Work Order")
                        .maintenanceType(MaintenanceWorkOrderType.PREVENTIVE)
                        .priority(MaintenanceWorkOrderPriority.HIGH)
                        .build();

        MaintenanceTask task = MaintenanceTask.builder()
                .id(taskId)
                .hospitalId(hospitalId)
                .equipmentRecord(equipment)
                .status(MaintenanceStatus.SCHEDULED)
                .build();

        when(equipmentRepository.findById(100L))
                .thenReturn(Optional.of(equipment));

        when(maintenanceTaskRepository.findById(taskId))
                .thenReturn(Optional.of(task));

        when(workOrderRepository.existsByHospitalIdAndMaintenanceTaskIdAndStatusIn(
                eq(hospitalId), eq(taskId), anyList()))
                .thenReturn(true);

        doThrow(new IllegalArgumentException("An active work order already exists for maintenance task ID: " + taskId))
                .when(workOrderValidator).validateNoActiveWorkOrderForTask(true, taskId);

        assertThrows(
                IllegalArgumentException.class,
                () -> workOrderService.createWorkOrder(request, hospitalId, username)
        );
    }

    @Test
    void shouldSynchronizeLinkedTaskAndEquipmentStatusOnStartWorkOrder() {
        Long workOrderId = 10L;
        Long taskId = 50L;
        equipment.setStatus(EquipmentStatus.ACTIVE);

        MaintenanceTask task = MaintenanceTask.builder()
                .id(taskId)
                .hospitalId(hospitalId)
                .status(MaintenanceStatus.SCHEDULED)
                .build();

        User assignedUser = User.builder().id(5L).username("tech1").build();

        MaintenanceWorkOrder workOrder = buildWorkOrder(MaintenanceWorkOrderStatus.ASSIGNED);
        workOrder.setMaintenanceTask(task);
        workOrder.setAssignedUser(assignedUser);

        when(workOrderRepository.findByIdAndHospitalId(workOrderId, hospitalId))
                .thenReturn(Optional.of(workOrder));

        when(workOrderRepository.save(any(MaintenanceWorkOrder.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        MaintenanceWorkOrderResponse response = workOrderService.startWorkOrder(
                workOrderId, hospitalId, username
        );

        assertNotNull(response);
        assertEquals(MaintenanceWorkOrderStatus.IN_PROGRESS, response.getStatus());
        assertEquals(MaintenanceStatus.IN_PROGRESS, task.getStatus());
        assertEquals(EquipmentStatus.UNDER_MAINTENANCE, equipment.getStatus());

        verify(maintenanceTaskRepository).save(task);
        verify(equipmentRepository).save(equipment);
    }

    @Test
    void shouldSynchronizeLinkedTaskAndEquipmentStatusOnCompleteWorkOrder() {
        Long workOrderId = 10L;
        Long taskId = 50L;
        equipment.setStatus(EquipmentStatus.UNDER_MAINTENANCE);

        MaintenanceTask task = MaintenanceTask.builder()
                .id(taskId)
                .hospitalId(hospitalId)
                .status(MaintenanceStatus.IN_PROGRESS)
                .build();

        MaintenanceWorkOrder workOrder = buildWorkOrder(MaintenanceWorkOrderStatus.IN_PROGRESS);
        workOrder.setMaintenanceTask(task);
        workOrder.setStartedAt(LocalDateTime.now().minusHours(2));

        MaintenanceWorkOrderCompletionRequest completionRequest =
                MaintenanceWorkOrderCompletionRequest.builder()
                        .completionNotes("Completed maintenance successfully")
                        .hoursWorked(2.0)
                        .build();

        when(workOrderRepository.findByIdAndHospitalId(workOrderId, hospitalId))
                .thenReturn(Optional.of(workOrder));

        when(workOrderRepository.save(any(MaintenanceWorkOrder.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        when(workOrderRepository.countByHospitalIdAndEquipmentIdAndStatusIn(
                eq(hospitalId), eq(equipment.getId()), anyList()))
                .thenReturn(0L);

        MaintenanceWorkOrderResponse response = workOrderService.completeWorkOrder(
                workOrderId, completionRequest, hospitalId, username
        );

        assertNotNull(response);
        assertEquals(MaintenanceWorkOrderStatus.COMPLETED, response.getStatus());
        assertEquals(MaintenanceStatus.COMPLETED, task.getStatus());
        assertNotNull(task.getCompletedAt());
        assertEquals(EquipmentStatus.ACTIVE, equipment.getStatus());

        verify(maintenanceTaskRepository).save(task);
        verify(equipmentRepository).save(equipment);
    }

    @Test
    void shouldSynchronizeLinkedTaskStatusOnCancelWorkOrder() {
        Long workOrderId = 10L;
        Long taskId = 50L;
        MaintenanceTask task = MaintenanceTask.builder().id(taskId).hospitalId(hospitalId).status(MaintenanceStatus.IN_PROGRESS).build();
        MaintenanceWorkOrder workOrder = buildWorkOrder(MaintenanceWorkOrderStatus.IN_PROGRESS);
        workOrder.setMaintenanceTask(task);

        var cancelRequest = com.medtrack.dto.MaintenanceWorkOrderStatusRequest.builder().reason("Part unavailable").build();

        when(workOrderRepository.findByIdAndHospitalId(workOrderId, hospitalId)).thenReturn(Optional.of(workOrder));
        when(workOrderRepository.save(any(MaintenanceWorkOrder.class))).thenAnswer(inv -> inv.getArgument(0));
        when(workOrderRepository.countByHospitalIdAndEquipmentIdAndStatusIn(eq(hospitalId), eq(equipment.getId()), anyList())).thenReturn(0L);

        MaintenanceWorkOrderResponse response = workOrderService.cancelWorkOrder(workOrderId, cancelRequest, hospitalId, username);

        assertNotNull(response);
        assertEquals(MaintenanceWorkOrderStatus.CANCELLED, response.getStatus());
        assertEquals(MaintenanceStatus.SCHEDULED, task.getStatus());
        verify(maintenanceTaskRepository).save(task);
    }

    @Test
    void shouldSynchronizeLinkedTaskAndEquipmentStatusOnUpdateStatusToCompleted() {
        Long workOrderId = 10L;
        Long taskId = 50L;
        equipment.setStatus(EquipmentStatus.UNDER_MAINTENANCE);

        MaintenanceTask task = MaintenanceTask.builder()
                .id(taskId)
                .hospitalId(hospitalId)
                .status(MaintenanceStatus.IN_PROGRESS)
                .build();

        MaintenanceWorkOrder workOrder = buildWorkOrder(MaintenanceWorkOrderStatus.IN_PROGRESS);
        workOrder.setMaintenanceTask(task);
        workOrder.setStartedAt(LocalDateTime.now().minusHours(1));

        var updateRequest = com.medtrack.dto.MaintenanceWorkOrderStatusRequest.builder()
                .status(MaintenanceWorkOrderStatus.COMPLETED)
                .reason("Finished maintenance")
                .build();

        when(workOrderRepository.findByIdAndHospitalId(workOrderId, hospitalId))
                .thenReturn(Optional.of(workOrder));

        when(workOrderRepository.save(any(MaintenanceWorkOrder.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        when(workOrderRepository.countByHospitalIdAndEquipmentIdAndStatusIn(
                eq(hospitalId), eq(equipment.getId()), anyList()))
                .thenReturn(0L);

        MaintenanceWorkOrderResponse response = workOrderService.updateStatus(
                workOrderId, updateRequest, hospitalId, username
        );

        assertNotNull(response);
        assertEquals(MaintenanceWorkOrderStatus.COMPLETED, response.getStatus());
        assertEquals(MaintenanceStatus.COMPLETED, task.getStatus());
        assertEquals(EquipmentStatus.ACTIVE, equipment.getStatus());

        verify(maintenanceTaskRepository).save(task);
        verify(equipmentRepository).save(equipment);
    }

    @Test
    void shouldDeductSparePartsWhenCompletingWorkOrderWithPartsUsed() {
        Long workOrderId = 10L;
        MaintenanceWorkOrder workOrder = buildWorkOrder(MaintenanceWorkOrderStatus.IN_PROGRESS);
        workOrder.setStartedAt(LocalDateTime.now().minusHours(2));

        MaintenanceWorkOrderCompletionRequest request = MaintenanceWorkOrderCompletionRequest.builder()
                .completionNotes("Replaced air filters and oil seal")
                .hoursWorked(2.0)
                .partsUsed("PRT-1001: 2, PRT-1002: 1")
                .build();

        com.medtrack.dto.SparePartDeductionItem item1 = com.medtrack.dto.SparePartDeductionItem.builder()
                .partNumber("PRT-1001").quantity(2).build();
        com.medtrack.dto.SparePartDeductionItem item2 = com.medtrack.dto.SparePartDeductionItem.builder()
                .partNumber("PRT-1002").quantity(1).build();
        java.util.List<com.medtrack.dto.SparePartDeductionItem> items = java.util.List.of(item1, item2);

        when(workOrderRepository.findByIdAndHospitalId(workOrderId, hospitalId))
                .thenReturn(Optional.of(workOrder));
        when(workOrderValidator.validateAndExtractSparePartUsage("PRT-1001: 2, PRT-1002: 1"))
                .thenReturn(items);
        when(workOrderRepository.save(any(MaintenanceWorkOrder.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        MaintenanceWorkOrderResponse response = workOrderService.completeWorkOrder(
                workOrderId, request, hospitalId, username
        );

        assertNotNull(response);
        assertEquals(MaintenanceWorkOrderStatus.COMPLETED, response.getStatus());
        verify(sparePartService).deductSparePartsForWorkOrder(items, hospitalId, username);
        verify(workOrderRepository).save(workOrder);
    }

    @Test
    void shouldParsePartsUsedStringCorrectlyIntoDeductionItems() {
        String partsText = "FILTER-01: 3, SENSOR-99 (2)";
        java.util.List<com.medtrack.dto.SparePartDeductionItem> parsed =
                com.medtrack.dto.SparePartDeductionItem.parsePartsUsed(partsText);

        assertEquals(2, parsed.size());
        assertEquals("FILTER-01", parsed.get(0).getPartNumber());
        assertEquals(3, parsed.get(0).getQuantity());
        assertEquals("SENSOR-99", parsed.get(1).getPartNumber());
        assertEquals(2, parsed.get(1).getQuantity());
    }

    @Test
    void createWorkOrder_throwsException_whenDueDateBeforeScheduledDate() {
        MaintenanceWorkOrderRequest request = new MaintenanceWorkOrderRequest();
        request.setEquipmentId(equipment.getId());
        request.setTitle("Calibrate Ventilator");
        request.setMaintenanceType(MaintenanceWorkOrderType.PREVENTIVE);
        request.setPriority(MaintenanceWorkOrderPriority.HIGH);
        request.setScheduledDate(LocalDate.now().plusDays(10));
        request.setDueDate(LocalDate.now().plusDays(2));

        when(equipmentRepository.findById(equipment.getId())).thenReturn(Optional.of(equipment));
        when(disposalRepository.findByEquipmentIdAndHospitalIdOrderByRequestedAtDesc(equipment.getId(), hospitalId))
                .thenReturn(java.util.Collections.emptyList());

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> workOrderService.createWorkOrder(request, hospitalId, username)
        );

        assertEquals("Due date cannot be before scheduled date", ex.getMessage());
        verify(workOrderRepository, never()).save(any());
    }

    @Test
    void createWorkOrder_succeeds_whenScheduledDateAndDueDateAreValid() {
        MaintenanceWorkOrderRequest request = new MaintenanceWorkOrderRequest();
        request.setEquipmentId(equipment.getId());
        request.setTitle("Calibrate Ventilator");
        request.setMaintenanceType(MaintenanceWorkOrderType.PREVENTIVE);
        request.setPriority(MaintenanceWorkOrderPriority.HIGH);
        request.setScheduledDate(LocalDate.now());
        request.setDueDate(LocalDate.now().plusDays(5));

        when(equipmentRepository.findById(equipment.getId())).thenReturn(Optional.of(equipment));
        when(disposalRepository.findByEquipmentIdAndHospitalIdOrderByRequestedAtDesc(equipment.getId(), hospitalId))
                .thenReturn(java.util.Collections.emptyList());
        when(workOrderRepository.save(any())).thenAnswer(invocation -> {
            MaintenanceWorkOrder wo = invocation.getArgument(0);
            wo.setId(100L);
            return wo;
        });

        MaintenanceWorkOrderResponse response = workOrderService.createWorkOrder(request, hospitalId, username);

        assertNotNull(response);
        assertEquals("Calibrate Ventilator", response.getTitle());
        verify(workOrderRepository).save(any());
    }

    @Test
    void createWorkOrder_succeeds_whenScheduledDateAndDueDateAreSame() {
        LocalDate sameDate = LocalDate.now().plusDays(3);
        MaintenanceWorkOrderRequest request = new MaintenanceWorkOrderRequest();
        request.setEquipmentId(equipment.getId());
        request.setTitle("Inspect Pump");
        request.setMaintenanceType(MaintenanceWorkOrderType.CORRECTIVE);
        request.setPriority(MaintenanceWorkOrderPriority.MEDIUM);
        request.setScheduledDate(sameDate);
        request.setDueDate(sameDate);

        when(equipmentRepository.findById(equipment.getId())).thenReturn(Optional.of(equipment));
        when(disposalRepository.findByEquipmentIdAndHospitalIdOrderByRequestedAtDesc(equipment.getId(), hospitalId))
                .thenReturn(java.util.Collections.emptyList());
        when(workOrderRepository.save(any())).thenAnswer(invocation -> {
            MaintenanceWorkOrder wo = invocation.getArgument(0);
            wo.setId(101L);
            return wo;
        });

        MaintenanceWorkOrderResponse response = workOrderService.createWorkOrder(request, hospitalId, username);

        assertNotNull(response);
        assertEquals("Inspect Pump", response.getTitle());
        verify(workOrderRepository).save(any());
    }

    private MaintenanceWorkOrder buildWorkOrder(
            MaintenanceWorkOrderStatus status
    ) {

        return MaintenanceWorkOrder.builder()
                .id(10L)
                .workOrderCode("WO-TEST001")
                .hospitalId(hospitalId)
                .equipment(equipment)
                .title("Test maintenance")
                .description("Test description")
                .maintenanceType(
                        MaintenanceWorkOrderType.PREVENTIVE
                )
                .priority(
                        MaintenanceWorkOrderPriority.MEDIUM
                )
                .status(status)
                .scheduledDate(
                        LocalDate.now()
                )
                .dueDate(
                        LocalDate.now().plusDays(5)
                )
                .createdAt(
                        LocalDateTime.now()
                )
                .createdBy(username)
                .deleted(false)
                .build();
    }
}
package com.medtrack.service;
import org.mockito.Spy;

import com.medtrack.dto.MaintenanceWorkOrderRequest;
import com.medtrack.model.Equipment;
import com.medtrack.model.EquipmentStatus;
import com.medtrack.model.Hospital;
import com.medtrack.model.MaintenanceWorkOrder;
import com.medtrack.model.MaintenanceWorkOrderPriority;
import com.medtrack.model.MaintenanceWorkOrderType;
import com.medtrack.repository.EquipmentDisposalRepository;
import com.medtrack.repository.EquipmentRepository;
import com.medtrack.repository.MaintenanceTaskRepository;
import com.medtrack.repository.MaintenanceWorkOrderRepository;
import com.medtrack.auth.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * A work order may only be raised against an asset that is still on the floor (issue #947).
 *
 * <p>{@code createWorkOrder} validated only that the equipment belonged to the caller's hospital, so
 * one could be opened against an asset disposed of last week and a technician dispatched to a device
 * that is not there. Preventive maintenance already applies this rule through
 * {@code MaintenanceTaskRepository.countSchedulableEquipment}, which excludes {@code RETIRED} and
 * {@code DISPOSED} explicitly.</p>
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Work orders may only be raised against serviceable assets")
class MaintenanceWorkOrderServiceabilityTest {

    private static final Long HOSPITAL_ID = 1L;
    private static final Long EQUIPMENT_ID = 100L;
    private static final String USERNAME = "hospital@test.com";

    @Mock
    private MaintenanceWorkOrderRepository workOrderRepository;

    @Mock
    private EquipmentRepository equipmentRepository;

    @Mock
    private MaintenanceTaskRepository maintenanceTaskRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private SparePartService sparePartService;

    @Mock
    private com.medtrack.repository.EquipmentDisposalRepository disposalRepository;

    @Spy
    private MaintenanceWorkOrderValidator workOrderValidator;

    private MaintenanceWorkOrderService workOrderService;

    private Equipment equipment;

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

        equipment = Equipment.builder()
                .id(EQUIPMENT_ID)
                .equipmentCode("EQ-100")
                .name("MRI Scanner")
                .department("Radiology")
                .hospital(Hospital.builder().id(HOSPITAL_ID).name("City General").build())
                .status(EquipmentStatus.ACTIVE)
                .build();
    }

    private MaintenanceWorkOrderRequest request() {
        return MaintenanceWorkOrderRequest.builder()
                .equipmentId(EQUIPMENT_ID)
                .title("Routine inspection")
                .maintenanceType(MaintenanceWorkOrderType.PREVENTIVE)
                .priority(MaintenanceWorkOrderPriority.LOW)
                .dueDate(LocalDate.now().plusDays(5))
                .build();
    }

    @ParameterizedTest
    @EnumSource(value = EquipmentStatus.class, names = {"RETIRED", "DISPOSED"})
    @DisplayName("an asset that has left the fleet cannot have new work raised against it")
    void decommissionedAssetsAreRefused(EquipmentStatus status) {
        equipment.setStatus(status);
        when(equipmentRepository.findById(EQUIPMENT_ID)).thenReturn(Optional.of(equipment));

        assertThatThrownBy(() -> workOrderService.createWorkOrder(request(), HOSPITAL_ID, USERNAME))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("EQ-100")
                .hasMessageContaining(status.name().toLowerCase());

        verify(workOrderRepository, never()).save(any(MaintenanceWorkOrder.class));
    }

    @ParameterizedTest
    @EnumSource(value = EquipmentStatus.class, names = {"ACTIVE", "UNDER_MAINTENANCE"})
    @DisplayName("an asset still in the fleet is accepted, workbench included")
    void inServiceAssetsAreAccepted(EquipmentStatus status) {
        equipment.setStatus(status);
        when(equipmentRepository.findById(EQUIPMENT_ID)).thenReturn(Optional.of(equipment));
        when(workOrderRepository.existsByWorkOrderCode(any())).thenReturn(false);
        when(workOrderRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        assertThat(workOrderService.createWorkOrder(request(), HOSPITAL_ID, USERNAME)).isNotNull();

        verify(workOrderRepository).save(any(MaintenanceWorkOrder.class));
    }
}

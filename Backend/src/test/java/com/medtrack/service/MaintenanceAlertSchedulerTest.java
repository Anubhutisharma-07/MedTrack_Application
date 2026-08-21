package com.medtrack.service;

import com.medtrack.model.EquipmentStatus;
import com.medtrack.model.MaintenanceTask;
import com.medtrack.model.OperationsEvent;
import com.medtrack.repository.MaintenanceTaskRepository;
import com.medtrack.repository.OperationsEventRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class MaintenanceAlertSchedulerTest {

    @Mock
    private MaintenanceTaskRepository maintenanceTaskRepository;

    @Mock
    private OperationsEventRepository eventRepository;

    @Mock
    private EventPublisherService eventPublisherService;

    @InjectMocks
    private MaintenanceAlertScheduler maintenanceAlertScheduler;

    @BeforeEach
    void setUp() {
    }

    @Test
    void runMaintenanceAlertGeneration_WithCandidates_PublishesEvents() {
        LocalDate today = LocalDate.now();
        LocalDate horizon = today.plusDays(7);

        MaintenanceTask task = new MaintenanceTask();
        task.setId(1L);
        task.setTaskCode("MT-001");
        task.setEquipment("MRI Scanner");
        task.setAssignedTechnician("tech@example.com");
        task.setDeadline(today.plusDays(3));
        task.setHospitalId(100L);

        when(maintenanceTaskRepository.findAlertableUpcomingTasks(today, horizon, EquipmentStatus.DECOMMISSIONED))
                .thenReturn(List.of(task));
        
        when(eventRepository.findByEntityTypeAndEntityIdOrderByCreatedAtDesc(
                OperationsEvent.EntityType.MAINTENANCE_TASK, 1L))
                .thenReturn(Collections.emptyList());

        maintenanceAlertScheduler.runMaintenanceAlertGeneration();

        ArgumentCaptor<OperationsEvent> captor = ArgumentCaptor.forClass(OperationsEvent.class);
        verify(eventPublisherService, times(1)).publishEvent(captor.capture());

        OperationsEvent event = captor.getValue();
        assertEquals(OperationsEvent.EventType.MAINTENANCE_DUE_SOON, event.getType());
        assertEquals(OperationsEvent.EventSeverity.WARNING, event.getSeverity());
        assertTrue(event.getTitle().contains("3 days"));
        assertTrue(event.getDetail().contains("MT-001"));
    }

    @Test
    void runMaintenanceAlertGeneration_AlreadyAlerted_SkipsPublishing() {
        LocalDate today = LocalDate.now();
        LocalDate horizon = today.plusDays(7);

        MaintenanceTask task = new MaintenanceTask();
        task.setId(1L);
        task.setDeadline(today.plusDays(3));

        when(maintenanceTaskRepository.findAlertableUpcomingTasks(today, horizon, EquipmentStatus.DECOMMISSIONED))
                .thenReturn(List.of(task));

        OperationsEvent previousEvent = new OperationsEvent();
        previousEvent.setType(OperationsEvent.EventType.MAINTENANCE_DUE_SOON);
        previousEvent.setDetail("\"deadline\":\"" + task.getDeadline() + "\"");

        when(eventRepository.findByEntityTypeAndEntityIdOrderByCreatedAtDesc(
                OperationsEvent.EntityType.MAINTENANCE_TASK, 1L))
                .thenReturn(List.of(previousEvent));

        maintenanceAlertScheduler.runMaintenanceAlertGeneration();

        verify(eventPublisherService, never()).publishEvent(any());
    }
}

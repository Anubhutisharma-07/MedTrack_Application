package com.medtrack.service;

import com.medtrack.dto.MaintenanceWorkOrderCompletionRequest;
import com.medtrack.dto.MaintenanceWorkOrderRequest;
import com.medtrack.dto.SparePartDeductionItem;
import com.medtrack.model.MaintenanceWorkOrder;
import com.medtrack.model.MaintenanceWorkOrderStatus;
import com.medtrack.auth.model.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class MaintenanceWorkOrderValidatorTest {

    private MaintenanceWorkOrderValidator validator;

    @BeforeEach
    void setUp() {
        validator = new MaintenanceWorkOrderValidator();
    }

    @Test
    @DisplayName("validateCreationDates should pass when request is null")
    void validateCreationDates_nullRequest_passes() {
        assertDoesNotThrow(() -> validator.validateCreationDates(null));
    }

    @Test
    @DisplayName("validateCreationDates should pass when scheduled and due dates are valid")
    void validateCreationDates_validDates_passes() {
        MaintenanceWorkOrderRequest request = new MaintenanceWorkOrderRequest();
        request.setScheduledDate(LocalDate.now());
        request.setDueDate(LocalDate.now().plusDays(7));

        assertDoesNotThrow(() -> validator.validateCreationDates(request));
    }

    @Test
    @DisplayName("validateCreationDates should pass when scheduled and due dates are equal")
    void validateCreationDates_equalDates_passes() {
        LocalDate sameDate = LocalDate.now().plusDays(2);
        MaintenanceWorkOrderRequest request = new MaintenanceWorkOrderRequest();
        request.setScheduledDate(sameDate);
        request.setDueDate(sameDate);

        assertDoesNotThrow(() -> validator.validateCreationDates(request));
    }

    @Test
    @DisplayName("validateCreationDates should throw exception when due date is before scheduled date")
    void validateCreationDates_dueDateBeforeScheduledDate_throwsException() {
        MaintenanceWorkOrderRequest request = new MaintenanceWorkOrderRequest();
        request.setScheduledDate(LocalDate.now().plusDays(10));
        request.setDueDate(LocalDate.now().plusDays(2));

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> validator.validateCreationDates(request)
        );

        assertEquals("Due date cannot be before scheduled date", ex.getMessage());
    }

    @Test
    @DisplayName("validateDateBounds should throw exception when due date is before scheduled date")
    void validateDateBounds_dueDateBeforeScheduledDate_throwsException() {
        LocalDate scheduled = LocalDate.of(2026, 9, 15);
        LocalDate due = LocalDate.of(2026, 9, 1);

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> validator.validateDateBounds(scheduled, due)
        );

        assertEquals("Due date cannot be before scheduled date", ex.getMessage());
    }

    @Test
    @DisplayName("validateCanStart should throw IllegalStateException when status is OPEN")
    void validateCanStart_statusOpen_throwsException() {
        MaintenanceWorkOrder wo = MaintenanceWorkOrder.builder()
                .status(MaintenanceWorkOrderStatus.OPEN)
                .build();

        IllegalStateException ex = assertThrows(
                IllegalStateException.class,
                () -> validator.validateCanStart(wo)
        );

        assertEquals("Only ASSIGNED or ON_HOLD work orders can be started", ex.getMessage());
    }

    @Test
    @DisplayName("validateCanStart should throw IllegalStateException when assigned user is missing")
    void validateCanStart_missingAssignedUser_throwsException() {
        MaintenanceWorkOrder wo = MaintenanceWorkOrder.builder()
                .status(MaintenanceWorkOrderStatus.ASSIGNED)
                .assignedUser(null)
                .build();

        IllegalStateException ex = assertThrows(
                IllegalStateException.class,
                () -> validator.validateCanStart(wo)
        );

        assertEquals("A technician must be assigned before starting work", ex.getMessage());
    }

    @Test
    @DisplayName("validateCanStart should pass when work order is ASSIGNED with technician")
    void validateCanStart_validAssignedWorkOrder_passes() {
        User user = new User();
        user.setId(5L);
        MaintenanceWorkOrder wo = MaintenanceWorkOrder.builder()
                .status(MaintenanceWorkOrderStatus.ASSIGNED)
                .assignedUser(user)
                .build();

        assertDoesNotThrow(() -> validator.validateCanStart(wo));
    }

    @Test
    @DisplayName("validateCompletion should throw exception when work order is not IN_PROGRESS")
    void validateCompletion_statusNotInProgress_throwsException() {
        MaintenanceWorkOrder wo = MaintenanceWorkOrder.builder()
                .status(MaintenanceWorkOrderStatus.ASSIGNED)
                .build();
        MaintenanceWorkOrderCompletionRequest req = new MaintenanceWorkOrderCompletionRequest();
        req.setCompletionNotes("Done");

        IllegalStateException ex = assertThrows(
                IllegalStateException.class,
                () -> validator.validateCompletion(wo, req)
        );

        assertEquals("Only IN_PROGRESS work orders can be completed", ex.getMessage());
    }

    @Test
    @DisplayName("validateCompletion should throw exception when completion notes are missing")
    void validateCompletion_missingNotes_throwsException() {
        MaintenanceWorkOrder wo = MaintenanceWorkOrder.builder()
                .status(MaintenanceWorkOrderStatus.IN_PROGRESS)
                .startedAt(LocalDateTime.now().minusHours(2))
                .build();
        MaintenanceWorkOrderCompletionRequest req = new MaintenanceWorkOrderCompletionRequest();
        req.setCompletionNotes("   ");

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> validator.validateCompletion(wo, req)
        );

        assertEquals("Completion notes are required", ex.getMessage());
    }

    @Test
    @DisplayName("validateCompletionTimestamp should throw exception when start timestamp is missing")
    void validateCompletionTimestamp_missingStartTimestamp_throwsException() {
        MaintenanceWorkOrder wo = MaintenanceWorkOrder.builder()
                .startedAt(null)
                .build();

        IllegalStateException ex = assertThrows(
                IllegalStateException.class,
                () -> validator.validateCompletionTimestamp(wo)
        );

        assertEquals("Start timestamp is missing", ex.getMessage());
    }

    @Test
    @DisplayName("validateNoActiveWorkOrderForTask should throw exception when active order exists")
    void validateNoActiveWorkOrderForTask_activeExists_throwsException() {
        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> validator.validateNoActiveWorkOrderForTask(true, 42L)
        );

        assertEquals("An active work order already exists for maintenance task ID: 42", ex.getMessage());
    }

    @Test
    @DisplayName("validateEquipmentTaskMatching should throw exception when equipment IDs mismatch")
    void validateEquipmentTaskMatching_mismatch_throwsException() {
        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> validator.validateEquipmentTaskMatching(10L, 20L)
        );

        assertEquals("Equipment ID 10 does not match task equipment ID 20", ex.getMessage());
    }

    @Test
    @DisplayName("validateTaskEligibilityForWorkOrder should throw exception when task is completed")
    void validateTaskEligibilityForWorkOrder_completed_throwsException() {
        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> validator.validateTaskEligibilityForWorkOrder(true)
        );

        assertEquals("Cannot create a work order for an already completed maintenance task", ex.getMessage());
    }

    @Test
    @DisplayName("validateAndExtractSparePartUsage should return parsed deduction items")
    void validateAndExtractSparePartUsage_validString_returnsItems() {
        String parts = "PART-A:2, PART-B:5";
        List<SparePartDeductionItem> items = validator.validateAndExtractSparePartUsage(parts);

        assertEquals(2, items.size());
        assertEquals("PART-A", items.get(0).getPartNumber());
        assertEquals(2, items.get(0).getQuantity());
        assertEquals("PART-B", items.get(1).getPartNumber());
        assertEquals(5, items.get(1).getQuantity());
    }
}

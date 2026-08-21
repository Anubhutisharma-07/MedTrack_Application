package com.medtrack.service;

import com.medtrack.model.MaintenancePolicyRule;
import com.medtrack.repository.MaintenancePolicyRuleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MaintenanceGenerationSchedulerTest {

    @Mock
    private MaintenancePolicyRuleRepository ruleRepository;

    @Mock
    private PreventiveMaintenanceService preventiveMaintenanceService;

    private MaintenanceGenerationScheduler scheduler;

    @BeforeEach
    void setUp() {
        scheduler = new MaintenanceGenerationScheduler(
                ruleRepository,
                preventiveMaintenanceService
        );
    }

    @Test
    void shouldGenerateTasksForEveryActiveRule() {
        MaintenancePolicyRule firstRule = MaintenancePolicyRule.builder()
                .id(1L)
                .hospitalId(10L)
                .leadTimeDays(7)
                .active(true)
                .deleted(false)
                .build();

        MaintenancePolicyRule secondRule = MaintenancePolicyRule.builder()
                .id(2L)
                .hospitalId(20L)
                .leadTimeDays(14)
                .active(true)
                .deleted(false)
                .build();

        when(ruleRepository.findByActiveTrueAndDeletedFalse())
                .thenReturn(List.of(firstRule, secondRule));

        scheduler.runGenerationSweep();

        LocalDate start = LocalDate.now();

        verify(preventiveMaintenanceService).generateTasksForScheduler(
                eq(1L),
                eq(start),
                eq(start.plusDays(7))
        );

        verify(preventiveMaintenanceService).generateTasksForScheduler(
                eq(2L),
                eq(start),
                eq(start.plusDays(14))
        );

        verify(preventiveMaintenanceService, times(2))
                .generateTasksForScheduler(anyLong(), any(), any());
    }

    @Test
    void shouldContinueProcessingWhenOneRuleFails() {
        MaintenancePolicyRule failingRule = MaintenancePolicyRule.builder()
                .id(1L)
                .hospitalId(10L)
                .leadTimeDays(7)
                .active(true)
                .deleted(false)
                .build();

        MaintenancePolicyRule successfulRule = MaintenancePolicyRule.builder()
                .id(2L)
                .hospitalId(20L)
                .leadTimeDays(14)
                .active(true)
                .deleted(false)
                .build();

        when(ruleRepository.findByActiveTrueAndDeletedFalse())
                .thenReturn(List.of(failingRule, successfulRule));

        doThrow(new RuntimeException("Generation failed"))
                .when(preventiveMaintenanceService)
                .generateTasksForScheduler(
                        eq(1L),
                        any(LocalDate.class),
                        any(LocalDate.class)
                );

        scheduler.runGenerationSweep();

        verify(preventiveMaintenanceService).generateTasksForScheduler(
                eq(1L),
                any(LocalDate.class),
                any(LocalDate.class)
        );

        verify(preventiveMaintenanceService).generateTasksForScheduler(
                eq(2L),
                any(LocalDate.class),
                any(LocalDate.class)
        );
    }

    @Test
    void shouldUseRuleLeadTimeForGenerationWindow() {
        MaintenancePolicyRule rule = MaintenancePolicyRule.builder()
                .id(5L)
                .hospitalId(50L)
                .leadTimeDays(30)
                .active(true)
                .deleted(false)
                .build();

        when(ruleRepository.findByActiveTrueAndDeletedFalse())
                .thenReturn(List.of(rule));

        scheduler.runGenerationSweep();

        LocalDate start = LocalDate.now();

        ArgumentCaptor<LocalDate> startCaptor =
                ArgumentCaptor.forClass(LocalDate.class);

        ArgumentCaptor<LocalDate> endCaptor =
                ArgumentCaptor.forClass(LocalDate.class);

        verify(preventiveMaintenanceService).generateTasksForScheduler(
                eq(5L),
                startCaptor.capture(),
                endCaptor.capture()
        );

        assertEquals(start, startCaptor.getValue());
        assertEquals(start.plusDays(30), endCaptor.getValue());
    }

    @Test
    void shouldUseDefaultLeadTimeWhenRuleLeadTimeIsNull() {
        MaintenancePolicyRule rule = MaintenancePolicyRule.builder()
                .id(8L)
                .hospitalId(80L)
                .leadTimeDays(null)
                .active(true)
                .deleted(false)
                .build();

        when(ruleRepository.findByActiveTrueAndDeletedFalse())
                .thenReturn(List.of(rule));

        scheduler.runGenerationSweep();

        LocalDate start = LocalDate.now();

        verify(preventiveMaintenanceService).generateTasksForScheduler(
                eq(8L),
                eq(start),
                eq(start.plusDays(7))
        );
    }

    @Test
    void shouldSkipRuleWithMissingIdOrHospitalId() {
        MaintenancePolicyRule invalidRule = MaintenancePolicyRule.builder()
                .id(null)
                .hospitalId(100L)
                .leadTimeDays(7)
                .active(true)
                .deleted(false)
                .build();

        MaintenancePolicyRule validRule = MaintenancePolicyRule.builder()
                .id(10L)
                .hospitalId(100L)
                .leadTimeDays(7)
                .active(true)
                .deleted(false)
                .build();

        when(ruleRepository.findByActiveTrueAndDeletedFalse())
                .thenReturn(List.of(invalidRule, validRule));

        scheduler.runGenerationSweep();

        verify(preventiveMaintenanceService).generateTasksForScheduler(
                eq(10L),
                any(LocalDate.class),
                any(LocalDate.class)
        );

        verify(preventiveMaintenanceService, times(1))
                .generateTasksForScheduler(anyLong(), any(), any());
    }

    @Test
    void shouldDoNothingWhenThereAreNoActiveRules() {
        when(ruleRepository.findByActiveTrueAndDeletedFalse())
                .thenReturn(List.of());

        scheduler.runGenerationSweep();

        verifyNoInteractions(preventiveMaintenanceService);
    }
}

package com.medtrack.service;

import com.medtrack.dto.MaintenanceAnalyticsResponse;
import com.medtrack.dto.MaintenanceEquipmentAnalytics;
import com.medtrack.dto.MaintenanceTechnicianAnalytics;
import com.medtrack.dto.MaintenanceTypeAnalytics;
import com.medtrack.model.MaintenanceStatus;
import com.medtrack.model.SlaState;
import com.medtrack.repository.MaintenanceActivityRepository;
import com.medtrack.repository.MaintenanceAnalyticsRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MaintenanceAnalyticsServiceTest {

    @Mock
    private MaintenanceAnalyticsRepository analyticsRepository;

    @Mock
    private MaintenanceActivityRepository activityRepository;

    @InjectMocks
    private MaintenanceAnalyticsService analyticsService;

    private final Long hospitalId = 1L;

    @Test
    void shouldGenerateAnalyticsSuccessfully() {

        when(analyticsRepository.countByHospitalId(hospitalId))
                .thenReturn(100L);

        when(analyticsRepository.countByHospitalIdAndStatus(
                hospitalId,
                MaintenanceStatus.COMPLETED
        )).thenReturn(60L);

        when(analyticsRepository.countByHospitalIdAndStatusNot(
                hospitalId,
                MaintenanceStatus.COMPLETED
        )).thenReturn(40L);

        when(
                analyticsRepository
                        .countByHospitalIdAndDeadlineBeforeAndStatusNot(
                                eq(hospitalId),
                                any(LocalDate.class),
                                eq(MaintenanceStatus.COMPLETED)
                        )
        ).thenReturn(10L);

        when(analyticsRepository.getTotalHoursWorked(hospitalId))
                .thenReturn(500.0);

        when(analyticsRepository.getAverageHoursWorked(hospitalId))
                .thenReturn(5.0);

        when(analyticsRepository.getAverageCompletionDays(hospitalId))
                .thenReturn(2.5);

        when(analyticsRepository.countBySlaState(
                hospitalId,
                SlaState.UPCOMING
        )).thenReturn(50L);

        when(analyticsRepository.countBySlaState(
                hospitalId,
                SlaState.WARNING
        )).thenReturn(30L);

        when(analyticsRepository.countBySlaState(
                hospitalId,
                SlaState.BREACHED
        )).thenReturn(20L);

        when(analyticsRepository.countSlaBreaches(hospitalId))
                .thenReturn(20L);

        when(
                analyticsRepository.countTasksCreatedBetween(
                        eq(hospitalId),
                        any(),
                        any()
                )
        ).thenReturn(25L);

        when(
                analyticsRepository.countTasksCompletedBetween(
                        eq(hospitalId),
                        any(),
                        any()
                )
        ).thenReturn(15L);

        when(
                analyticsRepository.countTasksDueBetween(
                        eq(hospitalId),
                        any(),
                        any()
                )
        ).thenReturn(20L);

        when(analyticsRepository.getMaintenanceTypeAnalytics(
                hospitalId
        )).thenReturn(List.of());

        when(analyticsRepository.getTechnicianAnalytics(
                hospitalId
        )).thenReturn(List.of());

        when(analyticsRepository.getEquipmentAnalytics(
                hospitalId
        )).thenReturn(List.of());

        when(activityRepository.countByHospitalId(hospitalId))
                .thenReturn(200L);

        when(
                activityRepository.countByHospitalIdAndOccurredAtBetween(
                        eq(hospitalId),
                        any(),
                        any()
                )
        ).thenReturn(50L);

        when(activityRepository.getEventTypeAnalytics(
                hospitalId
        )).thenReturn(List.of());

        when(activityRepository.getStatusTransitionAnalytics(
                hospitalId
        )).thenReturn(List.of());

        MaintenanceAnalyticsResponse response =
                analyticsService.getAnalytics(
                        hospitalId,
                        LocalDate.now().minusDays(30),
                        LocalDate.now()
                );

        assertNotNull(response);

        assertEquals(100L, response.getTotalTasks());
        assertEquals(40L, response.getOpenTasks());
        assertEquals(60L, response.getCompletedTasks());
        assertEquals(0L, response.getCancelledTasks());
        assertEquals(10L, response.getOverdueTasks());

        assertEquals(
                500.0,
                response.getTotalHoursWorked()
        );

        assertEquals(
                5.0,
                response.getAverageHoursWorked()
        );

        assertEquals(
                2.5,
                response.getAverageCompletionDays()
        );

        assertEquals(
                50L,
                response.getUpcomingTasks()
        );

        assertEquals(
                30L,
                response.getWarningTasks()
        );

        assertEquals(
                20L,
                response.getBreachedTasks()
        );

        assertEquals(
                20L,
                response.getSlaBreaches()
        );

        assertEquals(
                25L,
                response.getTasksCreatedInPeriod()
        );

        assertEquals(
                15L,
                response.getTasksCompletedInPeriod()
        );

        assertEquals(
                20L,
                response.getTasksDueInPeriod()
        );

        assertEquals(
                200L,
                response.getTotalActivities()
        );

        assertEquals(
                50L,
                response.getActivitiesInPeriod()
        );
    }

    @Test
    void shouldUseCurrentMonthWhenDatesAreMissing() {

        when(analyticsRepository.countByHospitalId(hospitalId))
                .thenReturn(0L);

        when(analyticsRepository.countByHospitalIdAndStatus(
                eq(hospitalId),
                any(MaintenanceStatus.class)
        )).thenReturn(0L);

        when(analyticsRepository.countByHospitalIdAndStatusNot(
                eq(hospitalId),
                any(MaintenanceStatus.class)
        )).thenReturn(0L);

        when(
                analyticsRepository
                        .countByHospitalIdAndDeadlineBeforeAndStatusNot(
                                eq(hospitalId),
                                any(LocalDate.class),
                                any(MaintenanceStatus.class)
                        )
        ).thenReturn(0L);

        when(analyticsRepository.getTotalHoursWorked(hospitalId))
                .thenReturn(0.0);

        when(analyticsRepository.getAverageHoursWorked(hospitalId))
                .thenReturn(0.0);

        when(analyticsRepository.getAverageCompletionDays(hospitalId))
                .thenReturn(0.0);

        when(analyticsRepository.countBySlaState(
                eq(hospitalId),
                any(SlaState.class)
        )).thenReturn(0L);

        when(analyticsRepository.countSlaBreaches(hospitalId))
                .thenReturn(0L);

        when(analyticsRepository.countTasksCreatedBetween(
                eq(hospitalId),
                any(),
                any()
        )).thenReturn(0L);

        when(analyticsRepository.countTasksCompletedBetween(
                eq(hospitalId),
                any(),
                any()
        )).thenReturn(0L);

        when(analyticsRepository.countTasksDueBetween(
                eq(hospitalId),
                any(),
                any()
        )).thenReturn(0L);

        when(analyticsRepository.getMaintenanceTypeAnalytics(
                hospitalId
        )).thenReturn(List.of());

        when(analyticsRepository.getTechnicianAnalytics(
                hospitalId
        )).thenReturn(List.of());

        when(analyticsRepository.getEquipmentAnalytics(
                hospitalId
        )).thenReturn(List.of());

        when(activityRepository.countByHospitalId(hospitalId))
                .thenReturn(0L);

        when(activityRepository.countByHospitalIdAndOccurredAtBetween(
                eq(hospitalId),
                any(),
                any()
        )).thenReturn(0L);

        when(activityRepository.getEventTypeAnalytics(
                hospitalId
        )).thenReturn(List.of());

        when(activityRepository.getStatusTransitionAnalytics(
                hospitalId
        )).thenReturn(List.of());

        MaintenanceAnalyticsResponse response =
                analyticsService.getAnalytics(
                        hospitalId,
                        null,
                        null
                );

        assertNotNull(response);
        assertEquals(0L, response.getTotalTasks());
        assertEquals(0L, response.getCompletedTasks());
    }

    @Test
    void shouldRejectMissingHospitalId() {

        assertThrows(
                IllegalArgumentException.class,
                () -> analyticsService.getAnalytics(
                        null,
                        LocalDate.now().minusDays(10),
                        LocalDate.now()
                )
        );

        verifyNoInteractions(analyticsRepository);
        verifyNoInteractions(activityRepository);
    }

    @Test
    void shouldRejectInvalidDateRange() {

        LocalDate start =
                LocalDate.of(2026, 8, 10);

        LocalDate end =
                LocalDate.of(2026, 8, 1);

        assertThrows(
                IllegalArgumentException.class,
                () -> analyticsService.getAnalytics(
                        hospitalId,
                        start,
                        end
                )
        );

        verifyNoInteractions(analyticsRepository);
        verifyNoInteractions(activityRepository);
    }

    @Test
    void shouldReturnDepartmentAnalytics() {

        when(
                analyticsRepository.getDepartmentAnalytics(
                        hospitalId
                )
        ).thenReturn(List.of());

        assertNotNull(
                analyticsService.getDepartmentAnalytics(
                        hospitalId
                )
        );

        verify(
                analyticsRepository
        ).getDepartmentAnalytics(hospitalId);
    }

    @Test
    void shouldReturnTrendAnalytics() {

        when(
                analyticsRepository.getMaintenanceTrend(
                        eq(hospitalId),
                        any(),
                        any()
                )
        ).thenReturn(List.of());

        assertNotNull(
                analyticsService.getMaintenanceTrends(
                        hospitalId,
                        LocalDate.now().minusDays(30),
                        LocalDate.now()
                )
        );

        verify(
                analyticsRepository
        ).getMaintenanceTrend(
                eq(hospitalId),
                any(),
                any()
        );
    }

    @Test
    void shouldRejectMissingHospitalIdForDepartmentAnalytics() {
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> analyticsService.getDepartmentAnalytics(null)
        );

        assertEquals("Hospital ID is required", exception.getMessage());
        verifyNoInteractions(analyticsRepository);
        verifyNoInteractions(activityRepository);
    }

    @Test
    void shouldRejectMissingHospitalIdForTrendAnalytics() {
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> analyticsService.getMaintenanceTrends(
                        null,
                        LocalDate.of(2026, 8, 1),
                        LocalDate.of(2026, 8, 31)
                )
        );

        assertEquals("Hospital ID is required", exception.getMessage());
        verifyNoInteractions(analyticsRepository);
        verifyNoInteractions(activityRepository);
    }

    @Test
    void shouldRequireBothDatesForTrendAnalytics() {
        IllegalArgumentException missingStart = assertThrows(
                IllegalArgumentException.class,
                () -> analyticsService.getMaintenanceTrends(
                        hospitalId,
                        null,
                        LocalDate.of(2026, 8, 31)
                )
        );

        IllegalArgumentException missingEnd = assertThrows(
                IllegalArgumentException.class,
                () -> analyticsService.getMaintenanceTrends(
                        hospitalId,
                        LocalDate.of(2026, 8, 1),
                        null
                )
        );

        assertEquals("Start date and end date are required", missingStart.getMessage());
        assertEquals("Start date and end date are required", missingEnd.getMessage());
        verifyNoInteractions(analyticsRepository);
        verifyNoInteractions(activityRepository);
    }

    @Test
    void shouldRejectReversedTrendDateRange() {
        LocalDate startDate = LocalDate.of(2026, 8, 31);
        LocalDate endDate = LocalDate.of(2026, 8, 1);

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> analyticsService.getMaintenanceTrends(
                        hospitalId,
                        startDate,
                        endDate
                )
        );

        assertEquals("Start date cannot be after end date", exception.getMessage());
        verifyNoInteractions(analyticsRepository);
        verifyNoInteractions(activityRepository);
    }

    @Test
    void shouldUseInclusiveDayBoundariesForTrendAnalytics() {
        LocalDate startDate = LocalDate.of(2026, 8, 1);
        LocalDate endDate = LocalDate.of(2026, 8, 31);
        when(analyticsRepository.getMaintenanceTrend(
                eq(hospitalId),
                any(LocalDateTime.class),
                any(LocalDateTime.class)
        )).thenReturn(List.of());

        analyticsService.getMaintenanceTrends(hospitalId, startDate, endDate);

        ArgumentCaptor<LocalDateTime> startCaptor =
                ArgumentCaptor.forClass(LocalDateTime.class);
        ArgumentCaptor<LocalDateTime> endCaptor =
                ArgumentCaptor.forClass(LocalDateTime.class);
        verify(analyticsRepository).getMaintenanceTrend(
                eq(hospitalId),
                startCaptor.capture(),
                endCaptor.capture()
        );

        assertEquals(startDate.atStartOfDay(), startCaptor.getValue());
        assertEquals(
                endDate.plusDays(1).atStartOfDay().minusNanos(1),
                endCaptor.getValue()
        );
        verifyNoInteractions(activityRepository);
    }

    @Test
    void shouldDefaultOnlyMissingStartDate() {
        LocalDate endDate = LocalDate.now();

        analyticsService.getAnalytics(hospitalId, null, endDate);

        ArgumentCaptor<LocalDateTime> startCaptor =
                ArgumentCaptor.forClass(LocalDateTime.class);
        ArgumentCaptor<LocalDateTime> endCaptor =
                ArgumentCaptor.forClass(LocalDateTime.class);
        verify(analyticsRepository).countTasksCreatedBetween(
                eq(hospitalId),
                startCaptor.capture(),
                endCaptor.capture()
        );

        assertEquals(
                LocalDate.now().withDayOfMonth(1).atStartOfDay(),
                startCaptor.getValue()
        );
        assertEquals(
                endDate.plusDays(1).atStartOfDay().minusNanos(1),
                endCaptor.getValue()
        );
    }

    @Test
    void shouldDefaultOnlyMissingEndDate() {
        LocalDate startDate = LocalDate.now().minusDays(7);

        analyticsService.getAnalytics(hospitalId, startDate, null);

        ArgumentCaptor<LocalDateTime> startCaptor =
                ArgumentCaptor.forClass(LocalDateTime.class);
        ArgumentCaptor<LocalDateTime> endCaptor =
                ArgumentCaptor.forClass(LocalDateTime.class);
        verify(analyticsRepository).countTasksCompletedBetween(
                eq(hospitalId),
                startCaptor.capture(),
                endCaptor.capture()
        );

        assertEquals(startDate.atStartOfDay(), startCaptor.getValue());
        assertEquals(
                LocalDate.now().plusDays(1).atStartOfDay().minusNanos(1),
                endCaptor.getValue()
        );
    }
}

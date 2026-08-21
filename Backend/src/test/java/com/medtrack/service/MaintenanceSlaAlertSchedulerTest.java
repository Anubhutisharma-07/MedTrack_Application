package com.medtrack.service;

import com.medtrack.dto.SlaSummaryResponse;
import com.medtrack.model.Hospital;
import com.medtrack.repository.HospitalRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MaintenanceSlaAlertSchedulerTest {

    @Mock
    private HospitalRepository hospitalRepository;

    @Mock
    private PreventiveMaintenanceService preventiveMaintenanceService;

    @InjectMocks
    private MaintenanceSlaAlertScheduler scheduler;

    private Hospital hospitalOne;
    private Hospital hospitalTwo;

    @BeforeEach
    void setUp() {
        hospitalOne = Hospital.builder()
                .id(1L)
                .build();

        hospitalTwo = Hospital.builder()
                .id(2L)
                .build();
    }

    @Test
    void runSlaSweep_shouldProcessEveryHospital() {
        when(hospitalRepository.findAll())
                .thenReturn(List.of(hospitalOne, hospitalTwo));

        when(preventiveMaintenanceService.refreshSlaForHospitalId(1L))
                .thenReturn(summary(2, 1, 0));

        when(preventiveMaintenanceService.refreshSlaForHospitalId(2L))
                .thenReturn(summary(3, 2, 1));

        scheduler.runSlaSweep();

        verify(preventiveMaintenanceService)
                .refreshSlaForHospitalId(1L);

        verify(preventiveMaintenanceService)
                .refreshSlaForHospitalId(2L);

        verifyNoMoreInteractions(preventiveMaintenanceService);
    }

    @Test
    void runSlaSweep_shouldContinueWhenOneHospitalFails() {
        when(hospitalRepository.findAll())
                .thenReturn(List.of(hospitalOne, hospitalTwo));

        when(preventiveMaintenanceService.refreshSlaForHospitalId(1L))
                .thenThrow(new RuntimeException("Database unavailable"));

        when(preventiveMaintenanceService.refreshSlaForHospitalId(2L))
                .thenReturn(summary(1, 1, 1));

        scheduler.runSlaSweep();

        verify(preventiveMaintenanceService)
                .refreshSlaForHospitalId(1L);

        verify(preventiveMaintenanceService)
                .refreshSlaForHospitalId(2L);
    }

    @Test
    void runSlaSweep_shouldIgnoreInvalidHospitalEntries() {
        Hospital invalidHospital = Hospital.builder()
                .id(null)
                .build();

        when(hospitalRepository.findAll())
                .thenReturn(List.of(
                        hospitalOne,
                        invalidHospital,
                        hospitalTwo
                ));

        when(preventiveMaintenanceService.refreshSlaForHospitalId(1L))
                .thenReturn(summary(1, 0, 0));

        when(preventiveMaintenanceService.refreshSlaForHospitalId(2L))
                .thenReturn(summary(2, 1, 1));

        scheduler.runSlaSweep();

        verify(preventiveMaintenanceService)
                .refreshSlaForHospitalId(1L);

        verify(preventiveMaintenanceService)
                .refreshSlaForHospitalId(2L);

        verify(preventiveMaintenanceService, never())
                .refreshSlaForHospitalId(null);
    }

    @Test
    void runSlaSweep_shouldHandleNoHospitals() {
        when(hospitalRepository.findAll())
                .thenReturn(List.of());

        scheduler.runSlaSweep();

        verify(preventiveMaintenanceService, never())
                .refreshSlaForHospitalId(anyLong());
    }

    private SlaSummaryResponse summary(
            long warning,
            long breached,
            long escalated) {

        return SlaSummaryResponse.builder()
                .warning(warning)
                .breached(breached)
                .escalated(escalated)
                .build();
    }
}

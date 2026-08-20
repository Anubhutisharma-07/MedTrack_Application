package com.medtrack.service;

import com.medtrack.dto.HospitalAnalyticsDto;
import com.medtrack.model.EquipmentStatus;
import com.medtrack.model.Hospital;
import com.medtrack.model.MaintenanceStatus;
import com.medtrack.repository.EquipmentOrderRepository;
import com.medtrack.repository.EquipmentRepository;
import com.medtrack.repository.HospitalRepository;
import com.medtrack.repository.MaintenanceTaskRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * The dashboard's "upcoming warranty expirations" tile and the warranty-expiry alert feed must
 * agree on which assets count (issue #943). Both exclude assets that have left the operating fleet:
 * their warranty date is historical record and the cover cannot be renewed, so counting them
 * overstates the work in front of the team.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Hospital analytics: warranty eligibility")
class AnalyticsWarrantyEligibilityTest {

    private static final Long HOSPITAL_ID = 42L;

    @Mock
    private EquipmentRepository equipmentRepository;

    @Mock
    private MaintenanceTaskRepository taskRepository;

    @Mock
    private EquipmentOrderRepository orderRepository;

    @Mock
    private HospitalRepository hospitalRepository;

    @InjectMocks
    private AnalyticsService analyticsService;

    @BeforeEach
    void setUp() {
        when(hospitalRepository.existsById(HOSPITAL_ID)).thenReturn(true);

        // Everything the method touches beyond the warranty count is stubbed to an empty result so
        // each assertion below is about the warranty path alone.
        lenient().when(equipmentRepository.countByHospitalId(HOSPITAL_ID)).thenReturn(0L);
        lenient().when(equipmentRepository.countByHospitalIdAndStatus(
                eq(HOSPITAL_ID), any(EquipmentStatus.class))).thenReturn(0L);
        lenient().when(equipmentRepository.findNameAndCategoryByHospitalId(HOSPITAL_ID))
                .thenReturn(List.of());
        lenient().when(equipmentRepository.findByHospitalId(HOSPITAL_ID)).thenReturn(List.of());
        lenient().when(taskRepository.findCompletedTasksWithTimestamps(
                HOSPITAL_ID, MaintenanceStatus.COMPLETED)).thenReturn(List.of());
        lenient().when(taskRepository.averageHoursWorkedByHospitalIdAndStatus(
                HOSPITAL_ID, MaintenanceStatus.COMPLETED)).thenReturn(null);
        lenient().when(taskRepository.countByHospitalIdAndStatusNotAndPriority(
                HOSPITAL_ID, MaintenanceStatus.COMPLETED, "Critical")).thenReturn(0L);
        lenient().when(orderRepository.sumTotalCostByHospitalIdAndShippingStatus(
                HOSPITAL_ID, "Delivered")).thenReturn(null);
        lenient().when(orderRepository.findByHospitalIdAndShippingStatus(
                HOSPITAL_ID, "Delivered")).thenReturn(List.of());
    }

    @Test
    @DisplayName("the count excludes retired and disposed assets")
    void countExcludesDecommissionedAssets() {
        when(equipmentRepository.countAlertableByHospitalIdAndWarrantyExpiryBetween(
                eq(HOSPITAL_ID), any(LocalDate.class), any(LocalDate.class), any()))
                .thenReturn(3L);

        HospitalAnalyticsDto dto = analyticsService.getHospitalAnalytics(HOSPITAL_ID);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<Collection<EquipmentStatus>> excluded =
                ArgumentCaptor.forClass(Collection.class);
        verify(equipmentRepository).countAlertableByHospitalIdAndWarrantyExpiryBetween(
                eq(HOSPITAL_ID), any(LocalDate.class), any(LocalDate.class), excluded.capture());

        assertThat(excluded.getValue())
                .containsExactlyInAnyOrder(EquipmentStatus.RETIRED, EquipmentStatus.DISPOSED);
        assertThat(dto.getUpcomingWarrantyExpirationsCount()).isEqualTo(3L);
    }

    @Test
    @DisplayName("the window is the next 30 days, inclusive of today")
    void countUsesAThirtyDayWindow() {
        when(equipmentRepository.countAlertableByHospitalIdAndWarrantyExpiryBetween(
                eq(HOSPITAL_ID), any(LocalDate.class), any(LocalDate.class), any()))
                .thenReturn(0L);

        analyticsService.getHospitalAnalytics(HOSPITAL_ID);

        ArgumentCaptor<LocalDate> start = ArgumentCaptor.forClass(LocalDate.class);
        ArgumentCaptor<LocalDate> end = ArgumentCaptor.forClass(LocalDate.class);
        verify(equipmentRepository).countAlertableByHospitalIdAndWarrantyExpiryBetween(
                eq(HOSPITAL_ID), start.capture(), end.capture(), any());

        assertThat(start.getValue()).isEqualTo(LocalDate.now());
        assertThat(end.getValue()).isEqualTo(LocalDate.now().plusDays(30));
    }

    @Test
    @DisplayName("the status-blind count is no longer used for this tile")
    void doesNotUseTheStatusBlindCount() {
        when(equipmentRepository.countAlertableByHospitalIdAndWarrantyExpiryBetween(
                eq(HOSPITAL_ID), any(LocalDate.class), any(LocalDate.class), any()))
                .thenReturn(0L);

        analyticsService.getHospitalAnalytics(HOSPITAL_ID);

        verify(equipmentRepository, never()).countByHospitalIdAndWarrantyExpiryBetween(
                anyLong(), any(LocalDate.class), any(LocalDate.class));
    }
}

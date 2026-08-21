package com.medtrack.service;

import com.medtrack.dto.EquipmentFailureRiskDto;
import com.medtrack.exception.ResourceNotFoundException;
import com.medtrack.model.Equipment;
import com.medtrack.model.EquipmentStatus;
import com.medtrack.model.MaintenanceStatus;
import com.medtrack.repository.EquipmentOrderRepository;
import com.medtrack.repository.EquipmentRepository;
import com.medtrack.repository.HospitalRepository;
import com.medtrack.repository.MaintenanceTaskRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Failure-risk scoring for a single asset (issue #946).
 *
 * <p>The two behaviours pinned here are that a completed task without a completion timestamp is
 * ignored rather than fatal, and that overdue work on the asset actually reaches the score.</p>
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Equipment failure-risk prediction")
class AnalyticsFailureRiskTest {

    private static final Long HOSPITAL_ID = 4L;
    private static final Long EQUIPMENT_ID = 900L;
    private static final String CODE = "EQ-MRI-01";

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

    private Equipment asset(EquipmentStatus status, LocalDate purchaseDate, Integer usefulLifeYears) {
        Equipment equipment = Equipment.builder()
                .id(EQUIPMENT_ID)
                .equipmentCode(CODE)
                .name("MRI Scanner")
                .status(status)
                .purchaseDate(purchaseDate)
                .usefulLifeYears(usefulLifeYears)
                .build();
        when(equipmentRepository.findByIdAndHospitalId(EQUIPMENT_ID, HOSPITAL_ID))
                .thenReturn(Optional.of(equipment));
        return equipment;
    }

    private void history(long completedCount, LocalDateTime lastCompletion, long overdueCount) {
        when(taskRepository.countByHospitalIdAndEquipmentCodeAndStatus(
                HOSPITAL_ID, CODE, MaintenanceStatus.COMPLETED)).thenReturn(completedCount);
        when(taskRepository.findLastCompletionForEquipment(HOSPITAL_ID, CODE))
                .thenReturn(Optional.ofNullable(lastCompletion));
        when(taskRepository.countOverdueForEquipment(eq(HOSPITAL_ID), eq(CODE), any(LocalDate.class)))
                .thenReturn(overdueCount);
    }

    @Nested
    @DisplayName("tasks completed without a timestamp")
    class MissingTimestamps {

        @Test
        @DisplayName("do not make the endpoint throw")
        void doNotThrow() {
            asset(EquipmentStatus.ACTIVE, LocalDate.now().minusYears(1), 10);
            // Two completions on record, neither with a usable timestamp: the count query sees them,
            // the MAX(completed_at) query filters them out.
            history(2, null, 0);

            assertThatCode(() -> analyticsService.predictFailureRisk(EQUIPMENT_ID, HOSPITAL_ID))
                    .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("are treated as no usable recency signal, not as a recent service")
        void countAsNoRecencySignal() {
            asset(EquipmentStatus.ACTIVE, LocalDate.now().minusYears(1), 10);
            history(2, null, 0);

            EquipmentFailureRiskDto risk = analyticsService.predictFailureRisk(EQUIPMENT_ID, HOSPITAL_ID);

            // frequency (2 completions) 10 + recency (unknown) 20 = 30
            assertThat(risk.getFailureProbability()).isEqualTo(30);
            assertThat(risk.getRiskTier()).isEqualTo("MODERATE");
        }
    }

    @Nested
    @DisplayName("overdue maintenance")
    class OverdueMaintenance {

        @Test
        @DisplayName("raises the score for the asset it is overdue on")
        void overdueWorkReachesTheScore() {
            asset(EquipmentStatus.ACTIVE, LocalDate.now().minusYears(1), 10);
            history(0, LocalDateTime.now().minusDays(10), 3);

            // frequency 0 + recency (10 days, inside every window) 0 + overdue 10 = 10
            assertThat(analyticsService.predictFailureRisk(EQUIPMENT_ID, HOSPITAL_ID)
                    .getFailureProbability()).isEqualTo(10);
        }

        @Test
        @DisplayName("scores nothing when the asset has none")
        void noOverdueWorkScoresNothing() {
            asset(EquipmentStatus.ACTIVE, LocalDate.now().minusYears(1), 10);
            history(0, LocalDateTime.now().minusDays(10), 0);

            assertThat(analyticsService.predictFailureRisk(EQUIPMENT_ID, HOSPITAL_ID)
                    .getFailureProbability()).isZero();
        }

        @Test
        @DisplayName("a single overdue task is worth half the factor")
        void oneOverdueTaskIsHalf() {
            asset(EquipmentStatus.ACTIVE, LocalDate.now().minusYears(1), 10);
            history(0, LocalDateTime.now().minusDays(10), 1);

            assertThat(analyticsService.predictFailureRisk(EQUIPMENT_ID, HOSPITAL_ID)
                    .getFailureProbability()).isEqualTo(5);
        }

        @Test
        @DisplayName("an asset in the shop shares the factor's ceiling rather than stacking on it")
        void underMaintenanceDoesNotPushPastTheCap() {
            asset(EquipmentStatus.UNDER_MAINTENANCE, LocalDate.now().minusYears(1), 10);
            history(0, LocalDateTime.now().minusDays(10), 3);

            assertThat(analyticsService.predictFailureRisk(EQUIPMENT_ID, HOSPITAL_ID)
                    .getFailureProbability()).isEqualTo(10);
        }

        @Test
        @DisplayName("the hospital-wide critical count is no longer consulted")
        void doesNotUseTheHospitalWideCriticalCount() {
            asset(EquipmentStatus.ACTIVE, LocalDate.now().minusYears(1), 10);
            history(0, LocalDateTime.now().minusDays(10), 0);

            analyticsService.predictFailureRisk(EQUIPMENT_ID, HOSPITAL_ID);

            verify(taskRepository, never()).countByHospitalIdAndStatusNotAndPriority(
                    anyLong(), any(MaintenanceStatus.class), anyString());
        }
    }

    @Nested
    @DisplayName("scoring bands")
    class ScoringBands {

        @Test
        @DisplayName("a worn, heavily serviced, long-neglected asset with overdue work is CRITICAL")
        void criticalAsset() {
            asset(EquipmentStatus.ACTIVE, LocalDate.now().minusYears(9), 10);
            history(6, LocalDateTime.now().minusDays(400), 3);

            EquipmentFailureRiskDto risk = analyticsService.predictFailureRisk(EQUIPMENT_ID, HOSPITAL_ID);

            // age 30 + frequency 30 + recency 20 + overdue 10 = 90
            assertThat(risk.getFailureProbability()).isEqualTo(90);
            assertThat(risk.getRiskTier()).isEqualTo("CRITICAL");
            assertThat(risk.getPredictedFailureDate()).isEqualTo(LocalDate.now().plusDays(30));
        }

        @Test
        @DisplayName("a young, well-kept asset is LOW")
        void lowRiskAsset() {
            asset(EquipmentStatus.ACTIVE, LocalDate.now().minusYears(1), 10);
            history(0, LocalDateTime.now().minusDays(30), 0);

            EquipmentFailureRiskDto risk = analyticsService.predictFailureRisk(EQUIPMENT_ID, HOSPITAL_ID);

            assertThat(risk.getFailureProbability()).isZero();
            assertThat(risk.getRiskTier()).isEqualTo("LOW");
            assertThat(risk.getPredictedFailureDate()).isEqualTo(LocalDate.now().plusDays(365));
        }

        @Test
        @DisplayName("an asset past its useful life with no history at all is HIGH")
        void pastUsefulLifeWithNoHistory() {
            asset(EquipmentStatus.ACTIVE, LocalDate.now().minusYears(12), 10);
            history(0, null, 0);

            EquipmentFailureRiskDto risk = analyticsService.predictFailureRisk(EQUIPMENT_ID, HOSPITAL_ID);

            // age 40 + frequency 0 + recency (none) 20 = 60
            assertThat(risk.getFailureProbability()).isEqualTo(60);
            assertThat(risk.getRiskTier()).isEqualTo("HIGH");
            assertThat(risk.getPredictedFailureDate()).isEqualTo(LocalDate.now().plusDays(90));
        }

        @Test
        @DisplayName("an unknown purchase date still carries the default age risk")
        void unknownAgeKeepsItsDefault() {
            asset(EquipmentStatus.ACTIVE, null, null);
            history(4, LocalDateTime.now().minusDays(200), 1);

            // age (unknown) 20 + frequency 20 + recency 10 + overdue 5 = 55
            assertThat(analyticsService.predictFailureRisk(EQUIPMENT_ID, HOSPITAL_ID)
                    .getFailureProbability()).isEqualTo(55);
        }
    }

    @Nested
    @DisplayName("data access")
    class DataAccess {

        @Test
        @DisplayName("no page of task entities is loaded to answer two aggregate questions")
        void doesNotPageTaskEntities() {
            asset(EquipmentStatus.ACTIVE, LocalDate.now().minusYears(1), 10);
            history(6, LocalDateTime.now().minusDays(10), 0);

            analyticsService.predictFailureRisk(EQUIPMENT_ID, HOSPITAL_ID);

            verify(taskRepository, never()).findByHospitalIdWithFilters(
                    anyLong(), any(MaintenanceStatus.class), anyString(), any(Pageable.class));
        }

        @Test
        @DisplayName("an asset belonging to another hospital is not scored")
        void otherHospitalsAssetIsNotFound() {
            lenient().when(equipmentRepository.findByIdAndHospitalId(EQUIPMENT_ID, HOSPITAL_ID))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() -> analyticsService.predictFailureRisk(EQUIPMENT_ID, HOSPITAL_ID))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }
}

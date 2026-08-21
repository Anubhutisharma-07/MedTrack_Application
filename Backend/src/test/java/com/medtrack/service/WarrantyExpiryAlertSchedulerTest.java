package com.medtrack.service;

import com.medtrack.model.Equipment;
import com.medtrack.model.EquipmentStatus;
import com.medtrack.model.Hospital;
import com.medtrack.model.OperationsEvent;
import com.medtrack.repository.EquipmentRepository;
import com.medtrack.repository.OperationsEventRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * Behaviour of the daily warranty-expiry alert job.
 *
 * <p>The regressions this class guards (issue #943) are that decommissioned assets must not raise
 * alerts, and that the job must not read the whole equipment table to find the handful of assets
 * inside its 90-day horizon.</p>
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Warranty expiry alert scheduler")
class WarrantyExpiryAlertSchedulerTest {

    private static final Long HOSPITAL_ID = 7L;

    @Mock
    private EquipmentRepository equipmentRepository;

    @Mock
    private OperationsEventRepository eventRepository;

    @Mock
    private EventPublisherService eventPublisherService;

    @InjectMocks
    private WarrantyExpiryAlertScheduler scheduler;

    @Captor
    private ArgumentCaptor<Collection<EquipmentStatus>> excludedStatusCaptor;

    private Hospital hospital;

    @BeforeEach
    void setUp() {
        hospital = Hospital.builder().id(HOSPITAL_ID).name("City General").build();
        // Most cases have no prior events; the suppression case overrides this.
        lenient().when(eventRepository.findByEntityTypeAndEntityIdOrderByCreatedAtDesc(
                        any(OperationsEvent.EntityType.class), anyLong()))
                .thenReturn(List.of());
    }

    private Equipment asset(Long id, String code, EquipmentStatus status, long daysUntilExpiry) {
        return Equipment.builder()
                .id(id)
                .equipmentCode(code)
                .name("Asset " + code)
                .hospital(hospital)
                .status(status)
                .warrantyExpiry(LocalDate.now().plusDays(daysUntilExpiry))
                .build();
    }

    private void givenCandidates(Equipment... assets) {
        when(equipmentRepository.findAlertableByWarrantyExpiryBetween(
                any(LocalDate.class), any(LocalDate.class), any()))
                .thenReturn(List.of(assets));
    }

    @Nested
    @DisplayName("candidate selection")
    class CandidateSelection {

        @Test
        @DisplayName("asks the database for the 90-day window and excludes decommissioned statuses")
        void scopesTheQueryToTheAlertHorizon() {
            givenCandidates();

            scheduler.runWarrantyAlertGeneration();

            ArgumentCaptor<LocalDate> start = ArgumentCaptor.forClass(LocalDate.class);
            ArgumentCaptor<LocalDate> end = ArgumentCaptor.forClass(LocalDate.class);
            verify(equipmentRepository).findAlertableByWarrantyExpiryBetween(
                    start.capture(), end.capture(), excludedStatusCaptor.capture());

            assertThat(start.getValue()).isEqualTo(LocalDate.now());
            assertThat(end.getValue()).isEqualTo(LocalDate.now().plusDays(90));
            assertThat(excludedStatusCaptor.getValue())
                    .containsExactlyInAnyOrder(EquipmentStatus.RETIRED, EquipmentStatus.DISPOSED);
        }

        @Test
        @DisplayName("never loads the whole equipment table")
        void doesNotScanEveryAsset() {
            givenCandidates();

            scheduler.runWarrantyAlertGeneration();

            verify(equipmentRepository, never()).findAll();
        }

        @Test
        @DisplayName("publishes nothing when no asset is inside the horizon")
        void publishesNothingForAnEmptyWindow() {
            givenCandidates();

            scheduler.runWarrantyAlertGeneration();

            verifyNoInteractions(eventPublisherService);
        }
    }

    @Nested
    @DisplayName("decommissioned assets")
    class DecommissionedAssets {

        @Test
        @DisplayName("a disposed asset inside the window raises no alert")
        void skipsDisposedAssets() {
            givenCandidates(asset(1L, "EQ-DISPOSED", EquipmentStatus.DISPOSED, 20));

            scheduler.runWarrantyAlertGeneration();

            verifyNoInteractions(eventPublisherService);
        }

        @Test
        @DisplayName("a retired asset inside the window raises no alert")
        void skipsRetiredAssets() {
            givenCandidates(asset(2L, "EQ-RETIRED", EquipmentStatus.RETIRED, 0));

            scheduler.runWarrantyAlertGeneration();

            verifyNoInteractions(eventPublisherService);
        }

        @Test
        @DisplayName("live assets in the same batch are still alerted")
        void stillAlertsLiveAssetsAlongsideDecommissionedOnes() {
            givenCandidates(
                    asset(3L, "EQ-DISPOSED", EquipmentStatus.DISPOSED, 10),
                    asset(4L, "EQ-LIVE", EquipmentStatus.ACTIVE, 10),
                    asset(5L, "EQ-RETIRED", EquipmentStatus.RETIRED, 10));

            scheduler.runWarrantyAlertGeneration();

            ArgumentCaptor<Long> entityId = ArgumentCaptor.forClass(Long.class);
            verify(eventPublisherService).publishEvent(
                    eq(HOSPITAL_ID),
                    eq(OperationsEvent.EventCategory.EQUIPMENT),
                    eq(OperationsEvent.EventType.EQUIPMENT_WARRANTY_EXPIRING),
                    anyString(),
                    anyString(),
                    entityId.capture(),
                    eq(OperationsEvent.EntityType.EQUIPMENT),
                    eq("system"),
                    any(OperationsEvent.EventSeverity.class));

            assertThat(entityId.getValue()).isEqualTo(4L);
        }

        @Test
        @DisplayName("an asset under maintenance is still part of the fleet and is alerted")
        void underMaintenanceIsStillInService() {
            givenCandidates(asset(6L, "EQ-WORKBENCH", EquipmentStatus.UNDER_MAINTENANCE, 25));

            scheduler.runWarrantyAlertGeneration();

            verify(eventPublisherService, times(1)).publishEvent(
                    anyLong(), any(), any(), anyString(), anyString(), anyLong(), any(), anyString(), any());
        }
    }

    @Nested
    @DisplayName("alert windows")
    class AlertWindows {

        private String detailFor(Equipment equipment) {
            givenCandidates(equipment);
            scheduler.runWarrantyAlertGeneration();

            ArgumentCaptor<String> detail = ArgumentCaptor.forClass(String.class);
            verify(eventPublisherService).publishEvent(
                    anyLong(), any(), any(), anyString(), detail.capture(), anyLong(), any(), anyString(), any());
            return detail.getValue();
        }

        @Test
        @DisplayName("15 days out falls into the 30-day window")
        void tightestWindowWins() {
            assertThat(detailFor(asset(10L, "EQ-15", EquipmentStatus.ACTIVE, 15)))
                    .contains("\"threshold\":30");
        }

        @Test
        @DisplayName("45 days out falls into the 60-day window")
        void sixtyDayWindow() {
            assertThat(detailFor(asset(11L, "EQ-45", EquipmentStatus.ACTIVE, 45)))
                    .contains("\"threshold\":60");
        }

        @Test
        @DisplayName("75 days out falls into the 90-day window")
        void ninetyDayWindow() {
            assertThat(detailFor(asset(12L, "EQ-75", EquipmentStatus.ACTIVE, 75)))
                    .contains("\"threshold\":90");
        }

        @Test
        @DisplayName("expiry day is its own window and is raised as CRITICAL")
        void expiryDayIsCritical() {
            givenCandidates(asset(13L, "EQ-TODAY", EquipmentStatus.ACTIVE, 0));

            scheduler.runWarrantyAlertGeneration();

            ArgumentCaptor<OperationsEvent.EventSeverity> severity =
                    ArgumentCaptor.forClass(OperationsEvent.EventSeverity.class);
            ArgumentCaptor<String> detail = ArgumentCaptor.forClass(String.class);
            verify(eventPublisherService).publishEvent(
                    anyLong(), any(), any(), anyString(), detail.capture(), anyLong(), any(), anyString(),
                    severity.capture());

            assertThat(detail.getValue()).contains("\"threshold\":0");
            assertThat(severity.getValue()).isEqualTo(OperationsEvent.EventSeverity.CRITICAL);
        }

        @Test
        @DisplayName("a warranty already past expiry is not re-alerted")
        void expiredAssetsAreNotReAlerted() {
            givenCandidates(asset(14L, "EQ-GONE", EquipmentStatus.ACTIVE, -1));

            scheduler.runWarrantyAlertGeneration();

            verifyNoInteractions(eventPublisherService);
        }
    }

    @Nested
    @DisplayName("idempotency")
    class Idempotency {

        @Test
        @DisplayName("an asset already alerted for this threshold is skipped")
        void suppressesADuplicateForTheSameThreshold() {
            Equipment equipment = asset(20L, "EQ-DUP", EquipmentStatus.ACTIVE, 20);
            givenCandidates(equipment);
            when(eventRepository.findByEntityTypeAndEntityIdOrderByCreatedAtDesc(
                    OperationsEvent.EntityType.EQUIPMENT, 20L))
                    .thenReturn(List.of(OperationsEvent.builder()
                            .type(OperationsEvent.EventType.EQUIPMENT_WARRANTY_EXPIRING)
                            .entityType(OperationsEvent.EntityType.EQUIPMENT)
                            .entityId(20L)
                            .detail("{\"equipmentCode\":\"EQ-DUP\",\"threshold\":30,"
                                    + "\"expiry\":\"" + equipment.getWarrantyExpiry() + "\"}")
                            .build()));

            scheduler.runWarrantyAlertGeneration();

            verifyNoInteractions(eventPublisherService);
        }

        @Test
        @DisplayName("an alert for a coarser threshold does not suppress the next window")
        void doesNotSuppressADifferentThreshold() {
            Equipment equipment = asset(21L, "EQ-NEXT", EquipmentStatus.ACTIVE, 20);
            givenCandidates(equipment);
            when(eventRepository.findByEntityTypeAndEntityIdOrderByCreatedAtDesc(
                    OperationsEvent.EntityType.EQUIPMENT, 21L))
                    .thenReturn(List.of(OperationsEvent.builder()
                            .type(OperationsEvent.EventType.EQUIPMENT_WARRANTY_EXPIRING)
                            .entityType(OperationsEvent.EntityType.EQUIPMENT)
                            .entityId(21L)
                            .detail("{\"equipmentCode\":\"EQ-NEXT\",\"threshold\":60}")
                            .build()));

            scheduler.runWarrantyAlertGeneration();

            verify(eventPublisherService, times(1)).publishEvent(
                    anyLong(), any(), any(), anyString(), anyString(), anyLong(), any(), anyString(), any());
        }

        @Test
        @DisplayName("an unrelated event type on the same asset does not suppress the alert")
        void ignoresUnrelatedEventTypes() {
            Equipment equipment = asset(22L, "EQ-OTHER", EquipmentStatus.ACTIVE, 20);
            givenCandidates(equipment);
            when(eventRepository.findByEntityTypeAndEntityIdOrderByCreatedAtDesc(
                    OperationsEvent.EntityType.EQUIPMENT, 22L))
                    .thenReturn(List.of(OperationsEvent.builder()
                            .type(OperationsEvent.EventType.EQUIPMENT_CREATED)
                            .entityType(OperationsEvent.EntityType.EQUIPMENT)
                            .entityId(22L)
                            .detail("{\"threshold\":30}")
                            .build()));

            scheduler.runWarrantyAlertGeneration();

            verify(eventPublisherService, times(1)).publishEvent(
                    anyLong(), any(), any(), anyString(), anyString(), anyLong(), any(), anyString(), any());
        }
    }

    @Nested
    @DisplayName("defensive guards")
    class DefensiveGuards {

        @Test
        @DisplayName("an asset with no hospital link is skipped rather than throwing")
        void skipsAssetsWithoutAHospital() {
            Equipment orphan = Equipment.builder()
                    .id(30L)
                    .equipmentCode("EQ-ORPHAN")
                    .name("Orphan")
                    .status(EquipmentStatus.ACTIVE)
                    .warrantyExpiry(LocalDate.now().plusDays(10))
                    .build();
            givenCandidates(orphan);

            scheduler.runWarrantyAlertGeneration();

            verifyNoInteractions(eventPublisherService);
        }

        @Test
        @DisplayName("an asset with no warranty date is skipped")
        void skipsAssetsWithoutAWarrantyDate() {
            Equipment noWarranty = Equipment.builder()
                    .id(31L)
                    .equipmentCode("EQ-NOWTY")
                    .name("No warranty")
                    .hospital(hospital)
                    .status(EquipmentStatus.ACTIVE)
                    .build();
            givenCandidates(noWarranty);

            scheduler.runWarrantyAlertGeneration();

            verifyNoInteractions(eventPublisherService);
        }
    }
}

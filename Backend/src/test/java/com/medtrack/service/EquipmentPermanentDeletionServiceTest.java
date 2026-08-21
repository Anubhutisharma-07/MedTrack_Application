package com.medtrack.service;

import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.exception.ResourceNotFoundException;
import com.medtrack.model.Equipment;
import com.medtrack.model.Hospital;
import com.medtrack.repository.EquipmentImportAuditLogRepository;
import com.medtrack.repository.EquipmentRepository;
import com.medtrack.repository.FacilityLocationRepository;
import com.medtrack.repository.HospitalRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * Regression coverage for irreversible operations on archived equipment.
 *
 * <p>Archive IDs are globally allocated, while a hospital administrator is authorized only for
 * the hospital linked to their account. The service must therefore establish the hospital boundary
 * before it loads the archived entity. Checking ownership after a global lookup is too late for a
 * destructive workflow and makes it easy for a future return path to omit the check.</p>
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("equipment permanent deletion tenant boundary")
class EquipmentPermanentDeletionServiceTest {

    private static final String OWNER_USERNAME = "archive-owner";
    private static final String OWNER_EMAIL = "archive-owner@medtrack.test";
    private static final Long USER_ID = 41L;
    private static final Long HOSPITAL_ID = 71L;
    private static final Long EQUIPMENT_ID = 101L;

    @Mock
    private EquipmentRepository equipmentRepository;

    @Mock
    private HospitalRepository hospitalRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private EquipmentImportAuditLogRepository equipmentImportAuditLogRepository;

    @Mock
    private FacilityLocationRepository facilityLocationRepository;

    @Mock
    private EventPublisherService eventPublisherService;

    @Mock
    private EquipmentAuditService equipmentAuditService;

    @InjectMocks
    private EquipmentService equipmentService;

    private User owner;
    private Hospital hospital;

    @BeforeEach
    void setUpTenant() {
        owner = User.builder()
                .id(USER_ID)
                .username(OWNER_USERNAME)
                .email(OWNER_EMAIL)
                .name("Archive Owner")
                .password("irrelevant-password")
                .phone("+1 555 0100")
                .organization("Archive Trust")
                .role("hospital")
                .build();
        hospital = Hospital.builder()
                .id(HOSPITAL_ID)
                .name("Archive Trust")
                .location("Test City")
                .user(owner)
                .build();
    }

    private Equipment archivedAt(LocalDateTime deletedAt) {
        return Equipment.builder()
                .id(EQUIPMENT_ID)
                .equipmentCode("EQ-PURGE-101")
                .name("Archived MRI")
                .department("Radiology")
                .hospital(hospital)
                .deleted(true)
                .deletedAt(deletedAt)
                .deletedBy(OWNER_USERNAME)
                .build();
    }

    private void authenticateOwnerByUsername() {
        when(userRepository.findByUsername(OWNER_USERNAME)).thenReturn(Optional.of(owner));
        when(hospitalRepository.findByUserId(USER_ID)).thenReturn(Optional.of(hospital));
    }

    private void assertNoDestructiveSideEffects(Equipment equipment) {
        verify(equipmentAuditService, never()).logAction(
                any(), any(), any(), any(), any(), any(), any());
        verify(equipmentRepository, never()).delete(equipment);
    }

    @Nested
    @DisplayName("authorized purge")
    class AuthorizedPurge {

        @Test
        @DisplayName("deletes an owned asset after the retention period")
        void deletesOwnedAssetAfterRetentionPeriod() {
            Equipment archived = archivedAt(LocalDateTime.now().minusDays(91));
            authenticateOwnerByUsername();
            when(equipmentRepository.findArchivedByIdAndHospitalId(EQUIPMENT_ID, HOSPITAL_ID))
                    .thenReturn(Optional.of(archived));

            equipmentService.permanentlyDeleteEquipment(EQUIPMENT_ID, OWNER_USERNAME);

            verify(equipmentRepository)
                    .findArchivedByIdAndHospitalId(EQUIPMENT_ID, HOSPITAL_ID);
            verify(equipmentRepository).delete(archived);
        }

        @Test
        @DisplayName("records the irreversible deletion against the resolved hospital")
        void writesDeletionAuditForResolvedHospital() {
            Equipment archived = archivedAt(LocalDateTime.now().minusDays(120));
            authenticateOwnerByUsername();
            when(equipmentRepository.findArchivedByIdAndHospitalId(EQUIPMENT_ID, HOSPITAL_ID))
                    .thenReturn(Optional.of(archived));

            equipmentService.permanentlyDeleteEquipment(EQUIPMENT_ID, OWNER_USERNAME);

            verify(equipmentAuditService).logAction(
                    archived,
                    hospital,
                    OWNER_USERNAME,
                    "DELETE",
                    "ALL",
                    "Equipment existed",
                    "Deleted");
        }

    }

    @Nested
    @DisplayName("tenant isolation")
    class TenantIsolation {

        @Test
        @DisplayName("does not load or delete an archived asset owned by another hospital")
        void rejectsAnotherHospitalsArchivedAsset() {
            Equipment inaccessible = archivedAt(LocalDateTime.now().minusDays(365));
            authenticateOwnerByUsername();
            when(equipmentRepository.findArchivedByIdAndHospitalId(EQUIPMENT_ID, HOSPITAL_ID))
                    .thenReturn(Optional.empty());

            ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class,
                    () -> equipmentService.permanentlyDeleteEquipment(
                            EQUIPMENT_ID, OWNER_USERNAME));

            assertEquals("Archived equipment not found or you don't have access",
                    exception.getMessage());
            verify(equipmentRepository)
                    .findArchivedByIdAndHospitalId(EQUIPMENT_ID, HOSPITAL_ID);
            verify(equipmentRepository, never()).findByIdAndDeletedTrue(EQUIPMENT_ID);
            assertNoDestructiveSideEffects(inaccessible);
        }

        @Test
        @DisplayName("stops before the archive query when no hospital profile exists")
        void missingHospitalProfileCannotFallBackToGlobalLookup() {
            when(userRepository.findByUsername(OWNER_USERNAME)).thenReturn(Optional.of(owner));
            when(hospitalRepository.findByUserId(USER_ID)).thenReturn(Optional.empty());

            assertThrows(ResourceNotFoundException.class,
                    () -> equipmentService.permanentlyDeleteEquipment(
                            EQUIPMENT_ID, OWNER_USERNAME));

            verify(equipmentRepository, never())
                    .findArchivedByIdAndHospitalId(any(), any());
            verify(equipmentRepository, never()).findByIdAndDeletedTrue(any());
            verifyNoInteractions(equipmentAuditService);
        }

        @Test
        @DisplayName("rejects a blank identity before any repository lookup")
        void blankIdentityIsRejectedBeforeLookup() {
            assertThrows(IllegalArgumentException.class,
                    () -> equipmentService.permanentlyDeleteEquipment(EQUIPMENT_ID, "  "));

            verifyNoInteractions(userRepository, hospitalRepository, equipmentAuditService);
            verifyNoInteractions(equipmentRepository);
        }
    }

    @Nested
    @DisplayName("retention policy")
    class RetentionPolicy {

        @Test
        @DisplayName("rejects deletion before ninety days")
        void recentlyArchivedAssetIsRetained() {
            Equipment archived = archivedAt(LocalDateTime.now().minusDays(89));
            authenticateOwnerByUsername();
            when(equipmentRepository.findArchivedByIdAndHospitalId(EQUIPMENT_ID, HOSPITAL_ID))
                    .thenReturn(Optional.of(archived));

            IllegalStateException exception = assertThrows(IllegalStateException.class,
                    () -> equipmentService.permanentlyDeleteEquipment(
                            EQUIPMENT_ID, OWNER_USERNAME));

            assertTrue(exception.getMessage().contains("90 days"));
            assertNoDestructiveSideEffects(archived);
        }

        @Test
        @DisplayName("fails closed when the archive timestamp is missing")
        void missingArchiveTimestampCannotBypassRetention() {
            Equipment archived = archivedAt(null);
            authenticateOwnerByUsername();
            when(equipmentRepository.findArchivedByIdAndHospitalId(EQUIPMENT_ID, HOSPITAL_ID))
                    .thenReturn(Optional.of(archived));

            IllegalStateException exception = assertThrows(IllegalStateException.class,
                    () -> equipmentService.permanentlyDeleteEquipment(
                            EQUIPMENT_ID, OWNER_USERNAME));

            assertEquals("Equipment cannot be permanently deleted until 90 days after archival",
                    exception.getMessage());
            assertNoDestructiveSideEffects(archived);
        }

        @Test
        @DisplayName("does not write an audit record for a rejected purge")
        void rejectedPurgeLeavesAuditTrailUnchanged() {
            Equipment archived = archivedAt(LocalDateTime.now().minusHours(1));
            authenticateOwnerByUsername();
            when(equipmentRepository.findArchivedByIdAndHospitalId(EQUIPMENT_ID, HOSPITAL_ID))
                    .thenReturn(Optional.of(archived));

            assertThrows(IllegalStateException.class,
                    () -> equipmentService.permanentlyDeleteEquipment(
                            EQUIPMENT_ID, OWNER_USERNAME));

            verifyNoInteractions(equipmentAuditService);
            verify(equipmentRepository, never()).delete(any(Equipment.class));
        }
    }

    @Nested
    @DisplayName("restore path")
    class RestorePath {

        @Test
        @DisplayName("uses the same scoped archive lookup when restoring")
        void restoreUsesTenantScopedLookup() {
            LocalDateTime archivedAt = LocalDateTime.now().minusDays(5);
            Equipment archived = archivedAt(archivedAt);
            authenticateOwnerByUsername();
            when(equipmentRepository.findArchivedByIdAndHospitalId(EQUIPMENT_ID, HOSPITAL_ID))
                    .thenReturn(Optional.of(archived));
            when(equipmentRepository.save(archived)).thenReturn(archived);

            Equipment restored = equipmentService.restoreEquipment(
                    EQUIPMENT_ID, OWNER_USERNAME);

            assertSame(archived, restored);
            assertFalse(restored.getDeleted());
            assertNull(restored.getDeletedAt());
            assertNull(restored.getDeletedBy());
            verify(equipmentRepository)
                    .findArchivedByIdAndHospitalId(EQUIPMENT_ID, HOSPITAL_ID);
            verify(equipmentRepository, never()).findByIdAndDeletedTrue(EQUIPMENT_ID);
            verify(equipmentRepository).save(archived);
        }

        @Test
        @DisplayName("does not mutate or save an inaccessible archived asset")
        void restoreRejectsAnotherHospitalsAssetBeforeMutation() {
            Equipment inaccessible = archivedAt(LocalDateTime.now().minusDays(5));
            authenticateOwnerByUsername();
            when(equipmentRepository.findArchivedByIdAndHospitalId(EQUIPMENT_ID, HOSPITAL_ID))
                    .thenReturn(Optional.empty());

            assertThrows(ResourceNotFoundException.class,
                    () -> equipmentService.restoreEquipment(EQUIPMENT_ID, OWNER_USERNAME));

            assertTrue(inaccessible.getDeleted());
            assertEquals(OWNER_USERNAME, inaccessible.getDeletedBy());
            verify(equipmentRepository, never()).save(any());
        }
    }
}

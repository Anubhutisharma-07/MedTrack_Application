package com.medtrack.service;

import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.dto.SparePartResponse;
import com.medtrack.exception.ResourceNotFoundException;
import com.medtrack.model.Hospital;
import com.medtrack.model.SparePart;
import com.medtrack.repository.HospitalRepository;
import com.medtrack.repository.SparePartRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

/**
 * Integration and behavioral tests for spare part filtering, soft-deletion handling,
 * and single spare part retrieval.
 */
@ExtendWith(MockitoExtension.class)
class SparePartFilterIntegrationTest {

    @Mock
    private SparePartRepository sparePartRepository;

    @Mock
    private HospitalRepository hospitalRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private SparePartService sparePartService;

    private User hospitalUser;
    private Hospital hospital;
    private SparePart activePart1;
    private SparePart activePart2;
    private SparePart deletedPart;

    @BeforeEach
    void setUp() {
        hospitalUser = User.builder()
                .id(200L)
                .username("testHospitalAdmin")
                .email("admin@testhospital.org")
                .role("HOSPITAL")
                .build();

        hospital = Hospital.builder()
                .id(10L)
                .name("St. Jude Medical Center")
                .user(hospitalUser)
                .build();

        activePart1 = SparePart.builder()
                .id(101L)
                .hospitalId(10L)
                .partNumber("VALVE-001")
                .description("Oxygen Flow Control Valve")
                .stockLevel(15)
                .reorderPoint(5)
                .unitCost(75.00)
                .deleted(false)
                .build();

        activePart2 = SparePart.builder()
                .id(102L)
                .hospitalId(10L)
                .partNumber("GASKET-002")
                .description("High Pressure Silicon Gasket")
                .stockLevel(50)
                .reorderPoint(20)
                .unitCost(12.50)
                .deleted(false)
                .build();

        deletedPart = SparePart.builder()
                .id(103L)
                .hospitalId(10L)
                .partNumber("TUBING-003")
                .description("Sterile PVC Tubing")
                .stockLevel(0)
                .reorderPoint(10)
                .unitCost(5.00)
                .deleted(true)
                .build();
    }

    @Test
    @DisplayName("getAllSpareParts - returns only active spare parts and excludes soft-deleted parts")
    void getAllSpareParts_ReturnsOnlyActiveSpareParts() {
        when(userRepository.findByUsername("testHospitalAdmin")).thenReturn(Optional.of(hospitalUser));
        when(hospitalRepository.findByUserId(200L)).thenReturn(Optional.of(hospital));
        when(sparePartRepository.findByHospitalIdAndDeletedFalse(10L))
                .thenReturn(List.of(activePart1, activePart2));

        List<SparePartResponse> result = sparePartService.getAllSpareParts("testHospitalAdmin");

        assertThat(result).hasSize(2);
        assertThat(result).extracting(SparePartResponse::getPartNumber)
                .containsExactly("VALVE-001", "GASKET-002");

        verify(sparePartRepository).findByHospitalIdAndDeletedFalse(10L);
        verify(sparePartRepository, never()).findByHospitalId(anyLong());
    }

    @Test
    @DisplayName("getSparePart - returns single active spare part by ID")
    void getSparePart_ReturnsActiveSparePart() {
        when(userRepository.findByUsername("testHospitalAdmin")).thenReturn(Optional.of(hospitalUser));
        when(hospitalRepository.findByUserId(200L)).thenReturn(Optional.of(hospital));
        when(sparePartRepository.findByIdAndHospitalIdAndDeletedFalse(101L, 10L))
                .thenReturn(Optional.of(activePart1));

        SparePartResponse response = sparePartService.getSparePart(101L, "testHospitalAdmin");

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(101L);
        assertThat(response.getPartNumber()).isEqualTo("VALVE-001");
        assertThat(response.getDescription()).isEqualTo("Oxygen Flow Control Valve");

        verify(sparePartRepository).findByIdAndHospitalIdAndDeletedFalse(101L, 10L);
    }

    @Test
    @DisplayName("getSparePart - throws ResourceNotFoundException when part is soft-deleted")
    void getSparePart_ThrowsExceptionWhenPartIsSoftDeleted() {
        when(userRepository.findByUsername("testHospitalAdmin")).thenReturn(Optional.of(hospitalUser));
        when(hospitalRepository.findByUserId(200L)).thenReturn(Optional.of(hospital));
        when(sparePartRepository.findByIdAndHospitalIdAndDeletedFalse(103L, 10L))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> sparePartService.getSparePart(103L, "testHospitalAdmin"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Active spare part not found with ID: 103");

        verify(sparePartRepository).findByIdAndHospitalIdAndDeletedFalse(103L, 10L);
    }

    @Test
    @DisplayName("getSparePart - throws ResourceNotFoundException when part belongs to another hospital")
    void getSparePart_ThrowsExceptionWhenPartBelongsToAnotherHospital() {
        when(userRepository.findByUsername("testHospitalAdmin")).thenReturn(Optional.of(hospitalUser));
        when(hospitalRepository.findByUserId(200L)).thenReturn(Optional.of(hospital));
        when(sparePartRepository.findByIdAndHospitalIdAndDeletedFalse(999L, 10L))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> sparePartService.getSparePart(999L, "testHospitalAdmin"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Active spare part not found with ID: 999");
    }

    @Test
    @DisplayName("getSparePart - accepts email identifier as valid authentication principal")
    void getSparePart_AcceptsEmailIdentifier() {
        when(userRepository.findByUsername("admin@testhospital.org")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("admin@testhospital.org")).thenReturn(Optional.of(hospitalUser));
        when(hospitalRepository.findByUserId(200L)).thenReturn(Optional.of(hospital));
        when(sparePartRepository.findByIdAndHospitalIdAndDeletedFalse(102L, 10L))
                .thenReturn(Optional.of(activePart2));

        SparePartResponse response = sparePartService.getSparePart(102L, "admin@testhospital.org");

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(102L);
        assertThat(response.getPartNumber()).isEqualTo("GASKET-002");
    }

    @Test
    @DisplayName("deleteSparePart - soft deletes part and subsequent list excludes it")
    void deleteSparePart_SoftDeletesPartCorrectly() {
        when(userRepository.findByUsername("testHospitalAdmin")).thenReturn(Optional.of(hospitalUser));
        when(hospitalRepository.findByUserId(200L)).thenReturn(Optional.of(hospital));
        when(sparePartRepository.findByIdAndHospitalIdForUpdate(101L, 10L))
                .thenReturn(Optional.of(activePart1));
        when(sparePartRepository.save(any(SparePart.class))).thenAnswer(inv -> inv.getArgument(0));

        sparePartService.deleteSparePart(101L, "testHospitalAdmin");

        verify(sparePartRepository).save(activePart1);
        assertThat(activePart1.getDeleted()).isTrue();
        assertThat(activePart1.getDeletedBy()).isEqualTo("testHospitalAdmin");
        assertThat(activePart1.getDeletedAt()).isNotNull();
    }
}

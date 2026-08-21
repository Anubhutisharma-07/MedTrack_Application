package com.medtrack.service;

import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.model.Equipment;
import com.medtrack.model.EquipmentStatus;
import com.medtrack.model.Hospital;
import com.medtrack.repository.EquipmentImportAuditLogRepository;
import com.medtrack.repository.EquipmentRepository;
import com.medtrack.repository.FacilityLocationRepository;
import com.medtrack.repository.HospitalRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EquipmentTenantUniquenessTest {

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

    private Hospital hospitalA;
    private Hospital hospitalB;
    private User userA;
    private User userB;

    @BeforeEach
    void setUp() {
        hospitalA = Hospital.builder()
                .id(1L)
                .name("City General Hospital")
                .build();

        hospitalB = Hospital.builder()
                .id(2L)
                .name("St. Jude Medical Center")
                .build();

        userA = User.builder()
                .id(101L)
                .username("admin_city")
                .email("admin@cityhospital.org")
                .build();

        userB = User.builder()
                .id(102L)
                .username("admin_stjude")
                .email("admin@stjude.org")
                .build();
    }

    @Test
    void addEquipment_AllowsSameCodeAndSerialInDifferentHospitals() {
        when(userRepository.findByUsername("admin_city")).thenReturn(Optional.of(userA));
        when(hospitalRepository.findByUserId(101L)).thenReturn(Optional.of(hospitalA));

        when(equipmentRepository.findByHospitalIdAndEquipmentCode(1L, "EQ-COMMON-100"))
                .thenReturn(Optional.empty());
        when(equipmentRepository.findByHospitalIdAndSerialNumber(1L, "SN-COMMON-999"))
                .thenReturn(Optional.empty());

        Equipment newAsset = Equipment.builder()
                .equipmentCode("EQ-COMMON-100")
                .serialNumber("SN-COMMON-999")
                .name("Ventilator A")
                .build();

        when(equipmentRepository.save(any(Equipment.class))).thenAnswer(invocation -> {
            Equipment entity = invocation.getArgument(0);
            entity.setId(10L);
            return entity;
        });

        Equipment result = equipmentService.addEquipment(newAsset, "admin_city");

        assertNotNull(result);
        assertEquals(10L, result.getId());
        assertEquals("EQ-COMMON-100", result.getEquipmentCode());
        assertEquals(hospitalA, result.getHospital());
        verify(equipmentRepository).findByHospitalIdAndEquipmentCode(1L, "EQ-COMMON-100");
        verify(equipmentRepository).findByHospitalIdAndSerialNumber(1L, "SN-COMMON-999");
        verify(equipmentRepository, never()).findByEquipmentCode(any());
        verify(equipmentRepository, never()).findBySerialNumber(any());
    }

    @Test
    void addEquipment_RejectsDuplicateCodeInSameHospital() {
        when(userRepository.findByUsername("admin_city")).thenReturn(Optional.of(userA));
        when(hospitalRepository.findByUserId(101L)).thenReturn(Optional.of(hospitalA));

        Equipment existingAsset = Equipment.builder()
                .id(5L)
                .hospital(hospitalA)
                .equipmentCode("EQ-DUP-100")
                .build();

        when(equipmentRepository.findByHospitalIdAndEquipmentCode(1L, "EQ-DUP-100"))
                .thenReturn(Optional.of(existingAsset));

        Equipment newAsset = Equipment.builder()
                .equipmentCode("EQ-DUP-100")
                .name("Infusion Pump")
                .build();

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> equipmentService.addEquipment(newAsset, "admin_city")
        );

        assertEquals("Equipment Code already exists.", exception.getMessage());
        verify(equipmentRepository).findByHospitalIdAndEquipmentCode(1L, "EQ-DUP-100");
        verify(equipmentRepository, never()).save(any());
    }

    @Test
    void addEquipment_RejectsDuplicateSerialInSameHospital() {
        when(userRepository.findByUsername("admin_city")).thenReturn(Optional.of(userA));
        when(hospitalRepository.findByUserId(101L)).thenReturn(Optional.of(hospitalA));

        when(equipmentRepository.findByHospitalIdAndEquipmentCode(1L, "EQ-NEW-200"))
                .thenReturn(Optional.empty());

        Equipment existingAsset = Equipment.builder()
                .id(6L)
                .hospital(hospitalA)
                .serialNumber("SN-DUP-888")
                .build();

        when(equipmentRepository.findByHospitalIdAndSerialNumber(1L, "SN-DUP-888"))
                .thenReturn(Optional.of(existingAsset));

        Equipment newAsset = Equipment.builder()
                .equipmentCode("EQ-NEW-200")
                .serialNumber("SN-DUP-888")
                .name("ECG Monitor")
                .build();

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> equipmentService.addEquipment(newAsset, "admin_city")
        );

        assertEquals("Serial Number already exists.", exception.getMessage());
        verify(equipmentRepository).findByHospitalIdAndSerialNumber(1L, "SN-DUP-888");
        verify(equipmentRepository, never()).save(any());
    }

    @Test
    void updateEquipment_AllowsSameAssetToKeepOwnCodeAndSerial() {
        when(userRepository.findByUsername("admin_city")).thenReturn(Optional.of(userA));
        when(hospitalRepository.findByUserId(101L)).thenReturn(Optional.of(hospitalA));

        Equipment existing = Equipment.builder()
                .id(15L)
                .hospital(hospitalA)
                .equipmentCode("EQ-15")
                .serialNumber("SN-15")
                .name("Defibrillator")
                .status(EquipmentStatus.ACTIVE)
                .build();

        when(equipmentRepository.findByIdAndHospitalId(15L, 1L)).thenReturn(Optional.of(existing));
        when(equipmentRepository.findByHospitalIdAndEquipmentCode(1L, "EQ-15"))
                .thenReturn(Optional.of(existing));
        when(equipmentRepository.findByHospitalIdAndSerialNumber(1L, "SN-15"))
                .thenReturn(Optional.of(existing));
        when(equipmentRepository.save(any(Equipment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Equipment details = Equipment.builder()
                .equipmentCode("EQ-15")
                .serialNumber("SN-15")
                .name("Defibrillator Updated")
                .build();

        Equipment result = equipmentService.updateEquipment(15L, details, "admin_city");

        assertNotNull(result);
        assertEquals("Defibrillator Updated", result.getName());
        verify(equipmentRepository).findByHospitalIdAndEquipmentCode(1L, "EQ-15");
        verify(equipmentRepository).findByHospitalIdAndSerialNumber(1L, "SN-15");
    }

    @Test
    void updateEquipment_RejectsDuplicateCodeBelongingToAnotherAssetInSameHospital() {
        when(userRepository.findByUsername("admin_city")).thenReturn(Optional.of(userA));
        when(hospitalRepository.findByUserId(101L)).thenReturn(Optional.of(hospitalA));

        Equipment existingTarget = Equipment.builder()
                .id(15L)
                .hospital(hospitalA)
                .equipmentCode("EQ-15")
                .name("Defibrillator 1")
                .build();

        Equipment otherAsset = Equipment.builder()
                .id(20L)
                .hospital(hospitalA)
                .equipmentCode("EQ-TAKEN")
                .name("Defibrillator 2")
                .build();

        when(equipmentRepository.findByIdAndHospitalId(15L, 1L)).thenReturn(Optional.of(existingTarget));
        when(equipmentRepository.findByHospitalIdAndEquipmentCode(1L, "EQ-TAKEN"))
                .thenReturn(Optional.of(otherAsset));

        Equipment details = Equipment.builder()
                .equipmentCode("EQ-TAKEN")
                .build();

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> equipmentService.updateEquipment(15L, details, "admin_city")
        );

        assertEquals("Equipment Code already exists.", exception.getMessage());
    }

    @Test
    void updateEquipment_RejectsDuplicateSerialBelongingToAnotherAssetInSameHospital() {
        when(userRepository.findByUsername("admin_city")).thenReturn(Optional.of(userA));
        when(hospitalRepository.findByUserId(101L)).thenReturn(Optional.of(hospitalA));

        Equipment existingTarget = Equipment.builder()
                .id(15L)
                .hospital(hospitalA)
                .serialNumber("SN-15")
                .name("Ultrasound 1")
                .build();

        Equipment otherAsset = Equipment.builder()
                .id(25L)
                .hospital(hospitalA)
                .serialNumber("SN-TAKEN")
                .name("Ultrasound 2")
                .build();

        when(equipmentRepository.findByIdAndHospitalId(15L, 1L)).thenReturn(Optional.of(existingTarget));
        when(equipmentRepository.findByHospitalIdAndEquipmentCode(1L, "EQ-15"))
                .thenReturn(Optional.of(existingTarget));
        when(equipmentRepository.findByHospitalIdAndSerialNumber(1L, "SN-TAKEN"))
                .thenReturn(Optional.of(otherAsset));

        Equipment details = Equipment.builder()
                .equipmentCode("EQ-15")
                .serialNumber("SN-TAKEN")
                .build();

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> equipmentService.updateEquipment(15L, details, "admin_city")
        );

        assertEquals("Serial Number already exists.", exception.getMessage());
    }

    @Test
    void addEquipment_TrimsWhitespaceBeforeUniquenessCheck() {
        when(userRepository.findByUsername("admin_city")).thenReturn(Optional.of(userA));
        when(hospitalRepository.findByUserId(101L)).thenReturn(Optional.of(hospitalA));

        when(equipmentRepository.findByHospitalIdAndEquipmentCode(1L, "EQ-TRIMMED"))
                .thenReturn(Optional.empty());
        when(equipmentRepository.findByHospitalIdAndSerialNumber(1L, "SN-TRIMMED"))
                .thenReturn(Optional.empty());

        Equipment newAsset = Equipment.builder()
                .equipmentCode("  EQ-TRIMMED  ")
                .serialNumber("  SN-TRIMMED  ")
                .name("Patient Monitor")
                .build();

        when(equipmentRepository.save(any(Equipment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Equipment result = equipmentService.addEquipment(newAsset, "admin_city");

        assertNotNull(result);
        verify(equipmentRepository).findByHospitalIdAndEquipmentCode(1L, "EQ-TRIMMED");
        verify(equipmentRepository).findByHospitalIdAndSerialNumber(1L, "SN-TRIMMED");
    }
}

package com.medtrack.service;

import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.dto.EquipmentAuditResponse;
import com.medtrack.exception.ResourceNotFoundException;
import com.medtrack.model.Equipment;
import com.medtrack.model.EquipmentAudit;
import com.medtrack.model.Hospital;
import com.medtrack.repository.EquipmentAuditRepository;
import com.medtrack.repository.EquipmentRepository;
import com.medtrack.repository.HospitalRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EquipmentAuditServiceTest {

    @Mock
    private EquipmentAuditRepository equipmentAuditRepository;

    @Mock
    private EquipmentRepository equipmentRepository;

    @Mock
    private HospitalRepository hospitalRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private EquipmentAuditService auditService;

    private User user;
    private Hospital hospital;
    private Equipment equipment;
    private EquipmentAudit audit;

    @BeforeEach
    void setUp() {
        user = User.builder().id(10L).username("hospital_admin").email("admin@hospital.com").build();
        hospital = Hospital.builder().id(1L).name("General Hospital").user(user).build();
        equipment = Equipment.builder().id(100L).equipmentCode("EQ-100").name("X-Ray Machine").hospital(hospital).build();
        audit = EquipmentAudit.builder()
                .id(50L)
                .equipmentId(100L)
                .hospital(hospital)
                .username("hospital_admin")
                .action("UPDATE")
                .changedFields("status")
                .previousValue("UNDER_MAINTENANCE")
                .newValue("ACTIVE")
                .timestamp(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("getEquipmentHistory with username returns tenant-isolated audit logs for owned equipment")
    void getEquipmentHistory_Success() {
        when(userRepository.findByUsername("hospital_admin")).thenReturn(Optional.of(user));
        when(hospitalRepository.findByUserId(10L)).thenReturn(Optional.of(hospital));
        when(equipmentRepository.findByIdAndHospitalId(100L, 1L)).thenReturn(Optional.of(equipment));
        when(equipmentAuditRepository.findByEquipmentIdAndHospitalIdOrderByTimestampDesc(100L, 1L))
                .thenReturn(List.of(audit));

        List<EquipmentAuditResponse> responses = auditService.getEquipmentHistory(100L, "hospital_admin");

        assertThat(responses).hasSize(1);
        assertThat(responses.get(0).getEquipmentId()).isEqualTo(100L);
        assertThat(responses.get(0).getAction()).isEqualTo("UPDATE");
        verify(equipmentRepository).findByIdAndHospitalId(100L, 1L);
        verify(equipmentAuditRepository).findByEquipmentIdAndHospitalIdOrderByTimestampDesc(100L, 1L);
    }

    @Test
    @DisplayName("getEquipmentHistory throws ResourceNotFoundException when equipment belongs to another hospital")
    void getEquipmentHistory_CrossTenantAccessDenied() {
        when(userRepository.findByUsername("hospital_admin")).thenReturn(Optional.of(user));
        when(hospitalRepository.findByUserId(10L)).thenReturn(Optional.of(hospital));
        when(equipmentRepository.findByIdAndHospitalId(999L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> auditService.getEquipmentHistory(999L, "hospital_admin"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Equipment not found or access denied");
    }

    @Test
    @DisplayName("getHospitalHistory with username returns hospital audit logs for authenticated tenant")
    void getHospitalHistory_Success() {
        when(userRepository.findByUsername("hospital_admin")).thenReturn(Optional.of(user));
        when(hospitalRepository.findByUserId(10L)).thenReturn(Optional.of(hospital));
        when(equipmentAuditRepository.findByHospitalIdOrderByTimestampDesc(1L)).thenReturn(List.of(audit));

        List<EquipmentAuditResponse> responses = auditService.getHospitalHistory("hospital_admin");

        assertThat(responses).hasSize(1);
        assertThat(responses.get(0).getUsername()).isEqualTo("hospital_admin");
    }

    @Test
    @DisplayName("logAction persists audit record to repository")
    void logAction_PersistsEntity() {
        auditService.logAction(equipment, hospital, "hospital_admin", "CREATE", "name", null, "X-Ray Machine");
        verify(equipmentAuditRepository).save(any(EquipmentAudit.class));
    }
}

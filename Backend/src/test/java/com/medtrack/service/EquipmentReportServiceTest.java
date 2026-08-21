package com.medtrack.service;

import com.medtrack.dto.EquipmentReportRequest;
import com.medtrack.dto.EquipmentReportResponse;
import com.medtrack.exception.ResourceNotFoundException;
import com.medtrack.model.Equipment;
import com.medtrack.model.EquipmentCategory;
import com.medtrack.model.EquipmentStatus;
import com.medtrack.model.Hospital;
import com.medtrack.repository.EquipmentRepository;
import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.repository.HospitalRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EquipmentReportServiceTest {

    @Mock
    private EquipmentRepository equipmentRepository;

    @Mock
    private HospitalRepository hospitalRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private EquipmentReportService equipmentReportService;

    private User hospitalUser;
    private Hospital hospital;
    private Equipment eq1;
    private Equipment eq2;

    @BeforeEach
    void setUp() {
        hospitalUser = User.builder().id(11L).username("hospital_user").email("hospital@city.test").build();
        hospital = Hospital.builder().id(1L).user(hospitalUser).name("City General").build();

        eq1 = Equipment.builder()
                .id(101L)
                .hospital(hospital)
                .name("Ventilator X1")
                .department("ICU")
                .category(EquipmentCategory.RESPIRATORY)
                .status(EquipmentStatus.ACTIVE)
                .model("MedTech V-Series")
                .purchaseDate(LocalDate.now().minusMonths(6))
                .warrantyExpiry(LocalDate.now().plusMonths(6))
                .quantity(5)
                .minimumStock(2)
                .build();

        eq2 = Equipment.builder()
                .id(102L)
                .hospital(hospital)
                .name("Defibrillator D2")
                .department("Emergency")
                .category(EquipmentCategory.MONITORING)
                .status(EquipmentStatus.UNDER_MAINTENANCE)
                .model("BioCare D2")
                .purchaseDate(LocalDate.now().minusYears(2))
                .warrantyExpiry(LocalDate.now().minusDays(10))
                .quantity(1)
                .minimumStock(3)
                .build();
    }

    @Test
    void generateReport_returnsFilteredSummarySuccessfully() {
        when(userRepository.findByUsername("hospital_user")).thenReturn(Optional.of(hospitalUser));
        when(hospitalRepository.findByUserId(11L)).thenReturn(Optional.of(hospital));
        when(equipmentRepository.findByHospitalId(1L)).thenReturn(List.of(eq1, eq2));

        EquipmentReportRequest request = EquipmentReportRequest.builder()
                .department("ICU")
                .build();

        EquipmentReportResponse response = equipmentReportService.generateReport(request, "hospital_user");

        assertThat(response).isNotNull();
        assertThat(response.getSummary().getTotalEquipment()).isEqualTo(1);
        assertThat(response.getSummary().getActive()).isEqualTo(1);
        assertThat(response.getEquipment()).containsExactly(eq1);
    }

    @Test
    void generateReport_throwsExceptionWhenHospitalNotFound() {
        when(userRepository.findByUsername("unknown")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("unknown")).thenReturn(Optional.empty());

        EquipmentReportRequest request = new EquipmentReportRequest();

        assertThatThrownBy(() -> equipmentReportService.generateReport(request, "unknown"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Hospital not found");
    }
}

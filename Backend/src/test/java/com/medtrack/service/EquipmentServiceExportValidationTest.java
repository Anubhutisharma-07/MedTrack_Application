package com.medtrack.service;

import com.medtrack.exception.ResourceNotFoundException;
import com.medtrack.model.Equipment;
import com.medtrack.model.Hospital;
import com.medtrack.model.User;
import com.medtrack.repository.EquipmentRepository;
import com.medtrack.repository.HospitalRepository;
import com.medtrack.repository.UserRepository;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.IOException;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.Optional;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class EquipmentServiceExportValidationTest {

    @Mock
    private EquipmentRepository equipmentRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private HospitalRepository hospitalRepository;

    @Mock
    private HttpServletResponse response;

    @InjectMocks
    private EquipmentService equipmentService;

    private Hospital hospital;
    private User user;
    private PrintWriter printWriter;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(2L);

        hospital = new Hospital();
        hospital.setId(1L);
        hospital.setName("Test Hospital");

        printWriter = new PrintWriter(new StringWriter());
    }

    @Test
    void exportEquipmentCsv_EmptyResult_ShouldThrowException() throws IOException {
        String username = "testuser";
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(user));
        when(hospitalRepository.findByUserId(user.getId())).thenReturn(Optional.of(hospital));
        when(equipmentRepository.countByHospitalId(hospital.getId())).thenReturn(0L);

        assertThrows(ResourceNotFoundException.class, () -> {
            equipmentService.exportEquipmentCsv(username, response);
        });

        // Ensure response is not modified
        verify(response, never()).setContentType(org.mockito.ArgumentMatchers.anyString());
        verify(response, never()).setHeader(org.mockito.ArgumentMatchers.anyString(), org.mockito.ArgumentMatchers.anyString());
        verify(response, never()).getWriter();
    }

    @Test
    void exportEquipmentCsv_ValidResult_ShouldExportCsv() throws IOException {
        String username = "testuser";
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(user));
        when(hospitalRepository.findByUserId(user.getId())).thenReturn(Optional.of(hospital));
        when(equipmentRepository.countByHospitalId(hospital.getId())).thenReturn(1L);
        
        Equipment equipment = new Equipment();
        equipment.setEquipmentCode("EQ-001");
        when(equipmentRepository.findStreamByHospitalId(hospital.getId())).thenReturn(Stream.of(equipment));
        when(response.getWriter()).thenReturn(printWriter);

        equipmentService.exportEquipmentCsv(username, response);

        verify(response).setContentType("text/csv; charset=UTF-8");
        verify(response).setHeader("Content-Disposition", "attachment; filename=equipment.csv");
        verify(response).getWriter();
    }
}

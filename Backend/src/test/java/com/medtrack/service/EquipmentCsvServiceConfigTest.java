package com.medtrack.service;

import com.medtrack.model.Equipment;
import com.medtrack.repository.EquipmentImportAuditLogRepository;
import com.medtrack.repository.EquipmentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class EquipmentCsvServiceConfigTest {

    @Mock
    private EquipmentRepository equipmentRepository;

    @Mock
    private EquipmentImportAuditLogRepository equipmentImportAuditLogRepository;

    @Mock
    private HttpServletResponse response;

    @InjectMocks
    private EquipmentCsvService equipmentCsvService;

    private StringWriter stringWriter;
    private PrintWriter printWriter;

    @BeforeEach
    void setUp() throws IOException {
        stringWriter = new StringWriter();
        printWriter = new PrintWriter(stringWriter);
    }

    @Test
    void exportEquipmentCsv_DefaultFilename() throws Exception {
        ReflectionTestUtils.setField(equipmentCsvService, "equipmentExportFilename", "equipment.csv");

        when(response.getWriter()).thenReturn(printWriter);
        when(equipmentRepository.findStreamByHospitalId(1L)).thenReturn(Stream.empty());

        equipmentCsvService.exportEquipmentCsv(1L, response);

        verify(response).setContentType("text/csv");
        verify(response).setHeader("Content-Disposition", "attachment; filename=equipment.csv");
    }

    @Test
    void exportEquipmentCsv_CustomConfiguredFilename() throws Exception {
        ReflectionTestUtils.setField(equipmentCsvService, "equipmentExportFilename", "custom-equipment-export.csv");

        when(response.getWriter()).thenReturn(printWriter);
        when(equipmentRepository.findStreamByHospitalId(1L)).thenReturn(Stream.empty());

        equipmentCsvService.exportEquipmentCsv(1L, response);

        verify(response).setContentType("text/csv");
        verify(response).setHeader("Content-Disposition", "attachment; filename=custom-equipment-export.csv");
    }
}

package com.medtrack.controller;

import com.medtrack.config.PaginationConfig;
import com.medtrack.service.EquipmentService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = EquipmentController.class)
@AutoConfigureMockMvc(addFilters = false)
public class EquipmentCsvImportValidationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private EquipmentService equipmentService;
    
    @MockBean
    private PaginationConfig paginationConfig;

    @Test
    @WithMockUser
    public void importEquipment_EmptyFile_ShouldFailValidation() throws Exception {
        MockMultipartFile emptyFile = new MockMultipartFile("file", "test.csv", "text/csv", new byte[0]);

        mockMvc.perform(multipart("/api/equipment/import").file(emptyFile))
                .andExpect(status().isBadRequest());

        verify(equipmentService, never()).importEquipmentFromCsv(any(), anyString());
    }

    @Test
    @WithMockUser
    public void importEquipment_MissingFile_ShouldFailValidation() throws Exception {
        mockMvc.perform(multipart("/api/equipment/import"))
                .andExpect(status().isBadRequest());

        verify(equipmentService, never()).importEquipmentFromCsv(any(), anyString());
    }

    @Test
    @WithMockUser
    public void importEquipment_InvalidExtension_ShouldFailValidation() throws Exception {
        MockMultipartFile txtFile = new MockMultipartFile("file", "test.txt", "text/plain", "content".getBytes());

        mockMvc.perform(multipart("/api/equipment/import").file(txtFile))
                .andExpect(status().isBadRequest());

        verify(equipmentService, never()).importEquipmentFromCsv(any(), anyString());
    }

    @Test
    @WithMockUser
    public void importEquipment_OversizedFile_ShouldFailValidation() throws Exception {
        // Since we mock the size via properties or by default it's 10485760 (10MB)
        // Spring's MockMultipartFile size is strictly determined by the byte array length.
        // Let's create an 11MB file
        byte[] largeContent = new byte[11 * 1024 * 1024];
        MockMultipartFile largeFile = new MockMultipartFile("file", "test.csv", "text/csv", largeContent);

        mockMvc.perform(multipart("/api/equipment/import").file(largeFile))
                .andExpect(status().isBadRequest());

        verify(equipmentService, never()).importEquipmentFromCsv(any(), anyString());
    }

    @Test
    @WithMockUser
    public void importEquipment_ValidFile_WithinSize_ShouldSucceed() throws Exception {
        when(equipmentService.importEquipmentFromCsv(any(), anyString())).thenReturn(null);

        byte[] validContent = new byte[1024];
        MockMultipartFile validFile = new MockMultipartFile("file", "test.csv", "text/csv", validContent);

        mockMvc.perform(multipart("/api/equipment/import").file(validFile))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser
    public void importEquipment_ValidFile_ExactlyAtMaxSize_ShouldSucceed() throws Exception {
        when(equipmentService.importEquipmentFromCsv(any(), anyString())).thenReturn(null);

        byte[] validContent = new byte[10485760];
        MockMultipartFile validFile = new MockMultipartFile("file", "test.csv", "text/csv", validContent);

        mockMvc.perform(multipart("/api/equipment/import").file(validFile))
                .andExpect(status().isOk());
    }
}

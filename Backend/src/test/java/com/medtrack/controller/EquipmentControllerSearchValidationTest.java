package com.medtrack.controller;

import com.medtrack.config.PaginationConfig;
import com.medtrack.service.EquipmentService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = EquipmentController.class)
@AutoConfigureMockMvc(addFilters = false)
public class EquipmentControllerSearchValidationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private EquipmentService equipmentService;
    
    @MockBean
    private PaginationConfig paginationConfig;

    @Test
    @WithMockUser
    public void searchEquipment_EmptyKeyword_ShouldFailValidation() throws Exception {
        mockMvc.perform(get("/api/equipment/search")
                        .param("keyword", ""))
                .andExpect(status().isBadRequest());

        verify(equipmentService, never()).searchEquipment(anyString(), anyString());
    }

    @Test
    @WithMockUser
    public void searchEquipment_BlankKeyword_ShouldFailValidation() throws Exception {
        mockMvc.perform(get("/api/equipment/search")
                        .param("keyword", "   "))
                .andExpect(status().isBadRequest());

        verify(equipmentService, never()).searchEquipment(anyString(), anyString());
    }

    @Test
    @WithMockUser
    public void searchEquipment_OneCharacterKeyword_ShouldFailValidation() throws Exception {
        mockMvc.perform(get("/api/equipment/search")
                        .param("keyword", "a"))
                .andExpect(status().isBadRequest());

        verify(equipmentService, never()).searchEquipment(anyString(), anyString());
    }

    @Test
    @WithMockUser
    public void searchEquipment_TwoCharacterKeyword_ShouldSucceed() throws Exception {
        when(equipmentService.searchEquipment(anyString(), anyString())).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/equipment/search")
                        .param("keyword", "ab"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser
    public void searchEquipment_NormalKeyword_ShouldSucceed() throws Exception {
        when(equipmentService.searchEquipment(anyString(), anyString())).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/equipment/search")
                        .param("keyword", "defibrillator"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser
    public void searchEquipment_100CharacterKeyword_ShouldSucceed() throws Exception {
        when(equipmentService.searchEquipment(anyString(), anyString())).thenReturn(Collections.emptyList());

        String keyword = "a".repeat(100);
        mockMvc.perform(get("/api/equipment/search")
                        .param("keyword", keyword))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser
    public void searchEquipment_101CharacterKeyword_ShouldFailValidation() throws Exception {
        String keyword = "a".repeat(101);
        mockMvc.perform(get("/api/equipment/search")
                        .param("keyword", keyword))
                .andExpect(status().isBadRequest());

        verify(equipmentService, never()).searchEquipment(anyString(), anyString());
    }
}

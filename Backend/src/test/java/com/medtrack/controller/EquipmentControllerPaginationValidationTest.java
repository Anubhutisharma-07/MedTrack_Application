package com.medtrack.controller;

import com.medtrack.config.PaginationConfig;
import com.medtrack.service.EquipmentService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = EquipmentController.class)
@AutoConfigureMockMvc(addFilters = false)
public class EquipmentControllerPaginationValidationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private EquipmentService equipmentService;

    @MockBean
    private PaginationConfig paginationConfig;

    @Test
    @WithMockUser
    public void getAllEquipment_NegativePage_ShouldFailValidation() throws Exception {
        mockMvc.perform(get("/api/equipment")
                        .param("page", "-1")
                        .param("size", "10"))
                .andExpect(status().isBadRequest());

        verify(equipmentService, never()).getAllEquipment(anyString(), any(), any());
    }

    @Test
    @WithMockUser
    public void getAllEquipment_ZeroPage_ShouldSucceed() throws Exception {
        when(equipmentService.getAllEquipment(anyString(), any(), any())).thenReturn(Page.empty());

        mockMvc.perform(get("/api/equipment")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser
    public void getAllEquipment_PositivePage_ShouldSucceed() throws Exception {
        when(equipmentService.getAllEquipment(anyString(), any(), any())).thenReturn(Page.empty());

        mockMvc.perform(get("/api/equipment")
                        .param("page", "1")
                        .param("size", "10"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser
    public void getAllEquipment_ZeroSize_ShouldFailValidation() throws Exception {
        mockMvc.perform(get("/api/equipment")
                        .param("page", "0")
                        .param("size", "0"))
                .andExpect(status().isBadRequest());

        verify(equipmentService, never()).getAllEquipment(anyString(), any(), any());
    }

    @Test
    @WithMockUser
    public void getAllEquipment_NegativeSize_ShouldFailValidation() throws Exception {
        mockMvc.perform(get("/api/equipment")
                        .param("page", "0")
                        .param("size", "-5"))
                .andExpect(status().isBadRequest());

        verify(equipmentService, never()).getAllEquipment(anyString(), any(), any());
    }

    @Test
    @WithMockUser
    public void getAllEquipment_SizeOne_ShouldSucceed() throws Exception {
        when(equipmentService.getAllEquipment(anyString(), any(), any())).thenReturn(Page.empty());

        mockMvc.perform(get("/api/equipment")
                        .param("page", "0")
                        .param("size", "1"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser
    public void getAllEquipment_DefaultPagination_ShouldSucceed() throws Exception {
        when(paginationConfig.getDefaultPage()).thenReturn(0);
        when(paginationConfig.getDefaultPageSize()).thenReturn(20);
        when(equipmentService.getAllEquipment(anyString(), any(), any())).thenReturn(Page.empty());

        mockMvc.perform(get("/api/equipment"))
                .andExpect(status().isOk());
    }
}

package com.medtrack.controller;

import com.medtrack.dto.EquipmentAuditResponse;
import com.medtrack.exception.GlobalExceptionHandler;
import com.medtrack.exception.ResourceNotFoundException;
import com.medtrack.service.EquipmentAuditService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class EquipmentAuditControllerTest {

    private MockMvc mockMvc;

    @Mock
    private EquipmentAuditService equipmentAuditService;

    @InjectMocks
    private EquipmentAuditController equipmentAuditController;

    private Principal hospitalPrincipal;
    private EquipmentAuditResponse auditResponse;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(equipmentAuditController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        hospitalPrincipal = new UsernamePasswordAuthenticationToken("hospital_admin", "password");

        auditResponse = EquipmentAuditResponse.builder()
                .id(1L)
                .equipmentId(100L)
                .username("hospital_admin")
                .action("UPDATE")
                .changedFields("status")
                .previousValue("UNDER_MAINTENANCE")
                .newValue("ACTIVE")
                .timestamp(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("GET /api/equipment/{id}/history returns 200 and audit list for owned equipment")
    void getEquipmentHistory_Success() throws Exception {
        when(equipmentAuditService.getEquipmentHistory(100L, "hospital_admin"))
                .thenReturn(List.of(auditResponse));

        mockMvc.perform(get("/api/equipment/100/history").principal(hospitalPrincipal))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1L))
                .andExpect(jsonPath("$[0].equipmentId").value(100L))
                .andExpect(jsonPath("$[0].action").value("UPDATE"));

        verify(equipmentAuditService).getEquipmentHistory(100L, "hospital_admin");
    }

    @Test
    @DisplayName("GET /api/equipment/{id}/history returns 404 when equipment belongs to another hospital")
    void getEquipmentHistory_NotFound() throws Exception {
        when(equipmentAuditService.getEquipmentHistory(999L, "hospital_admin"))
                .thenThrow(new ResourceNotFoundException("Equipment not found or access denied"));

        mockMvc.perform(get("/api/equipment/999/history").principal(hospitalPrincipal))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /api/equipment/audit-history returns 200 and hospital audit list")
    void getHospitalAuditHistory_Success() throws Exception {
        when(equipmentAuditService.getHospitalHistory("hospital_admin"))
                .thenReturn(List.of(auditResponse));

        mockMvc.perform(get("/api/equipment/audit-history").principal(hospitalPrincipal))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].username").value("hospital_admin"));

        verify(equipmentAuditService).getHospitalHistory("hospital_admin");
    }

    @Test
    @DisplayName("GET /api/equipment/audit-history with action filter delegates to getFilteredHospitalHistory")
    void getHospitalAuditHistory_FilteredByAction() throws Exception {
        when(equipmentAuditService.getFilteredHospitalHistory(eq("hospital_admin"), eq("UPDATE"), eq(null), eq(null), eq(null)))
                .thenReturn(List.of(auditResponse));

        mockMvc.perform(get("/api/equipment/audit-history").param("action", "UPDATE").principal(hospitalPrincipal))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].action").value("UPDATE"));
    }

    @Test
    @DisplayName("GET /api/equipment/audit-history/export returns CSV file attachment")
    void exportHospitalAuditHistoryCsv_Success() throws Exception {
        String csvContent = "ID,Equipment ID,Username,Action,Changed Fields,Previous Value,New Value,Timestamp\n1,100,hospital_admin,UPDATE,status,UNDER_MAINTENANCE,ACTIVE,2026-08-12 12:00:00\n";
        org.mockito.Mockito.doAnswer(invocation -> {
            jakarta.servlet.http.HttpServletResponse response = invocation.getArgument(1);
            response.setContentType("text/csv");
            response.setHeader("Content-Disposition", "attachment; filename=audit-history.csv");
            response.getWriter().write(csvContent);
            return null;
        }).when(equipmentAuditService).exportAuditHistoryCsv(org.mockito.ArgumentMatchers.eq("hospital_admin"), org.mockito.ArgumentMatchers.any());

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/equipment/audit-history/export").principal(hospitalPrincipal))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isOk())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.header().string("Content-Disposition", "attachment; filename=audit-history.csv"))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.content().contentType(org.springframework.http.MediaType.parseMediaType("text/csv")))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.content().string(csvContent));
    }
}

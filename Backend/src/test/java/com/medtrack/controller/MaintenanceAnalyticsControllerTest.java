package com.medtrack.controller;

import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.dto.MaintenanceAnalyticsResponse;
import com.medtrack.exception.GlobalExceptionHandler;
import com.medtrack.model.Hospital;
import com.medtrack.repository.HospitalRepository;
import com.medtrack.service.MaintenanceAnalyticsService;
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
import java.time.LocalDate;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class MaintenanceAnalyticsControllerTest {

    private MockMvc mockMvc;

    @Mock
    private MaintenanceAnalyticsService analyticsService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private HospitalRepository hospitalRepository;

    @InjectMocks
    private MaintenanceAnalyticsController analyticsController;

    private Principal hospitalPrincipal;
    private Principal emailPrincipal;
    private Principal blankPrincipal;
    private User testUser;
    private Hospital testHospital;
    private MaintenanceAnalyticsResponse mockAnalyticsResponse;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(analyticsController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        hospitalPrincipal = new UsernamePasswordAuthenticationToken("hospital_admin", "password");
        emailPrincipal = new UsernamePasswordAuthenticationToken("admin@hospital.com", "password");
        blankPrincipal = new UsernamePasswordAuthenticationToken("   ", "password");

        testUser = User.builder()
                .id(10L)
                .username("hospital_admin")
                .email("admin@hospital.com")
                .build();

        testHospital = Hospital.builder()
                .id(100L)
                .name("General Hospital")
                .user(testUser)
                .build();

        mockAnalyticsResponse = MaintenanceAnalyticsResponse.builder()
                .totalTasks(50L)
                .completedTasks(35L)
                .openTasks(15L)
                .overdueTasks(2L)
                .totalHoursWorked(120.5)
                .build();
    }

    @Test
    @DisplayName("GET /api/maintenance/analytics - Success with date range")
    void getAnalytics_Success_WithDateRange() throws Exception {
        LocalDate startDate = LocalDate.of(2026, 1, 1);
        LocalDate endDate = LocalDate.of(2026, 6, 30);

        when(userRepository.findByUsername("hospital_admin")).thenReturn(Optional.of(testUser));
        when(hospitalRepository.findByUserId(10L)).thenReturn(Optional.of(testHospital));
        when(analyticsService.getAnalytics(100L, startDate, endDate)).thenReturn(mockAnalyticsResponse);

        mockMvc.perform(get("/api/maintenance/analytics")
                        .principal(hospitalPrincipal)
                        .param("startDate", "2026-01-01")
                        .param("endDate", "2026-06-30")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalTasks").value(50))
                .andExpect(jsonPath("$.completedTasks").value(35))
                .andExpect(jsonPath("$.openTasks").value(15))
                .andExpect(jsonPath("$.overdueTasks").value(2))
                .andExpect(jsonPath("$.totalHoursWorked").value(120.5));

        verify(analyticsService).getAnalytics(100L, startDate, endDate);
    }

    @Test
    @DisplayName("GET /api/maintenance/analytics - Success without date range")
    void getAnalytics_Success_WithoutDates() throws Exception {
        when(userRepository.findByUsername("hospital_admin")).thenReturn(Optional.of(testUser));
        when(hospitalRepository.findByUserId(10L)).thenReturn(Optional.of(testHospital));
        when(analyticsService.getAnalytics(100L, null, null)).thenReturn(mockAnalyticsResponse);

        mockMvc.perform(get("/api/maintenance/analytics")
                        .principal(hospitalPrincipal)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalTasks").value(50));

        verify(analyticsService).getAnalytics(100L, null, null);
    }

    @Test
    @DisplayName("GET /api/maintenance/analytics - Email resolution fallback success")
    void getAnalytics_Success_EmailResolution() throws Exception {
        when(userRepository.findByUsername("admin@hospital.com")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("admin@hospital.com")).thenReturn(Optional.of(testUser));
        when(hospitalRepository.findByUserId(10L)).thenReturn(Optional.of(testHospital));
        when(analyticsService.getAnalytics(100L, null, null)).thenReturn(mockAnalyticsResponse);

        mockMvc.perform(get("/api/maintenance/analytics")
                        .principal(emailPrincipal)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalTasks").value(50));

        verify(analyticsService).getAnalytics(100L, null, null);
    }

    @Test
    @DisplayName("GET /api/maintenance/analytics - Invalid date range throws BadRequest")
    void getAnalytics_InvalidDateRange_ReturnsBadRequest() throws Exception {
        mockMvc.perform(get("/api/maintenance/analytics")
                        .principal(hospitalPrincipal)
                        .param("startDate", "2026-12-31")
                        .param("endDate", "2026-01-01")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest());

        verify(analyticsService, never()).getAnalytics(any(), any(), any());
    }

    @Test
    @DisplayName("GET /api/maintenance/analytics - Date range exceeding maximum horizon throws BadRequest")
    void getAnalytics_ExceedingMaxDateRange_ReturnsBadRequest() throws Exception {
        mockMvc.perform(get("/api/maintenance/analytics")
                        .principal(hospitalPrincipal)
                        .param("startDate", "2020-01-01")
                        .param("endDate", "2026-01-01")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest());

        verify(analyticsService, never()).getAnalytics(any(), any(), any());
    }

    @Test
    @DisplayName("GET /api/maintenance/analytics/current-month - Success")
    void getCurrentMonthAnalytics_Success() throws Exception {
        when(userRepository.findByUsername("hospital_admin")).thenReturn(Optional.of(testUser));
        when(hospitalRepository.findByUserId(10L)).thenReturn(Optional.of(testHospital));
        when(analyticsService.getCurrentMonthAnalytics(100L)).thenReturn(mockAnalyticsResponse);

        mockMvc.perform(get("/api/maintenance/analytics/current-month")
                        .principal(hospitalPrincipal)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalTasks").value(50));

        verify(analyticsService).getCurrentMonthAnalytics(100L);
    }

    @Test
    @DisplayName("GET /api/maintenance/analytics - Blank principal username throws BadRequest")
    void getAnalytics_BlankPrincipal_ReturnsBadRequest() throws Exception {
        mockMvc.perform(get("/api/maintenance/analytics")
                        .principal(blankPrincipal)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest());

        verify(analyticsService, never()).getAnalytics(any(), any(), any());
    }

    @Test
    @DisplayName("GET /api/maintenance/analytics - User not found throws NotFound")
    void getAnalytics_UserNotFound_ReturnsNotFound() throws Exception {
        when(userRepository.findByUsername("hospital_admin")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("hospital_admin")).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/maintenance/analytics")
                        .principal(hospitalPrincipal)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());

        verify(analyticsService, never()).getAnalytics(any(), any(), any());
    }

    @Test
    @DisplayName("GET /api/maintenance/analytics - Hospital profile not found throws NotFound")
    void getAnalytics_HospitalNotFound_ReturnsNotFound() throws Exception {
        when(userRepository.findByUsername("hospital_admin")).thenReturn(Optional.of(testUser));
        when(hospitalRepository.findByUserId(10L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/maintenance/analytics")
                        .principal(hospitalPrincipal)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());

        verify(analyticsService, never()).getAnalytics(any(), any(), any());
    }
}

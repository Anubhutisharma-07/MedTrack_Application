package com.medtrack.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.dto.MaintenanceWorkOrderAssignmentRequest;
import com.medtrack.dto.MaintenanceWorkOrderCompletionRequest;
import com.medtrack.dto.MaintenanceWorkOrderDashboardResponse;
import com.medtrack.dto.MaintenanceWorkOrderRequest;
import com.medtrack.dto.MaintenanceWorkOrderResponse;
import com.medtrack.dto.MaintenanceWorkOrderStatusRequest;
import com.medtrack.exception.GlobalExceptionHandler;
import com.medtrack.model.Hospital;
import com.medtrack.model.MaintenanceWorkOrderPriority;
import com.medtrack.model.MaintenanceWorkOrderStatus;
import com.medtrack.model.MaintenanceWorkOrderType;
import com.medtrack.repository.HospitalRepository;
import com.medtrack.service.MaintenanceWorkOrderService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.security.Principal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.nullable;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class MaintenanceWorkOrderControllerTest {

    private MockMvc mockMvc;

    @Mock
    private MaintenanceWorkOrderService workOrderService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private HospitalRepository hospitalRepository;

    @InjectMocks
    private MaintenanceWorkOrderController workOrderController;

    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());
    private Principal hospitalPrincipal;
    private User testUser;
    private Hospital testHospital;
    private MaintenanceWorkOrderResponse mockResponse;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(workOrderController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
        hospitalPrincipal = new UsernamePasswordAuthenticationToken("hospital_admin", "password");
        testUser = User.builder().id(100L).username("hospital_admin").email("admin@cityhospital.com").build();
        testHospital = Hospital.builder().id(1L).name("City General Hospital").user(testUser).build();
        mockResponse = MaintenanceWorkOrderResponse.builder()
                .id(10L).workOrderCode("WO-1001").title("Calibrate MRI Scanner")
                .status(MaintenanceWorkOrderStatus.OPEN).priority(MaintenanceWorkOrderPriority.HIGH)
                .maintenanceType(MaintenanceWorkOrderType.PREVENTIVE).build();
    }

    private void mockUserAndHospitalResolution() {
        when(userRepository.findByUsername("hospital_admin")).thenReturn(Optional.of(testUser));
        when(hospitalRepository.findByUserId(100L)).thenReturn(Optional.of(testHospital));
    }

    @Test
    @DisplayName("createWorkOrder resolves hospital and returns created work order")
    void createWorkOrder_Success() throws Exception {
        mockUserAndHospitalResolution();
        MaintenanceWorkOrderRequest request = new MaintenanceWorkOrderRequest();
        request.setEquipmentId(5L);
        request.setTitle("Calibrate MRI Scanner");
        request.setPriority(MaintenanceWorkOrderPriority.HIGH);
        request.setMaintenanceType(MaintenanceWorkOrderType.PREVENTIVE);
        when(workOrderService.createWorkOrder(any(MaintenanceWorkOrderRequest.class), eq(1L), eq("hospital_admin"))).thenReturn(mockResponse);

        mockMvc.perform(post("/api/maintenance/work-orders")
                        .principal(hospitalPrincipal)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.workOrderCode").value("WO-1001"));
    }

    @Test
    @DisplayName("getWorkOrder resolves hospital and returns single work order")
    void getWorkOrder_Success() throws Exception {
        mockUserAndHospitalResolution();
        when(workOrderService.getWorkOrder(10L, 1L)).thenReturn(mockResponse);
        mockMvc.perform(get("/api/maintenance/work-orders/10").principal(hospitalPrincipal))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.title").value("Calibrate MRI Scanner"));
    }

    @Test
    @DisplayName("searchWorkOrders resolves hospital and returns paged response")
    void searchWorkOrders_Success() throws Exception {
        mockUserAndHospitalResolution();
        when(workOrderService.searchWorkOrders(
                eq(1L), nullable(MaintenanceWorkOrderStatus.class), nullable(MaintenanceWorkOrderPriority.class),
                nullable(MaintenanceWorkOrderType.class), nullable(Long.class), nullable(Long.class),
                nullable(LocalDate.class), nullable(LocalDate.class), nullable(LocalDate.class),
                nullable(LocalDate.class), nullable(String.class), nullable(Boolean.class),
                anyInt(), anyInt(), anyString(), anyString()))
                .thenReturn(new PageImpl<>(List.of(mockResponse), PageRequest.of(0, 20), 1));

        mockMvc.perform(get("/api/maintenance/work-orders").principal(hospitalPrincipal))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(10));
    }

    @Test
    @DisplayName("assignWorkOrder resolves hospital and assigns work order")
    void assignWorkOrder_Success() throws Exception {
        mockUserAndHospitalResolution();
        MaintenanceWorkOrderAssignmentRequest request = new MaintenanceWorkOrderAssignmentRequest();
        request.setAssignedUserId(20L);
        when(workOrderService.assignWorkOrder(eq(10L), any(MaintenanceWorkOrderAssignmentRequest.class), eq(1L), eq("hospital_admin"))).thenReturn(mockResponse);

        mockMvc.perform(patch("/api/maintenance/work-orders/10/assign")
                        .principal(hospitalPrincipal)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("startWorkOrder resolves hospital and starts work order")
    void startWorkOrder_Success() throws Exception {
        mockUserAndHospitalResolution();
        when(workOrderService.startWorkOrder(10L, 1L, "hospital_admin")).thenReturn(mockResponse);
        mockMvc.perform(post("/api/maintenance/work-orders/10/start").principal(hospitalPrincipal))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("holdWorkOrder resolves hospital and sets status to ON_HOLD")
    void holdWorkOrder_Success() throws Exception {
        mockUserAndHospitalResolution();
        MaintenanceWorkOrderStatusRequest request = new MaintenanceWorkOrderStatusRequest();
        request.setStatus(MaintenanceWorkOrderStatus.ON_HOLD);
        request.setReason("Waiting for spare parts");
        when(workOrderService.holdWorkOrder(eq(10L), any(MaintenanceWorkOrderStatusRequest.class), eq(1L), eq("hospital_admin"))).thenReturn(mockResponse);

        mockMvc.perform(post("/api/maintenance/work-orders/10/hold")
                        .principal(hospitalPrincipal)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("completeWorkOrder resolves hospital and completes work order")
    void completeWorkOrder_Success() throws Exception {
        mockUserAndHospitalResolution();
        MaintenanceWorkOrderCompletionRequest request = new MaintenanceWorkOrderCompletionRequest();
        request.setCompletionNotes("Maintenance complete and tested");
        when(workOrderService.completeWorkOrder(eq(10L), any(MaintenanceWorkOrderCompletionRequest.class), eq(1L), eq("hospital_admin"))).thenReturn(mockResponse);

        mockMvc.perform(post("/api/maintenance/work-orders/10/complete")
                        .principal(hospitalPrincipal)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("cancelWorkOrder resolves hospital and cancels work order")
    void cancelWorkOrder_Success() throws Exception {
        mockUserAndHospitalResolution();
        MaintenanceWorkOrderStatusRequest request = new MaintenanceWorkOrderStatusRequest();
        request.setStatus(MaintenanceWorkOrderStatus.CANCELLED);
        request.setReason("Duplicate request");
        when(workOrderService.cancelWorkOrder(eq(10L), any(MaintenanceWorkOrderStatusRequest.class), eq(1L), eq("hospital_admin"))).thenReturn(mockResponse);

        mockMvc.perform(post("/api/maintenance/work-orders/10/cancel")
                        .principal(hospitalPrincipal)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("updateStatus resolves hospital and updates work order status")
    void updateStatus_Success() throws Exception {
        mockUserAndHospitalResolution();
        MaintenanceWorkOrderStatusRequest request = new MaintenanceWorkOrderStatusRequest();
        request.setStatus(MaintenanceWorkOrderStatus.IN_PROGRESS);
        when(workOrderService.updateStatus(eq(10L), any(MaintenanceWorkOrderStatusRequest.class), eq(1L), eq("hospital_admin"))).thenReturn(mockResponse);

        mockMvc.perform(patch("/api/maintenance/work-orders/10/status")
                        .principal(hospitalPrincipal)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("getDashboard resolves hospital and returns dashboard metrics")
    void getDashboard_Success() throws Exception {
        mockUserAndHospitalResolution();
        MaintenanceWorkOrderDashboardResponse dashboard = MaintenanceWorkOrderDashboardResponse.builder()
                .total(15).open(5).inProgress(3).completed(7).build();
        when(workOrderService.getDashboard(1L)).thenReturn(dashboard);

        mockMvc.perform(get("/api/maintenance/work-orders/dashboard").principal(hospitalPrincipal))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(15));
    }

    @Test
    @DisplayName("getTechnicianWorkOrders resolves hospital and lists technician orders")
    void getTechnicianWorkOrders_Success() throws Exception {
        mockUserAndHospitalResolution();
        when(workOrderService.getTechnicianWorkOrders(1L, 20L)).thenReturn(List.of(mockResponse));
        mockMvc.perform(get("/api/maintenance/work-orders/technician/20").principal(hospitalPrincipal))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(10));
    }

    @Test
    @DisplayName("getEquipmentWorkOrders resolves hospital and lists equipment orders")
    void getEquipmentWorkOrders_Success() throws Exception {
        mockUserAndHospitalResolution();
        when(workOrderService.getEquipmentWorkOrders(1L, 5L)).thenReturn(List.of(mockResponse));
        mockMvc.perform(get("/api/maintenance/work-orders/equipment/5").principal(hospitalPrincipal))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(10));
    }

    @Test
    @DisplayName("archiveWorkOrder resolves hospital and archives work order")
    void archiveWorkOrder_Success() throws Exception {
        mockUserAndHospitalResolution();
        mockMvc.perform(delete("/api/maintenance/work-orders/10").principal(hospitalPrincipal))
                .andExpect(status().isNoContent());
        verify(workOrderService).archiveWorkOrder(10L, 1L, "hospital_admin");
    }

    @Test
    @DisplayName("resolveHospitalId resolves user by email when username lookup misses")
    void resolveHospitalId_FallsBackToEmail() throws Exception {
        Principal emailPrincipal = new UsernamePasswordAuthenticationToken("admin@cityhospital.com", "password");
        when(userRepository.findByUsername("admin@cityhospital.com")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("admin@cityhospital.com")).thenReturn(Optional.of(testUser));
        when(hospitalRepository.findByUserId(100L)).thenReturn(Optional.of(testHospital));
        when(workOrderService.getDashboard(1L)).thenReturn(MaintenanceWorkOrderDashboardResponse.builder().build());

        mockMvc.perform(get("/api/maintenance/work-orders/dashboard").principal(emailPrincipal))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("resolveHospitalId returns 400 when principal username is missing or blank")
    void resolveHospitalId_MissingPrincipal_ReturnsBadRequest() throws Exception {
        mockMvc.perform(get("/api/maintenance/work-orders/dashboard")).andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("resolveHospitalId returns 404 when user is not found")
    void resolveHospitalId_UserNotFound_ReturnsNotFound() throws Exception {
        when(userRepository.findByUsername("unknown_user")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("unknown_user")).thenReturn(Optional.empty());
        Principal unknownPrincipal = new UsernamePasswordAuthenticationToken("unknown_user", "password");

        mockMvc.perform(get("/api/maintenance/work-orders/dashboard").principal(unknownPrincipal))
                .andExpect(status().isNotFound());
    }
}

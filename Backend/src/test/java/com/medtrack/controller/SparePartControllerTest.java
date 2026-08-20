package com.medtrack.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medtrack.dto.SparePartCreateRequest;
import com.medtrack.dto.SparePartResponse;
import com.medtrack.dto.SparePartStockRequest;
import com.medtrack.dto.SparePartUpdateRequest;
import com.medtrack.exception.GlobalExceptionHandler;
import com.medtrack.exception.ResourceNotFoundException;
import com.medtrack.service.SparePartService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class SparePartControllerTest {

    private MockMvc mockMvc;

    @Mock
    private SparePartService sparePartService;

    @InjectMocks
    private SparePartController sparePartController;

    private ObjectMapper objectMapper;
    private Authentication hospitalAuth;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(sparePartController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
        objectMapper = new ObjectMapper().findAndRegisterModules();
        hospitalAuth = new UsernamePasswordAuthenticationToken(
                "hospitalUser",
                "password",
                List.of(new SimpleGrantedAuthority("ROLE_HOSPITAL"))
        );
    }

    @Test
    @DisplayName("Should return list of spare parts for authenticated hospital")
    void shouldReturnAllSpareParts() throws Exception {
        SparePartResponse part = response(1L, "SP-100", 10);

        when(sparePartService.getAllSpareParts("hospitalUser")).thenReturn(List.of(part));

        mockMvc.perform(get("/api/spare-parts")
                        .principal(hospitalAuth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].partNumber").value("SP-100"))
                .andExpect(jsonPath("$[0].stockLevel").value(10));

        verify(sparePartService).getAllSpareParts("hospitalUser");
    }

    @Test
    @DisplayName("Should return low stock spare parts alerts")
    void shouldReturnLowStockAlerts() throws Exception {
        SparePartResponse lowStockPart = response(2L, "SP-200", 2);

        when(sparePartService.getLowStockAlerts("hospitalUser")).thenReturn(List.of(lowStockPart));

        mockMvc.perform(get("/api/spare-parts/low-stock")
                        .principal(hospitalAuth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].partNumber").value("SP-200"))
                .andExpect(jsonPath("$[0].stockLevel").value(2));

        verify(sparePartService).getLowStockAlerts("hospitalUser");
    }

    @Test
    @DisplayName("Should create new spare part when request is valid")
    void shouldCreateSparePart() throws Exception {
        SparePartCreateRequest request = SparePartCreateRequest.builder()
                .partNumber("SP-300")
                .description("Sensor Probe")
                .stockLevel(10)
                .reorderPoint(5)
                .unitCost(150.0)
                .build();
        when(sparePartService.createSparePart(
                any(SparePartCreateRequest.class), eq("hospitalUser")))
                .thenReturn(response(3L, "SP-300", 10));

        mockMvc.perform(post("/api/spare-parts")
                        .principal(hospitalAuth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(3))
                .andExpect(jsonPath("$.partNumber").value("SP-300"));

        verify(sparePartService).createSparePart(
                any(SparePartCreateRequest.class), eq("hospitalUser"));
    }

    @Test
    @DisplayName("Should update existing spare part")
    void shouldUpdateSparePart() throws Exception {
        SparePartUpdateRequest request = SparePartUpdateRequest.builder()
                .partNumber("SP-100-REV")
                .description("Updated Filter Valve")
                .stockLevel(15)
                .reorderPoint(5)
                .unitCost(200.0)
                .build();
        when(sparePartService.updateSparePart(
                eq(1L), any(SparePartUpdateRequest.class), eq("hospitalUser")))
                .thenReturn(response(1L, "SP-100-REV", 15));

        mockMvc.perform(put("/api/spare-parts/1")
                        .principal(hospitalAuth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.partNumber").value("SP-100-REV"));

        verify(sparePartService).updateSparePart(
                eq(1L), any(SparePartUpdateRequest.class), eq("hospitalUser"));
    }

    @Test
    @DisplayName("Should delete spare part successfully")
    void shouldDeleteSparePart() throws Exception {
        doNothing().when(sparePartService).deleteSparePart(1L, "hospitalUser");

        mockMvc.perform(delete("/api/spare-parts/1")
                        .principal(hospitalAuth))
                .andExpect(status().isNoContent());

        verify(sparePartService).deleteSparePart(1L, "hospitalUser");
    }

    @Test
    @DisplayName("Should deduct stock when request is valid")
    void shouldDeductStockSuccessfully() throws Exception {
        SparePartStockRequest request = SparePartStockRequest.builder()
                .partNumber("SP-100")
                .quantity(3)
                .build();
        when(sparePartService.deductStock(
                any(SparePartStockRequest.class), eq("hospitalUser")))
                .thenReturn(response(1L, "SP-100", 7));

        mockMvc.perform(post("/api/spare-parts/deduct")
                        .principal(hospitalAuth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        verify(sparePartService).deductStock(
                any(SparePartStockRequest.class), eq("hospitalUser"));
    }

    @Test
    @DisplayName("Should return 400 Bad Request when deduct request validation fails")
    void shouldFailValidationOnInvalidDeductRequest() throws Exception {
        SparePartStockRequest invalidRequest = SparePartStockRequest.builder()
                .partNumber("")
                .quantity(0)
                .build();

        mockMvc.perform(post("/api/spare-parts/deduct")
                        .principal(hospitalAuth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Should return 400 Bad Request when stock deduction fails due to insufficient stock")
    void shouldReturnBadRequestWhenInsufficientStock() throws Exception {
        SparePartStockRequest request = SparePartStockRequest.builder()
                .partNumber("SP-100")
                .quantity(100)
                .build();

        doThrow(new IllegalArgumentException("Insufficient stock for part: SP-100"))
                .when(sparePartService).deductStock(
                        any(SparePartStockRequest.class), eq("hospitalUser"));

        mockMvc.perform(post("/api/spare-parts/deduct")
                        .principal(hospitalAuth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Should restock stock when request is valid")
    void shouldRestockStockSuccessfully() throws Exception {
        SparePartStockRequest request = SparePartStockRequest.builder()
                .partNumber("SP-100")
                .quantity(5)
                .build();

        when(sparePartService.restockSparePart(
                any(SparePartStockRequest.class), eq("hospitalUser")))
                .thenReturn(response(1L, "SP-100", 15));

        mockMvc.perform(post("/api/spare-parts/restock")
                        .principal(hospitalAuth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        verify(sparePartService).restockSparePart(
                any(SparePartStockRequest.class), eq("hospitalUser"));
    }

    @Test
    @DisplayName("Should return 400 Bad Request when restock quantity is invalid")
    void shouldFailValidationOnInvalidRestockRequest() throws Exception {
        SparePartStockRequest invalidRequest = SparePartStockRequest.builder()
                .partNumber("SP-100")
                .quantity(-2)
                .build();

        mockMvc.perform(post("/api/spare-parts/restock")
                        .principal(hospitalAuth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Should return 404 Not Found when restocking non-existent part")
    void shouldReturnNotFoundWhenRestockingNonExistentPart() throws Exception {
        SparePartStockRequest request = SparePartStockRequest.builder()
                .partNumber("NON-EXISTENT")
                .quantity(5)
                .build();

        doThrow(new ResourceNotFoundException("Spare part not found: NON-EXISTENT"))
                .when(sparePartService).restockSparePart(
                        any(SparePartStockRequest.class), eq("hospitalUser"));

        mockMvc.perform(post("/api/spare-parts/restock")
                        .principal(hospitalAuth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Should return single spare part by ID")
    void shouldReturnSparePartById() throws Exception {
        SparePartResponse part = response(1L, "SP-100", 10);
        when(sparePartService.getSparePart(1L, "hospitalUser")).thenReturn(part);

        mockMvc.perform(get("/api/spare-parts/1")
                        .principal(hospitalAuth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.partNumber").value("SP-100"))
                .andExpect(jsonPath("$.stockLevel").value(10));

        verify(sparePartService).getSparePart(1L, "hospitalUser");
    }

    @Test
    @DisplayName("Should return 404 Not Found when requesting non-existent or deleted spare part by ID")
    void shouldReturnNotFoundWhenSparePartDoesNotExist() throws Exception {
        when(sparePartService.getSparePart(99L, "hospitalUser"))
                .thenThrow(new ResourceNotFoundException("Active spare part not found with ID: 99"));

        mockMvc.perform(get("/api/spare-parts/99")
                        .principal(hospitalAuth))
                .andExpect(status().isNotFound());

        verify(sparePartService).getSparePart(99L, "hospitalUser");
    }

    @Test
    @DisplayName("Should return list of spare parts for authenticated technician")
    void shouldReturnAllSparePartsForTechnician() throws Exception {
        Authentication techAuth = new UsernamePasswordAuthenticationToken(
                "techUser",
                "password",
                List.of(new SimpleGrantedAuthority("ROLE_TECHNICIAN"))
        );
        SparePartResponse part = response(1L, "SP-100", 10);

        when(sparePartService.getAllSpareParts("techUser")).thenReturn(List.of(part));

        mockMvc.perform(get("/api/spare-parts")
                        .principal(techAuth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].partNumber").value("SP-100"));

        verify(sparePartService).getAllSpareParts("techUser");
    }

    @Test
    @DisplayName("Should return single spare part by ID for authenticated technician")
    void shouldReturnSparePartByIdForTechnician() throws Exception {
        Authentication techAuth = new UsernamePasswordAuthenticationToken(
                "techUser",
                "password",
                List.of(new SimpleGrantedAuthority("ROLE_TECHNICIAN"))
        );
        SparePartResponse part = response(1L, "SP-100", 10);

        when(sparePartService.getSparePart(1L, "techUser")).thenReturn(part);

        mockMvc.perform(get("/api/spare-parts/1")
                        .principal(techAuth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.partNumber").value("SP-100"));

        verify(sparePartService).getSparePart(1L, "techUser");
    }

    @Test
    @DisplayName("Should deduct stock successfully for authenticated technician")
    void shouldDeductStockSuccessfullyForTechnician() throws Exception {
        Authentication techAuth = new UsernamePasswordAuthenticationToken(
                "techUser",
                "password",
                List.of(new SimpleGrantedAuthority("ROLE_TECHNICIAN"))
        );
        SparePartStockRequest request = SparePartStockRequest.builder()
                .partNumber("SP-100")
                .quantity(2)
                .build();

        when(sparePartService.deductStock(
                any(SparePartStockRequest.class), eq("techUser")))
                .thenReturn(response(1L, "SP-100", 8));

        mockMvc.perform(post("/api/spare-parts/deduct")
                        .principal(techAuth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.stockLevel").value(8));

        verify(sparePartService).deductStock(
                any(SparePartStockRequest.class), eq("techUser"));
    }

    private SparePartResponse response(Long id, String partNumber, int stockLevel) {
        return SparePartResponse.builder()
                .id(id)
                .partNumber(partNumber)
                .description("Test spare part")
                .stockLevel(stockLevel)
                .reorderPoint(5)
                .unitCost(10.0)
                .build();
    }
}

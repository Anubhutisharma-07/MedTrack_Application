package com.medtrack.service;

import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.dto.PredictiveRestockItemResponse;
import com.medtrack.dto.PredictiveSupplyForecastResponse;
import com.medtrack.exception.ResourceNotFoundException;
import com.medtrack.model.Hospital;
import com.medtrack.model.SparePart;
import com.medtrack.repository.HospitalRepository;
import com.medtrack.repository.SparePartRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PredictiveSupplyServiceTest {

    @Mock private SparePartRepository sparePartRepository;
    @Mock private HospitalRepository hospitalRepository;
    @Mock private UserRepository userRepository;

    @InjectMocks private PredictiveSupplyService predictiveSupplyService;

    private User testUser;
    private Hospital testHospital;
    private SparePart testPart;

    @BeforeEach
    void setUp() {
        testUser = User.builder().id(1L).username("admin").role("ADMIN").build();
        testHospital = Hospital.builder().id(10L).user(testUser).name("General Hospital").build();
        testPart = SparePart.builder()
                .id(100L).hospitalId(10L).partNumber("SP-001")
                .description("Filter Element").stockLevel(5).reorderPoint(10).unitCost(45.50).deleted(false)
                .build();
    }

    @Test
    @DisplayName("getDemandForecasts returns forecasts scoped to user hospital")
    void getDemandForecasts_ReturnsScopedForecasts() {
        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(testUser));
        when(hospitalRepository.findByUserId(1L)).thenReturn(Optional.of(testHospital));
        when(sparePartRepository.findByHospitalIdAndDeletedFalse(10L)).thenReturn(List.of(testPart));

        List<PredictiveSupplyForecastResponse> result = predictiveSupplyService.getDemandForecasts("admin");
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("SP-001", result.get(0).getPartNumber());
        assertTrue(result.get(0).getConsumptionVelocity() > 0);
    }

    @Test
    @DisplayName("getRestockAlerts triggers for parts below reorder threshold")
    void getRestockAlerts_TriggersLowStockAlerts() {
        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(testUser));
        when(hospitalRepository.findByUserId(1L)).thenReturn(Optional.of(testHospital));
        when(sparePartRepository.findByHospitalIdAndDeletedFalse(10L)).thenReturn(List.of(testPart));

        List<PredictiveRestockItemResponse> alerts = predictiveSupplyService.getRestockAlerts("admin");
        assertNotNull(alerts);
        assertEquals(1, alerts.size());
        assertEquals("SP-001", alerts.get(0).getPartNumber());
        assertTrue(alerts.get(0).getRecommendedReorderAmount() > 0);
    }

    @Test
    @DisplayName("calculateVelocity returns zero when stock is zero or null")
    void calculateVelocity_HandlesZeroOrNullStock() {
        assertEquals(0.0, predictiveSupplyService.calculateVelocity(null));
        SparePart emptyPart = SparePart.builder().stockLevel(0).build();
        assertEquals(0.0, predictiveSupplyService.calculateVelocity(emptyPart));
    }

    @Test
    @DisplayName("getSeasonalityMultiplier applies flu season multiplier correctly")
    void getSeasonalityMultiplier_AppliesSeasonalRates() {
        assertEquals(1.3, predictiveSupplyService.getSeasonalityMultiplier(testPart, 11));
        assertEquals(1.3, predictiveSupplyService.getSeasonalityMultiplier(testPart, 1));
        assertEquals(1.0, predictiveSupplyService.getSeasonalityMultiplier(testPart, 6));
    }

    @Test
    @DisplayName("getDemandForecasts throws exception when user is not found")
    void getDemandForecasts_ThrowsExceptionForUnknownUser() {
        when(userRepository.findByUsername("unknown")).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> predictiveSupplyService.getDemandForecasts("unknown"));
    }
}

package com.medtrack.service;

import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.dto.EquipmentFinancialDashboardResponse;
import com.medtrack.dto.EquipmentFinancialResponse;
import com.medtrack.exception.ResourceNotFoundException;
import com.medtrack.model.DepreciationMethod;
import com.medtrack.model.Equipment;
import com.medtrack.model.Hospital;
import com.medtrack.repository.EquipmentRepository;
import com.medtrack.repository.HospitalRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Covers {@link EquipmentFinancialService}.
 *
 * <p>The regressions pinned here are that a single-asset analysis carries its financial figures
 * rather than identity fields alone, that the dashboard values the fleet with one query instead of
 * one per asset, that replacement recommendations exist at all, and that an asset belonging to
 * another hospital is never valued.</p>
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Equipment financial analytics")
class EquipmentFinancialServiceTest {

    private static final String USERNAME = "hospital_admin";
    private static final Long HOSPITAL_ID = 10L;

    @Mock
    private EquipmentRepository equipmentRepository;

    @Mock
    private HospitalRepository hospitalRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private EquipmentFinancialService financialService;

    @BeforeEach
    void setUp() {
        User user = User.builder().id(1L).username(USERNAME).build();
        Hospital hospital = Hospital.builder().id(HOSPITAL_ID).name("City General").user(user).build();
        lenient().when(userRepository.findByUsername(USERNAME)).thenReturn(Optional.of(user));
        lenient().when(hospitalRepository.findByUserId(1L)).thenReturn(Optional.of(hospital));
    }

    private Equipment asset(Long id, String cost, Integer usefulLife, LocalDate purchased) {
        return Equipment.builder()
                .id(id)
                .name("Ventilator " + id)
                .equipmentCode("EQ-00" + id)
                .department("ICU")
                .purchaseDate(purchased)
                .purchaseCost(cost == null ? null : new BigDecimal(cost))
                .usefulLifeYears(usefulLife)
                .depreciationMethod(DepreciationMethod.STRAIGHT_LINE)
                .build();
    }

    @Test
    @DisplayName("single-asset analysis returns the financial figures, not just the identity fields")
    void analysisCarriesFinancialFigures() {
        Equipment equipment = asset(1L, "100000", 10, LocalDate.now().minusYears(5));
        when(equipmentRepository.findByIdAndHospitalId(1L, HOSPITAL_ID))
                .thenReturn(Optional.of(equipment));

        EquipmentFinancialResponse response =
                financialService.getEquipmentFinancialAnalysis(1L, USERNAME);

        assertEquals("EQ-001", response.getEquipmentCode());
        assertEquals(100_000.0, response.getPurchaseCost(), 0.01);
        assertNotNull(response.getCurrentValue());
        assertNotNull(response.getDepreciationAmount());
        assertNotNull(response.getDepreciationPercentage());
        assertNotNull(response.getRemainingUsefulLife());
        assertNotNull(response.getSalvageValue());
        assertEquals("STRAIGHT_LINE", response.getDepreciationMethod());

        // Half of a ten-year life is gone, so roughly half the depreciable base is written off.
        assertTrue(response.getCurrentValue() < 100_000);
        assertTrue(response.getCurrentValue() > 10_000);
        assertEquals(5, response.getRemainingUsefulLife());
    }

    @Test
    @DisplayName("an asset owned by another hospital is not valued")
    void otherHospitalsAssetIsNotFound() {
        when(equipmentRepository.findByIdAndHospitalId(99L, HOSPITAL_ID))
                .thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> financialService.getEquipmentFinancialAnalysis(99L, USERNAME));
    }

    @Test
    @DisplayName("the dashboard totals every asset and reads the fleet once")
    void dashboardTotalsTheFleetWithOneQuery() {
        when(equipmentRepository.findByHospitalId(HOSPITAL_ID)).thenReturn(List.of(
                asset(1L, "100000", 10, LocalDate.now().minusYears(2)),
                asset(2L, "50000", 10, LocalDate.now().minusYears(1))));

        EquipmentFinancialDashboardResponse response =
                financialService.getFinancialDashboard(USERNAME);

        assertEquals(2L, response.getSummary().getTotalEquipment());
        assertEquals(150_000.0, response.getSummary().getTotalAssetValue(), 0.01);
        assertEquals(2, response.getEquipment().size());
        assertEquals(USERNAME, response.getGeneratedBy());
        assertNotNull(response.getGeneratedAt());

        // The summary has to partition the fleet: current value plus depreciation is the cost.
        assertEquals(
                response.getSummary().getTotalAssetValue(),
                response.getSummary().getCurrentAssetValue()
                        + response.getSummary().getTotalDepreciation(),
                0.05);

        // Valuing the fleet through the single-asset path re-read every row it already had.
        verify(equipmentRepository, never()).findByIdAndHospitalId(
                org.mockito.ArgumentMatchers.anyLong(), org.mockito.ArgumentMatchers.anyLong());
    }

    @Test
    @DisplayName("an empty fleet reports zeroes rather than dividing by zero")
    void emptyFleetIsNotADivisionByZero() {
        when(equipmentRepository.findByHospitalId(HOSPITAL_ID)).thenReturn(List.of());

        EquipmentFinancialDashboardResponse response =
                financialService.getFinancialDashboard(USERNAME);

        assertEquals(0L, response.getSummary().getTotalEquipment());
        assertEquals(0.0, response.getSummary().getAverageDepreciation(), 0.01);
        assertEquals(0L, response.getSummary().getReplacementRecommended());
        assertTrue(response.getEquipment().isEmpty());
    }

    @Test
    @DisplayName("replacement recommendations return end-of-life assets, most urgent first")
    void replacementRecommendationsAreRankedByUrgency() {
        when(equipmentRepository.findByHospitalId(HOSPITAL_ID)).thenReturn(List.of(
                asset(1L, "100000", 10, LocalDate.now().minusYears(1)),   // 9 years left, healthy
                asset(2L, "100000", 10, LocalDate.now().minusYears(10)),  // fully written down
                asset(3L, "100000", 10, LocalDate.now().minusYears(9)))); // 1 year left

        List<EquipmentFinancialResponse> recommendations =
                financialService.getReplacementRecommendations(USERNAME);

        assertEquals(2, recommendations.size());
        assertEquals(2L, recommendations.get(0).getEquipmentId());
        assertEquals(3L, recommendations.get(1).getEquipmentId());
    }

    @Test
    @DisplayName("an asset with no finance fields is valued at zero instead of failing")
    void assetWithoutFinanceFieldsIsValuedAtZero() {
        Equipment equipment = asset(4L, null, null, null);
        when(equipmentRepository.findByIdAndHospitalId(4L, HOSPITAL_ID))
                .thenReturn(Optional.of(equipment));

        EquipmentFinancialResponse response =
                financialService.getEquipmentFinancialAnalysis(4L, USERNAME);

        assertEquals(0.0, response.getPurchaseCost(), 0.01);
        assertEquals(0.0, response.getCurrentValue(), 0.01);
        assertEquals(0.0, response.getDepreciationPercentage(), 0.01);
        // No recorded life falls back to the documented default rather than dividing by zero.
        assertEquals(10, response.getUsefulLifeYears());
        // A null category must not drop the request.
        assertEquals(null, response.getCategory());
    }

    @Test
    @DisplayName("a user with no hospital profile is rejected, not served another tenant's fleet")
    void userWithoutHospitalIsRejected() {
        when(hospitalRepository.findByUserId(1L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> financialService.getFinancialDashboard(USERNAME));
    }
}

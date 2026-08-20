package com.medtrack.service;

import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.dto.EquipmentFinancialDashboardResponse;
import com.medtrack.dto.EquipmentFinancialResponse;
import com.medtrack.dto.EquipmentFinancialSummary;
import com.medtrack.exception.ResourceNotFoundException;
import com.medtrack.model.DepreciationMethod;
import com.medtrack.model.Equipment;
import com.medtrack.model.Hospital;
import com.medtrack.repository.EquipmentRepository;
import com.medtrack.repository.HospitalRepository;
import com.medtrack.util.DepreciationCalculator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

/**
 * Depreciation and fleet-valuation reporting for the equipment owned by one hospital.
 *
 * <p>Every read is scoped to the hospital that owns the authenticated user, so an asset belonging
 * to another tenant can neither be valued nor counted in a summary.</p>
 */
@Service
@RequiredArgsConstructor
public class EquipmentFinancialService {

    /**
     * Residual value assumed when an asset has no salvage figure recorded. Equipment does not
     * store one, so the reports fall back to a tenth of the purchase price and say so through
     * {@code salvageValue} in the response rather than hiding the assumption.
     */
    private static final double DEFAULT_SALVAGE_RATE = 0.10;

    /** Depreciable life assumed when an asset has none recorded. */
    private static final int DEFAULT_USEFUL_LIFE_YEARS = 10;

    private final EquipmentRepository equipmentRepository;
    private final HospitalRepository hospitalRepository;
    private final UserRepository userRepository;

    /**
     * Fleet-wide valuation for the caller's hospital: one row per asset plus the totals across
     * them.
     */
    @Transactional(readOnly = true)
    @Cacheable(value = "financialDashboard", key = "#username")
    public EquipmentFinancialDashboardResponse getFinancialDashboard(String username) {

        Hospital hospital = getHospitalForUser(username);

        // One query for the whole fleet. Valuing each asset through the single-asset endpoint
        // re-resolved the user, the hospital and the equipment row for every item, which is three
        // extra queries per asset for data already in hand.
        List<EquipmentFinancialResponse> equipment =
                equipmentRepository.findByHospitalId(hospital.getId()).stream()
                        .map(this::toFinancialResponse)
                        .toList();

        double totalAssetValue = 0;
        double currentAssetValue = 0;
        double totalDepreciation = 0;
        long replacementRecommended = 0;

        for (EquipmentFinancialResponse item : equipment) {
            totalAssetValue += item.getPurchaseCost();
            currentAssetValue += item.getCurrentValue();
            totalDepreciation += item.getDepreciationAmount();

            if (DepreciationCalculator.needsReplacement(
                    item.getRemainingUsefulLife(), item.getDepreciationPercentage())) {
                replacementRecommended++;
            }
        }

        EquipmentFinancialSummary summary = new EquipmentFinancialSummary();
        summary.setTotalEquipment((long) equipment.size());
        summary.setTotalAssetValue(totalAssetValue);
        summary.setCurrentAssetValue(currentAssetValue);
        summary.setTotalDepreciation(totalDepreciation);
        summary.setAverageDepreciation(
                equipment.isEmpty() ? 0 : totalDepreciation / equipment.size());
        summary.setReplacementRecommended(replacementRecommended);

        EquipmentFinancialDashboardResponse response = new EquipmentFinancialDashboardResponse();
        response.setGeneratedAt(LocalDateTime.now());
        response.setGeneratedBy(username);
        response.setSummary(summary);
        response.setEquipment(equipment);

        return response;
    }

    /** Valuation of a single asset, provided it belongs to the caller's hospital. */
    @Transactional(readOnly = true)
    public EquipmentFinancialResponse getEquipmentFinancialAnalysis(
            Long equipmentId,
            String username) {

        Hospital hospital = getHospitalForUser(username);

        Equipment equipment = equipmentRepository
                .findByIdAndHospitalId(equipmentId, hospital.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Equipment not found."));

        return toFinancialResponse(equipment);
    }

    /**
     * Assets that are within a year of end of life or almost fully written down, most urgent
     * first. This is what {@code GET /api/equipment/replacement-recommendations} serves; the
     * endpoint has been in the controller since the module was added but the method behind it was
     * never written, so the mapping could not be dispatched.
     */
    @Transactional(readOnly = true)
    public List<EquipmentFinancialResponse> getReplacementRecommendations(String username) {

        Hospital hospital = getHospitalForUser(username);

        return equipmentRepository.findByHospitalId(hospital.getId()).stream()
                .map(this::toFinancialResponse)
                .filter(item -> DepreciationCalculator.needsReplacement(
                        item.getRemainingUsefulLife(), item.getDepreciationPercentage()))
                .sorted(Comparator.comparingInt(
                        (EquipmentFinancialResponse item) -> DepreciationCalculator.replacementScore(
                                item.getRemainingUsefulLife(), item.getDepreciationPercentage()))
                        .reversed()
                        .thenComparing(EquipmentFinancialResponse::getEquipmentId))
                .toList();
    }

    /**
     * Maps one asset onto its valuation. Every financial field is populated here; the identity
     * fields alone are not a financial analysis, and a response missing them reads to the client
     * as an asset worth nothing.
     */
    private EquipmentFinancialResponse toFinancialResponse(Equipment equipment) {

        double purchaseCost = toDouble(equipment.getPurchaseCost());

        // Equipment has no salvage column. Assume a residual tenth of the purchase price and
        // report the figure used, so the client is not left to guess at the assumption.
        double salvageValue = purchaseCost * DEFAULT_SALVAGE_RATE;

        Integer recordedLife = equipment.getUsefulLifeYears();
        int usefulLife = (recordedLife == null || recordedLife <= 0)
                ? DEFAULT_USEFUL_LIFE_YEARS
                : recordedLife;

        double currentValue = DepreciationCalculator.calculateCurrentValue(
                purchaseCost, salvageValue, usefulLife, equipment.getPurchaseDate());

        EquipmentFinancialResponse response = new EquipmentFinancialResponse();

        response.setEquipmentId(equipment.getId());
        response.setEquipmentName(equipment.getName());
        response.setEquipmentCode(equipment.getEquipmentCode());
        response.setDepartment(equipment.getDepartment());
        // Category is optional on the entity, so read the name defensively rather than dropping
        // the whole request with a NullPointerException on an asset that was never categorised.
        response.setCategory(equipment.getCategory() == null ? null : equipment.getCategory().name());
        response.setPurchaseDate(equipment.getPurchaseDate());

        response.setPurchaseCost(purchaseCost);
        response.setCurrentValue(currentValue);
        response.setDepreciationAmount(
                DepreciationCalculator.calculateDepreciationAmount(purchaseCost, currentValue));
        response.setDepreciationPercentage(
                DepreciationCalculator.calculateDepreciationPercentage(purchaseCost, currentValue));
        response.setUsefulLifeYears(usefulLife);
        response.setRemainingUsefulLife(DepreciationCalculator.calculateRemainingUsefulLife(
                usefulLife, equipment.getPurchaseDate()));
        response.setSalvageValue(salvageValue);
        response.setDepreciationMethod(methodName(equipment.getDepreciationMethod()));

        return response;
    }

    private Hospital getHospitalForUser(String username) {

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        return hospitalRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Hospital not found."));
    }

    /**
     * Purchase cost is a nullable BigDecimal on the entity - null means the finance fields were
     * never filled in, which is an asset with no cost tracked rather than an error.
     */
    private static double toDouble(BigDecimal value) {
        return value == null ? 0.0 : value.doubleValue();
    }

    private static String methodName(DepreciationMethod method) {
        return (method == null ? DepreciationMethod.STRAIGHT_LINE : method).name();
    }
}

package com.medtrack.service;

import com.medtrack.dto.EquipmentDashboardResponse;
import com.medtrack.dto.EquipmentStatisticsResponse;
import com.medtrack.dto.EquipmentUtilizationResponse;
import com.medtrack.dto.EquipmentValuationResponse;
import com.medtrack.dto.LowStockSummaryResponse;
import com.medtrack.dto.WarrantySummaryResponse;
import com.medtrack.model.Equipment;
import com.medtrack.model.EquipmentStatus;
import com.medtrack.model.Hospital;
import com.medtrack.repository.EquipmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Service for equipment statistics and reporting operations.
 * Handles dashboard data, utilization metrics, valuation, and warranty summaries.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EquipmentStatisticsService {

    private final EquipmentRepository equipmentRepository;

    /** Horizon used to classify a warranty as "expiring soon". */
    static final int WARRANTY_EXPIRY_HORIZON_DAYS = 30;

    @Cacheable(value = "equipmentDashboard", key = "#username")
    public EquipmentDashboardResponse getDashboardOverview(String username, Hospital hospital) {
        long total = equipmentRepository.countByHospitalId(hospital.getId());
        long active = equipmentRepository.countByHospitalIdAndStatus(hospital.getId(), EquipmentStatus.ACTIVE);
        long maintenance = equipmentRepository.countByHospitalIdAndStatus(hospital.getId(), EquipmentStatus.UNDER_MAINTENANCE);
        long retired = equipmentRepository.countByHospitalIdAndStatus(hospital.getId(), EquipmentStatus.RETIRED);
        long expired = equipmentRepository.countByHospitalIdAndWarrantyExpiryBefore(hospital.getId(), LocalDate.now());
        long expiringSoon = equipmentRepository.countByHospitalIdAndWarrantyExpiryBetween(
                hospital.getId(), LocalDate.now(), LocalDate.now().plusDays(30));
        long lowStock = equipmentRepository.findLowStockEquipment(hospital.getId()).size();

        return new EquipmentDashboardResponse(total, active, maintenance, retired, expired, expiringSoon, lowStock);
    }

    public EquipmentUtilizationResponse getEquipmentUtilization(Hospital hospital) {
        List<Equipment> equipmentList = equipmentRepository.findByHospitalId(hospital.getId());

        long total = equipmentList.size();
        long active = equipmentList.stream().filter(e -> e.getStatus() == EquipmentStatus.ACTIVE).count();
        long underMaintenance = equipmentList.stream().filter(e -> e.getStatus() == EquipmentStatus.UNDER_MAINTENANCE).count();
        long retired = equipmentList.stream().filter(e -> e.getStatus() == EquipmentStatus.RETIRED).count();

        double utilization = total == 0 ? 0.0 : Math.round((active * 100.0 / total) * 100.0) / 100.0;

        return new EquipmentUtilizationResponse(total, active, underMaintenance, retired, utilization);
    }

    public LowStockSummaryResponse getLowStockSummary(Hospital hospital) {
        List<Equipment> inventory = equipmentRepository.findByHospitalId(hospital.getId());

        long lowStock = 0;
        long outOfStock = 0;
        long totalUnits = 0;

        for (Equipment equipment : inventory) {
            int quantity = equipment.getQuantity() != null ? equipment.getQuantity() : 0;
            int threshold = equipment.getMinimumStock() != null ? equipment.getMinimumStock() : 0;

            totalUnits += quantity;
            if (quantity <= threshold) {
                lowStock++;
            }
            if (quantity == 0) {
                outOfStock++;
            }
        }

        return LowStockSummaryResponse.builder()
                .totalTrackedItems(inventory.size())
                .lowStockItems(lowStock)
                .outOfStockItems(outOfStock)
                .totalUnitsInStock(totalUnits)
                .build();
    }

    public Map<EquipmentStatus, Long> getEquipmentStatusSummary(Hospital hospital) {
        Map<EquipmentStatus, Long> summary = new EnumMap<>(EquipmentStatus.class);

        for (EquipmentStatus status : EquipmentStatus.values()) {
            long count = equipmentRepository.countByHospitalIdAndStatus(hospital.getId(), status);
            summary.put(status, count);
        }

        return summary;
    }

    public Map<String, Long> getCategorySummary(Hospital hospital) {
        List<Object[]> results = equipmentRepository.countEquipmentByCategory(hospital.getId());

        Map<String, Long> summary = new LinkedHashMap<>();

        for (Object[] row : results) {
            summary.put(row[0].toString(), ((Number) row[1]).longValue());
        }

        return summary;
    }

    public WarrantySummaryResponse getWarrantySummary(Hospital hospital) {
        Long hospitalId = hospital.getId();
        LocalDate today = LocalDate.now();
        LocalDate horizon = today.plusDays(WARRANTY_EXPIRY_HORIZON_DAYS);

        long total = equipmentRepository.countByHospitalId(hospitalId);
        long expired = equipmentRepository.countByHospitalIdAndWarrantyExpiryBefore(hospitalId, today);
        long expiringSoon = equipmentRepository.countByHospitalIdAndWarrantyExpiryBetween(hospitalId, today, horizon);
        long valid = equipmentRepository.countByHospitalIdAndWarrantyExpiryAfter(hospitalId, horizon);
        long unknown = equipmentRepository.countByHospitalIdAndWarrantyExpiryIsNull(hospitalId);

        return WarrantySummaryResponse.builder()
                .total(total)
                .expired(expired)
                .expiringSoon(expiringSoon)
                .valid(valid)
                .unknown(unknown)
                .build();
    }

    public Map<String, Long> getEquipmentAgeSummary(Hospital hospital) {
        List<Equipment> equipmentList = equipmentRepository.findByHospitalId(hospital.getId());
        LocalDate today = LocalDate.now();

        long lessThanOneYear = 0;
        long oneToThreeYears = 0;
        long threeToFiveYears = 0;
        long moreThanFiveYears = 0;

        for (Equipment equipment : equipmentList) {
            if (equipment.getPurchaseDate() == null) {
                continue;
            }

            long years = ChronoUnit.YEARS.between(equipment.getPurchaseDate(), today);

            if (years < 1) {
                lessThanOneYear++;
            } else if (years < 3) {
                oneToThreeYears++;
            } else if (years < 5) {
                threeToFiveYears++;
            } else {
                moreThanFiveYears++;
            }
        }

        Map<String, Long> summary = new LinkedHashMap<>();
        summary.put("lessThanOneYear", lessThanOneYear);
        summary.put("oneToThreeYears", oneToThreeYears);
        summary.put("threeToFiveYears", threeToFiveYears);
        summary.put("moreThanFiveYears", moreThanFiveYears);

        return summary;
    }

    public EquipmentStatisticsResponse getEquipmentStatistics(Hospital hospital) {
        long total = equipmentRepository.countByHospitalId(hospital.getId());
        long active = equipmentRepository.countByHospitalIdAndStatus(hospital.getId(), EquipmentStatus.ACTIVE);
        long maintenance = equipmentRepository.countByHospitalIdAndStatus(hospital.getId(), EquipmentStatus.UNDER_MAINTENANCE);
        long retired = equipmentRepository.countByHospitalIdAndStatus(hospital.getId(), EquipmentStatus.RETIRED);
        long expiredWarranty = equipmentRepository.countByHospitalIdAndWarrantyExpiryBefore(hospital.getId(), LocalDate.now());

        return new EquipmentStatisticsResponse(total, active, maintenance, retired, expiredWarranty);
    }

    public EquipmentValuationResponse getEquipmentValuation(Hospital hospital) {
        List<Equipment> inventory = equipmentRepository.findByHospitalId(hospital.getId());

        BigDecimal totalPurchaseCost = BigDecimal.ZERO;
        BigDecimal totalBookValue = BigDecimal.ZERO;
        BigDecimal totalReplacementCost = BigDecimal.ZERO;
        long assetsWithCost = 0;
        long fullyDepreciatedCount = 0;

        Map<String, BigDecimal> purchaseCostByCategory = new LinkedHashMap<>();
        Map<String, BigDecimal> bookValueByCategory = new LinkedHashMap<>();
        List<EquipmentValuationResponse.AssetValuation> topAssets = new ArrayList<>();

        for (Equipment item : inventory) {
            BigDecimal cost = item.getPurchaseCost();
            BigDecimal bookValue = item.getBookValue();
            BigDecimal replacement = item.getProjectedReplacementCost();

            if (cost != null) {
                assetsWithCost++;
                totalPurchaseCost = totalPurchaseCost.add(cost);
            }
            if (bookValue != null) {
                totalBookValue = totalBookValue.add(bookValue);
                if (bookValue.signum() == 0) {
                    fullyDepreciatedCount++;
                }
            }
            if (replacement != null) {
                totalReplacementCost = totalReplacementCost.add(replacement);
            }

            String category = item.getCategory() != null ? item.getCategory().name() : "UNCATEGORISED";
            if (cost != null) {
                purchaseCostByCategory.merge(category, cost, BigDecimal::add);
            }
            if (bookValue != null) {
                bookValueByCategory.merge(category, bookValue, BigDecimal::add);
            }

            if (bookValue != null) {
                topAssets.add(new EquipmentValuationResponse.AssetValuation(
                        item.getId(), item.getName(), item.getDepartment(), item.getEquipmentCode(),
                        cost, bookValue, replacement));
            }
        }

        topAssets.sort(Comparator.comparing(EquipmentValuationResponse.AssetValuation::getBookValue).reversed());
        List<EquipmentValuationResponse.AssetValuation> topFive =
                topAssets.size() > 5 ? topAssets.subList(0, 5) : topAssets;

        return EquipmentValuationResponse.builder()
                .assetCount(inventory.size())
                .assetsWithCost(assetsWithCost)
                .fullyDepreciatedCount(fullyDepreciatedCount)
                .totalPurchaseCost(totalPurchaseCost.setScale(2, RoundingMode.HALF_UP))
                .totalBookValue(totalBookValue.setScale(2, RoundingMode.HALF_UP))
                .totalReplacementCost(totalReplacementCost.setScale(2, RoundingMode.HALF_UP))
                .purchaseCostByCategory(purchaseCostByCategory)
                .bookValueByCategory(bookValueByCategory)
                .topAssetsByBookValue(topFive)
                .build();
    }
}

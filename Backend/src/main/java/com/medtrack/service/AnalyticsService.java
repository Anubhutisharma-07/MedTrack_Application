package com.medtrack.service;

import com.medtrack.dto.EquipmentFailureRiskDto;
import com.medtrack.dto.HospitalAnalyticsDto;
import com.medtrack.exception.ResourceNotFoundException;
import com.medtrack.model.Equipment;
import com.medtrack.model.EquipmentCategory;
import com.medtrack.model.EquipmentOrder;
import com.medtrack.model.EquipmentStatus;
import com.medtrack.model.Hospital;
import com.medtrack.model.MaintenanceStatus;
import com.medtrack.model.MaintenanceTask;
import com.medtrack.repository.EquipmentOrderRepository;
import com.medtrack.repository.EquipmentRepository;
import com.medtrack.repository.HospitalRepository;
import com.medtrack.repository.MaintenanceTaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final EquipmentRepository equipmentRepository;
    private final MaintenanceTaskRepository taskRepository;
    private final EquipmentOrderRepository orderRepository;
    private final HospitalRepository hospitalRepository;

    public HospitalAnalyticsDto getHospitalAnalytics(Long hospitalId) {
        // Existence guard: every figure below is keyed on the id, so an unknown hospital has to be
        // reported here rather than silently returning a dashboard full of zeroes.
        if (!hospitalRepository.existsById(hospitalId)) {
            throw new ResourceNotFoundException("Hospital not found with id: " + hospitalId);
        }

        // 1. Downtime Percentage — database-level aggregation
        long totalEquipment = equipmentRepository.countByHospitalId(hospitalId);
        long underMaintenanceCount = equipmentRepository.countByHospitalIdAndStatus(
                hospitalId, EquipmentStatus.UNDER_MAINTENANCE);
        double downtimePercentage = totalEquipment > 0
                ? (underMaintenanceCount * 100.0) / totalEquipment
                : 0.0;

        // 2. Upcoming Warranty Expirations (within next 30 days) — database-level.
        //
        // Retired and disposed assets are excluded (issue #943). Their warranty date is historical
        // record: the device has left the estate and the cover cannot be renewed, so counting it
        // here overstates the work in front of the team and puts this tile out of step with the
        // warranty-expiry alert feed, which applies the same rule.
        LocalDate today = LocalDate.now();
        LocalDate limit = today.plusDays(30);
        long upcomingWarrantyCount = equipmentRepository.countAlertableByHospitalIdAndWarrantyExpiryBetween(
                hospitalId, today, limit, EquipmentStatus.DECOMMISSIONED);

        // 3. Maintenance SLA compliance — load only measurable completed tasks
        List<MaintenanceTask> measurableTasks = taskRepository.findCompletedTasksWithTimestamps(
                hospitalId, MaintenanceStatus.COMPLETED);
        long compliantCount = measurableTasks.stream()
                .filter(task -> !task.getCompletedAt().toLocalDate().isAfter(task.getDeadline()))
                .count();
        double slaCompliance = measurableTasks.isEmpty()
                ? 100.0
                : (compliantCount * 100.0) / measurableTasks.size();

        // MTTR — database-level AVG
        Double avgHours = taskRepository.averageHoursWorkedByHospitalIdAndStatus(
                hospitalId, MaintenanceStatus.COMPLETED);
        double mttr = avgHours != null ? avgHours : 0.0;

        // 4. Critical Pending Count — database-level aggregation
        long criticalPending = taskRepository.countByHospitalIdAndStatusNotAndPriority(
                hospitalId, MaintenanceStatus.COMPLETED, "Critical");

        // 5. Total Spend & Category Spend — DB-level filtered orders + lightweight category mapping
        //
        // Matched on the hospital id rather than on the profile name. EquipmentOrder.hospital is
        // free text and the two flows that create orders label it differently - placeOrder writes
        // the user's organisation, acceptQuote writes the profile name - so filtering on the name
        // alone counted only whichever half happened to match.
        BigDecimal totalSpend = orderRepository.sumTotalCostByHospitalIdAndShippingStatus(
                hospitalId, "Delivered");
        if (totalSpend == null) totalSpend = BigDecimal.ZERO;

        List<EquipmentOrder> deliveredOrders = orderRepository.findByHospitalIdAndShippingStatus(
                hospitalId, "Delivered");

        List<Object[]> nameCategoryPairs = equipmentRepository.findNameAndCategoryByHospitalId(hospitalId);
        Map<String, String> equipmentCategoryMap = new HashMap<>();
        for (Object[] pair : nameCategoryPairs) {
            String name = (String) pair[0];
            EquipmentCategory category = (EquipmentCategory) pair[1];
            if (name != null && category != null) {
                equipmentCategoryMap.put(name.toLowerCase(), category.name());
            }
        }

        Map<String, BigDecimal> spendByCategory = new HashMap<>();
        for (EquipmentOrder order : deliveredOrders) {
            BigDecimal cost = order.getTotalCost() != null ? order.getTotalCost() : BigDecimal.ZERO;
            String category = resolveCategory(order, equipmentCategoryMap);
            spendByCategory.put(category, spendByCategory.getOrDefault(category, BigDecimal.ZERO).add(cost));
        }

        // 6. Fleet valuation (issue #702): aggregate the whole inventory at cost, on the books,
        // and at replacement value. Assets without a purchase cost carry no value.
        BigDecimal fleetPurchaseCost = BigDecimal.ZERO;
        BigDecimal fleetBookValue = BigDecimal.ZERO;
        BigDecimal fleetReplacementCost = BigDecimal.ZERO;
        long fullyDepreciatedCount = 0;
        Map<String, BigDecimal> bookValueByCategory = new HashMap<>();

        for (Equipment item : equipmentRepository.findByHospitalId(hospitalId)) {
            if (item.getPurchaseCost() != null) {
                fleetPurchaseCost = fleetPurchaseCost.add(item.getPurchaseCost());
            }
            BigDecimal bookValue = item.getBookValue();
            if (bookValue != null) {
                fleetBookValue = fleetBookValue.add(bookValue);
                if (bookValue.signum() == 0) {
                    fullyDepreciatedCount++;
                }
                String category = item.getCategory() != null ? item.getCategory().name() : "UNCATEGORISED";
                bookValueByCategory.put(category, bookValueByCategory.getOrDefault(category, BigDecimal.ZERO).add(bookValue));
            }
            BigDecimal replacement = item.getProjectedReplacementCost();
            if (replacement != null) {
                fleetReplacementCost = fleetReplacementCost.add(replacement);
            }
        }

        return HospitalAnalyticsDto.builder()
                .totalSpend(totalSpend)
                .spendByCategory(spendByCategory)
                .slaComplianceRate(slaCompliance)
                .meanTimeToRepairHours(mttr)
                .criticalFailingAssetsCount(criticalPending)
                .downtimePercentage(downtimePercentage)
                .upcomingWarrantyExpirationsCount(upcomingWarrantyCount)
                .fleetPurchaseCost(fleetPurchaseCost.setScale(2, java.math.RoundingMode.HALF_UP))
                .fleetBookValue(fleetBookValue.setScale(2, java.math.RoundingMode.HALF_UP))
                .fleetReplacementCost(fleetReplacementCost.setScale(2, java.math.RoundingMode.HALF_UP))
                .bookValueByCategory(bookValueByCategory)
                .fullyDepreciatedCount(fullyDepreciatedCount)
                .build();
    }

    /**
     * Scores one asset's risk of failure out of 100 across four factors: age against its useful
     * life (40), how often it has needed work (30), how long since it last had any (20) and how much
     * scheduled work is overdue on it (10).
     *
     * <p>The inputs are repository aggregates rather than a page of task entities. The method used
     * to load up to a thousand rows to answer "are there more than five, and which is the newest",
     * and it took the newest with {@code Comparator.comparing(MaintenanceTask::getCompletedAt)} -
     * which throws on a task that reached {@code COMPLETED} without a completion timestamp. Those
     * exist, which is why the sibling query {@code findCompletedTasksWithTimestamps} has to spell
     * out {@code completed_at IS NOT NULL}, and one of them turned this endpoint into a 500 for
     * that asset.</p>
     */
    public EquipmentFailureRiskDto predictFailureRisk(Long equipmentId, Long hospitalId) {
        Equipment equipment = equipmentRepository.findByIdAndHospitalId(equipmentId, hospitalId)
                .orElseThrow(() -> new ResourceNotFoundException("Equipment not found"));

        String equipmentCode = equipment.getEquipmentCode();
        long completedTaskCount = taskRepository.countByHospitalIdAndEquipmentCodeAndStatus(
                hospitalId, equipmentCode, MaintenanceStatus.COMPLETED);

        int score = 0; // Risk score (0 to 100+)
        LocalDate now = LocalDate.now();

        // 1. Age Factor (max 40 pts)
        if (equipment.getPurchaseDate() != null && equipment.getUsefulLifeYears() != null && equipment.getUsefulLifeYears() > 0) {
            long ageDays = ChronoUnit.DAYS.between(equipment.getPurchaseDate(), now);
            double ageYears = ageDays / 365.25;
            double lifespanRatio = ageYears / equipment.getUsefulLifeYears();
            if (lifespanRatio > 1.0) {
                score += 40;
            } else if (lifespanRatio > 0.8) {
                score += 30;
            } else if (lifespanRatio > 0.5) {
                score += 15;
            }
        } else {
            score += 20; // Default risk if unknown age
        }

        // 2. Usage / Maintenance Frequency Factor (max 30 pts)
        if (completedTaskCount > 5) {
            score += 30;
        } else if (completedTaskCount > 3) {
            score += 20;
        } else if (completedTaskCount > 0) {
            score += 10;
        }

        // 3. Last Maintenance Recency (max 20 pts)
        //
        // An asset whose entire history lacks completion timestamps is treated the same as one with
        // no history: there is no recency signal either way, and the alternative - reading a null
        // timestamp as a date - is what made this method throw.
        Optional<LocalDateTime> lastCompletion =
                taskRepository.findLastCompletionForEquipment(hospitalId, equipmentCode);
        if (lastCompletion.isPresent()) {
            long daysSinceMaintenance = ChronoUnit.DAYS.between(lastCompletion.get().toLocalDate(), now);
            if (daysSinceMaintenance > 365) {
                score += 20;
            } else if (daysSinceMaintenance > 180) {
                score += 10;
            }
        } else {
            score += 20; // No usable maintenance history
        }

        // 4. Overdue Maintenance Penalty (max 10 pts)
        //
        // Work that was scheduled on this asset and has not been done is the strongest single
        // signal of impending failure, and until now it did not reach the score at all: the count
        // that stood here was hospital-wide, filtered to "Critical" priority, and assigned to a
        // local variable that was never read. The factor measured whether the asset happened to be
        // in the shop, so an asset three months past three deadlines scored exactly like one with
        // nothing outstanding.
        long overdueTaskCount = taskRepository.countOverdueForEquipment(hospitalId, equipmentCode, now);
        int overdueScore = (int) Math.min(overdueTaskCount * 5L, 10L);
        if (equipment.getStatus() == EquipmentStatus.UNDER_MAINTENANCE) {
            // Being on a workbench right now is a real signal, but it shares this factor's ceiling
            // with the overdue work the factor is named after rather than stacking on top of it.
            overdueScore = Math.min(overdueScore + 5, 10);
        }
        score += overdueScore;

        int failureProbability = Math.min(score, 100);
        String riskTier = "LOW";
        String recommendation = "Optimal operating condition. Perform routine preventive maintenance.";
        LocalDate predictedFailureDate = now.plusDays(365); // Default 1 year

        if (failureProbability >= 80) {
            riskTier = "CRITICAL";
            recommendation = "High risk of immediate failure. Urgent replacement or major overhaul advised.";
            predictedFailureDate = now.plusDays(30);
        } else if (failureProbability >= 60) {
            riskTier = "HIGH";
            recommendation = "Elevated risk. Plan procurement replacement or extensive maintenance within 2 quarters.";
            predictedFailureDate = now.plusDays(90);
        } else if (failureProbability >= 30) {
            riskTier = "MODERATE";
            recommendation = "Moderate risk. Monitor usage and adhere strictly to preventive maintenance schedule.";
            predictedFailureDate = now.plusDays(180);
        }

        return EquipmentFailureRiskDto.builder()
                .failureProbability(failureProbability)
                .riskTier(riskTier)
                .predictedFailureDate(predictedFailureDate)
                .recommendation(recommendation)
                .build();
    }

    private String resolveCategory(EquipmentOrder order, Map<String, String> equipmentCategoryMap) {
        String eqName = order.getEquipmentName();
        if (eqName != null) {
            String category = equipmentCategoryMap.get(eqName.toLowerCase());
            if (category != null) return category;
        }

        // The heuristic fallback below must speak the same vocabulary as the lookup above, which
        // returns EquipmentCategory.name(). It previously returned Title-Case strings, so the key a
        // caller saw depended on whether the order's equipmentName happened to match a registered
        // asset: the same category could appear as both "IMAGING" and "Imaging" in one response, and
        // a dashboard keying on either would silently miss half the spend.
        if (eqName == null) return EquipmentCategory.OTHER.name();
        String lower = eqName.toLowerCase();
        if (lower.contains("mri") || lower.contains("scan") || lower.contains("imaging")) {
            return EquipmentCategory.IMAGING.name();
        }
        if (lower.contains("pump") || lower.contains("monitor")) {
            return EquipmentCategory.MONITORING.name();
        }
        if (lower.contains("ventilator") || lower.contains("respiratory")) {
            return EquipmentCategory.RESPIRATORY.name();
        }
        if (lower.contains("laser") || lower.contains("surgical")) {
            return EquipmentCategory.SURGICAL.name();
        }
        return EquipmentCategory.OTHER.name();
    }
}

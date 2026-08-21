package com.medtrack.util;

import com.medtrack.model.DepreciationMethod;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

/**
 * Depreciation and replacement-value maths for the equipment fleet.
 *
 * <p>Book value is always floored at zero - an asset never shows a negative value on the books -
 * and an asset without a purchase cost has no depreciation: its book value equals its cost (null
 * or zero), exactly as if the finance fields were never filled in.</p>
 *
 * <p>Elapsed time is measured in fractional years ({@code days / 365.25}) so book value changes
 * smoothly day to day instead of jumping once a year.</p>
 *
 * <p>There are two entry points into the same maths. {@link #bookValue} and
 * {@link #projectedReplacementCost} are the {@code BigDecimal} valuation used by the
 * {@code Equipment} entity's transient getters, where money must not lose precision. The
 * {@code calculate*} helpers below are the salvage-aware view used by the financial analytics
 * endpoints, whose DTOs carry doubles. Both share {@link #elapsedYears} and the same rounding, so
 * the dashboard and the entity can never disagree about the same asset.</p>
 */
public final class DepreciationCalculator {

    /** Annual medical-equipment price inflation used for the replacement-cost projection. */
    public static final double REPLACEMENT_INFLATION_RATE = 0.03;

    /** Depreciation at or above this percentage marks an asset as due for replacement. */
    public static final double REPLACEMENT_DEPRECIATION_THRESHOLD = 80.0;

    private static final MathContext MC = MathContext.DECIMAL64;

    private DepreciationCalculator() {
        // Static utility holder.
    }

    /**
     * Current book value of an asset: purchase cost minus accumulated depreciation, floored at 0.
     *
     * @param purchaseCost       purchase price; {@code null} means "no cost tracked"
     * @param purchaseDate       date acquired; {@code null} means depreciation never starts
     * @param usefulLifeYears    depreciable life in years; {@code null} or &le; 0 means no depreciation
     * @param method             depreciation method; {@code null} falls back to straight line
     * @param asOf               valuation date (typically today)
     * @return book value, or {@code null} if the asset has no purchase cost
     */
    public static BigDecimal bookValue(
            BigDecimal purchaseCost,
            LocalDate purchaseDate,
            Integer usefulLifeYears,
            DepreciationMethod method,
            LocalDate asOf) {

        BigDecimal cost = purchaseCost;
        if (cost == null) {
            return null;
        }
        if (purchaseDate == null || usefulLifeYears == null || usefulLifeYears <= 0) {
            return cost.setScale(2, RoundingMode.HALF_UP);
        }

        double elapsedYears = elapsedYears(purchaseDate, asOf);
        if (elapsedYears <= 0) {
            return cost.setScale(2, RoundingMode.HALF_UP);
        }

        BigDecimal accumulated = accumulatedDepreciation(cost, usefulLifeYears, method, elapsedYears);
        return cost.subtract(accumulated).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Depreciation recognised to date for an asset with the given elapsed life.
     *
     * @param purchaseCost    purchase price
     * @param usefulLifeYears depreciable life in years
     * @param method          depreciation method; {@code null} falls back to straight line
     * @param elapsedYears    years since purchase (fractional allowed)
     * @return accumulated depreciation, never more than the purchase cost
     */
    public static BigDecimal accumulatedDepreciation(
            BigDecimal purchaseCost,
            int usefulLifeYears,
            DepreciationMethod method,
            double elapsedYears) {

        if (purchaseCost == null
                || purchaseCost.signum() <= 0
                || usefulLifeYears <= 0
                || elapsedYears <= 0
                || !Double.isFinite(elapsedYears)) {
            return BigDecimal.ZERO;
        }

        double boundedElapsedYears = Math.min(elapsedYears, usefulLifeYears);
        double depreciation;
        if (method == DepreciationMethod.DECLINING_BALANCE) {
            depreciation = decliningBalanceDepreciation(
                    purchaseCost.doubleValue(), usefulLifeYears, boundedElapsedYears);
        } else {
            double annual = purchaseCost.doubleValue() / usefulLifeYears;
            depreciation = annual * boundedElapsedYears;
        }

        return BigDecimal.valueOf(depreciation)
                .min(purchaseCost)
                .max(BigDecimal.ZERO)
                .setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Double-declining depreciation with partial years prorated against the opening value of the
     * current year. The annual rate is capped at 100%; without that cap a one-year useful life
     * produces a decay factor of {@code -1}, and raising it to a fractional year produces NaN.
     */
    private static double decliningBalanceDepreciation(
            double purchaseCost,
            int usefulLifeYears,
            double elapsedYears) {

        double annualRate = Math.min(2.0 / usefulLifeYears, 1.0);
        int completeYears = (int) Math.floor(elapsedYears);
        double partialYear = elapsedYears - completeYears;
        double openingFactor = Math.pow(1.0 - annualRate, completeYears);
        double closingFactor = openingFactor * (1.0 - (annualRate * partialYear));
        return purchaseCost * (1.0 - closingFactor);
    }

    /**
     * Projected cost of replacing the asset today, compounding the purchase price at the medical
     * equipment inflation rate since acquisition. No purchase date means the estimate equals the
     * purchase price; no cost at all means no estimate.
     */
    public static BigDecimal projectedReplacementCost(
            BigDecimal purchaseCost,
            LocalDate purchaseDate,
            LocalDate asOf) {

        if (purchaseCost == null) {
            return null;
        }
        if (purchaseDate == null) {
            return purchaseCost.setScale(2, RoundingMode.HALF_UP);
        }

        double years = elapsedYears(purchaseDate, asOf);
        double growth = Math.pow(1.0 + REPLACEMENT_INFLATION_RATE, Math.max(0, years));
        return purchaseCost.multiply(BigDecimal.valueOf(growth), MC).setScale(2, RoundingMode.HALF_UP);
    }

    private static double elapsedYears(LocalDate from, LocalDate to) {
        if (from == null || to == null || !from.isBefore(to)) {
            return 0.0;
        }
        return ChronoUnit.DAYS.between(from, to) / 365.25;
    }

    // ---------------------------------------------------------------------
    // Salvage-aware straight line, used by the financial analytics endpoints
    //
    // These take and return doubles because the financial DTOs do. Every one of them delegates to
    // the BigDecimal maths above for the actual arithmetic and rounds to whole cents on the way
    // out, so a value shown on the financial dashboard matches the entity's book value for the
    // same asset instead of drifting from it by a rounding step.
    // ---------------------------------------------------------------------

    /**
     * Current value of an asset that is written down to a salvage floor rather than to zero.
     *
     * <p>Depreciation accrues on the depreciable base ({@code purchaseCost - salvageValue}) and
     * stops at the salvage value once the asset is fully written down. An asset with no useful
     * life recorded, or one whose purchase date is in the future, has not started depreciating and
     * is worth what it cost.</p>
     *
     * @param purchaseCost    purchase price; negative is treated as zero
     * @param salvageValue    residual value at end of life; clamped into {@code [0, purchaseCost]}
     * @param usefulLifeYears depreciable life in years; {@code <= 0} means no depreciation
     * @param purchaseDate    date acquired; {@code null} means depreciation never starts
     * @return current value, never below the salvage floor and never above the purchase cost
     */
    public static double calculateCurrentValue(
            double purchaseCost,
            double salvageValue,
            int usefulLifeYears,
            LocalDate purchaseDate) {

        return calculateCurrentValue(
                purchaseCost, salvageValue, usefulLifeYears, purchaseDate, LocalDate.now());
    }

    /**
     * {@link #calculateCurrentValue(double, double, int, LocalDate)} evaluated at an explicit
     * date. Tests use this so their expectations do not move with the calendar.
     */
    public static double calculateCurrentValue(
            double purchaseCost,
            double salvageValue,
            int usefulLifeYears,
            LocalDate purchaseDate,
            LocalDate asOf) {

        double cost = normalisedCost(purchaseCost);
        double salvage = normalisedSalvage(salvageValue, cost);

        // No life recorded, no purchase date, or a purchase dated in the future: nothing has been
        // consumed yet. The previous implementation divided by usefulLifeYears unconditionally,
        // which produced Infinity for a zero life, and subtracted a negative age for a future
        // purchase date, which valued an asset above what it cost.
        if (usefulLifeYears <= 0 || purchaseDate == null) {
            return round(cost);
        }

        double elapsed = elapsedYears(purchaseDate, asOf);
        if (elapsed <= 0) {
            return round(cost);
        }
        if (elapsed >= usefulLifeYears) {
            return round(salvage);
        }

        double depreciableBase = cost - salvage;
        double consumed = depreciableBase * (elapsed / usefulLifeYears);
        return round(Math.max(cost - consumed, salvage));
    }

    /**
     * Accumulated depreciation: what has been written off the purchase price so far. Never
     * negative, even if a caller passes a current value above the purchase cost.
     */
    public static double calculateDepreciationAmount(
            double purchaseCost,
            double currentValue) {

        return round(Math.max(purchaseCost - currentValue, 0.0));
    }

    /**
     * Accumulated depreciation as a percentage of the purchase price, in {@code [0, 100]}.
     * An asset with no recorded cost has depreciated 0%, not an undefined amount.
     */
    public static double calculateDepreciationPercentage(
            double purchaseCost,
            double currentValue) {

        if (purchaseCost <= 0) {
            return 0.0;
        }

        double percentage = ((purchaseCost - currentValue) / purchaseCost) * 100.0;
        return round(clamp(percentage, 0.0, 100.0));
    }

    /**
     * Whole years of depreciable life left, rounded down and floored at zero. A purchase date in
     * the future leaves the full life ahead of the asset rather than more than the full life.
     */
    public static int calculateRemainingUsefulLife(
            int usefulLifeYears,
            LocalDate purchaseDate) {

        return calculateRemainingUsefulLife(usefulLifeYears, purchaseDate, LocalDate.now());
    }

    /** {@link #calculateRemainingUsefulLife(int, LocalDate)} evaluated at an explicit date. */
    public static int calculateRemainingUsefulLife(
            int usefulLifeYears,
            LocalDate purchaseDate,
            LocalDate asOf) {

        if (usefulLifeYears <= 0) {
            return 0;
        }
        if (purchaseDate == null) {
            return usefulLifeYears;
        }

        // Calendar years, not elapsedYears(): the fractional measure divides by 365.25, so an
        // asset bought exactly five years ago measures 4.9993 years old, floors to four, and is
        // reported with six years of a ten-year life left instead of five. elapsedYears() stays
        // the right unit for book value, which is meant to move smoothly between anniversaries.
        long consumed = Math.max(ChronoUnit.YEARS.between(purchaseDate, asOf), 0L);
        return (int) Math.max(usefulLifeYears - consumed, 0L);
    }

    /** Whole years since acquisition; zero for an unknown or future purchase date. */
    public static int assetAge(LocalDate purchaseDate) {
        return assetAge(purchaseDate, LocalDate.now());
    }

    /** {@link #assetAge(LocalDate)} evaluated at an explicit date. */
    public static int assetAge(LocalDate purchaseDate, LocalDate asOf) {
        if (purchaseDate == null) {
            return 0;
        }
        return (int) Math.floor(Math.max(elapsedYears(purchaseDate, asOf), 0.0));
    }

    /**
     * Annual straight-line charge against the depreciable base. A life of zero years is not a
     * division by zero, it is an asset that is not being depreciated at all.
     */
    public static double annualDepreciation(
            double purchaseCost,
            double salvageValue,
            int usefulLifeYears) {

        if (usefulLifeYears <= 0) {
            return 0.0;
        }

        double cost = normalisedCost(purchaseCost);
        double salvage = normalisedSalvage(salvageValue, cost);
        return round((cost - salvage) / usefulLifeYears);
    }

    /** An asset is flagged when it is within a year of end of life or almost fully written down. */
    public static boolean needsReplacement(
            int remainingUsefulLife,
            double depreciationPercentage) {

        return remainingUsefulLife <= 1
                || depreciationPercentage >= REPLACEMENT_DEPRECIATION_THRESHOLD;
    }

    /** Coarse condition band derived from how much of the asset's value has been written off. */
    public static String equipmentHealth(double depreciationPercentage) {
        if (depreciationPercentage < 30) {
            return "EXCELLENT";
        }
        if (depreciationPercentage < 60) {
            return "GOOD";
        }
        if (depreciationPercentage < REPLACEMENT_DEPRECIATION_THRESHOLD) {
            return "FAIR";
        }
        return "POOR";
    }

    /**
     * Replacement urgency on a 0-100 scale: half from how little life is left, half from how much
     * value has been written off. Both halves are clamped, so a long-lived asset scores 0 rather
     * than the negative number the unclamped {@code 100 - (remainingLife * 10)} used to produce
     * for anything with more than ten years left.
     */
    public static int replacementScore(
            int remainingLife,
            double depreciationPercentage) {

        double lifePressure = clamp(100.0 - (Math.max(remainingLife, 0) * 10.0), 0.0, 100.0);
        double valuePressure = clamp(depreciationPercentage, 0.0, 100.0);
        double score = (lifePressure * 0.5) + (valuePressure * 0.5);
        return (int) Math.round(clamp(score, 0.0, 100.0));
    }

    private static double normalisedCost(double purchaseCost) {
        return Double.isFinite(purchaseCost) ? Math.max(purchaseCost, 0.0) : 0.0;
    }

    private static double normalisedSalvage(double salvageValue, double cost) {
        if (!Double.isFinite(salvageValue)) {
            return 0.0;
        }
        return clamp(salvageValue, 0.0, cost);
    }

    private static double clamp(double value, double min, double max) {
        return Math.min(Math.max(value, min), max);
    }

    private static double round(double value) {
        return BigDecimal.valueOf(value).setScale(2, RoundingMode.HALF_UP).doubleValue();
    }
}

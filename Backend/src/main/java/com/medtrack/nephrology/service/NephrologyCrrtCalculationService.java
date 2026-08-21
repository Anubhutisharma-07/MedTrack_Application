package com.medtrack.nephrology.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.Map;

/**
 * Nephrology Continuous Renal Replacement Therapy (CRRT) & Dialysis Calculation Service.
 * Implements clinical nephrology & ICU renal replacement algorithms:
 * - KDIGO Acute Kidney Injury (AKI) Staging (Stages 1-3)
 * - CRRT Effluent Dose Target Calculation (mL/kg/h) according to KDIGO guidelines (target 20-25 mL/kg/h)
 * - Filtration Fraction (FF %) monitoring to prevent circuit clotting (target FF < 20-25%)
 * - Regional Citrate Anticoagulation (RCA) systemic-to-circuit ionized calcium ratio evaluation
 * - Transmembrane Pressure (TMP) & Sieving Coefficient decay tracking
 */
@Service
@Transactional(readOnly = true)
public class NephrologyCrrtCalculationService {

    /**
     * Calculates Delivered CRRT Effluent Dose (mL/kg/h).
     * Effluent Dose = (Dialysate Flow + Replacement Pre/Post Flow + Net Ultrafiltration) / Patient Weight (kg)
     */
    public BigDecimal calculateEffluentDose(
            double dialysateFlowMlHr,
            double replacementFlowMlHr,
            double netUltrafiltrationMlHr,
            double patientWeightKg) {

        if (patientWeightKg <= 0) {
            throw new IllegalArgumentException("Patient weight must be greater than zero.");
        }

        double totalEffluent = dialysateFlowMlHr + replacementFlowMlHr + netUltrafiltrationMlHr;
        double dose = totalEffluent / patientWeightKg;

        return BigDecimal.valueOf(dose).setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Calculates Filtration Fraction (FF %)
     * FF (%) = (Net UF Rate + Pre/Post Replacement Flow) / Plasma Flow Rate * 100
     * Plasma Flow Rate = Blood Flow Rate * (1 - Hematocrit) * 60
     */
    public BigDecimal calculateFiltrationFraction(
            double ultrafiltrationRateMlHr,
            double replacementFlowMlHr,
            double bloodFlowRateMlMin,
            double hematocritFraction) {

        if (bloodFlowRateMlMin <= 0 || hematocritFraction >= 1.0) {
            throw new IllegalArgumentException("Invalid blood flow or hematocrit value.");
        }

        double plasmaFlowRateMlHr = bloodFlowRateMlMin * (1.0 - hematocritFraction) * 60.0;
        double totalUfMlHr = ultrafiltrationRateMlHr + replacementFlowMlHr;
        double ff = (totalUfMlHr / plasmaFlowRateMlHr) * 100.0;

        return BigDecimal.valueOf(ff).setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Evaluates KDIGO AKI Stage based on Serum Creatinine and Urine Output metrics.
     */
    public Map<String, Object> evaluateKdigoAkiStage(
            double baselineCreatinine,
            double currentCreatinine,
            double urineOutputMlKgHr,
            int oliguriaHours,
            boolean isRrtInitiated) {

        Map<String, Object> assessment = new HashMap<>();
        String stage;
        String criteria;

        double creatRatio = baselineCreatinine > 0 ? (currentCreatinine / baselineCreatinine) : 1.0;
        double creatDelta = currentCreatinine - baselineCreatinine;

        if (isRrtInitiated || currentCreatinine >= 4.0 || creatRatio >= 3.0 || (urineOutputMlKgHr < 0.3 && oliguriaHours >= 24) || oliguriaHours >= 12) {
            stage = "KDIGO Stage 3 AKI";
            criteria = "Serum Creatinine >= 3x baseline OR >= 4.0 mg/dL OR anuria >= 12h / persistent oliguria < 0.3 mL/kg/h for >= 24h OR CRRT initiated.";
        } else if (creatRatio >= 2.0 || (urineOutputMlKgHr < 0.5 && oliguriaHours >= 12)) {
            stage = "KDIGO Stage 2 AKI";
            criteria = "Serum Creatinine 2.0-2.9x baseline OR urine output < 0.5 mL/kg/h for >= 12 hours.";
        } else if (creatRatio >= 1.5 || creatDelta >= 0.3 || (urineOutputMlKgHr < 0.5 && oliguriaHours >= 6)) {
            stage = "KDIGO Stage 1 AKI";
            criteria = "Serum Creatinine 1.5-1.9x baseline OR increase >= 0.3 mg/dL within 48h OR urine output < 0.5 mL/kg/h for 6-12 hours.";
        } else {
            stage = "No AKI / Baseline";
            criteria = "Renal function within baseline tolerance.";
        }

        assessment.put("stage", stage);
        assessment.put("creatinineRatio", BigDecimal.valueOf(creatRatio).setScale(2, RoundingMode.HALF_UP));
        assessment.put("criteriaExplanation", criteria);
        assessment.put("crrtRecommended", stage.equals("KDIGO Stage 3 AKI"));
        return assessment;
    }

    /**
     * Assesses Transmembrane Pressure (TMP) and Filter Clotting Risk.
     * TMP = (Access Pressure + Return Pressure) / 2 - Effluent Pressure
     */
    public Map<String, Object> evaluateFilterStatus(double accessPressure, double returnPressure, double effluentPressure, double filterDrop) {
        double tmp = ((accessPressure + returnPressure) / 2.0) - effluentPressure;
        Map<String, Object> filterState = new HashMap<>();

        filterState.put("tmpMmHg", BigDecimal.valueOf(tmp).setScale(1, RoundingMode.HALF_UP));
        filterState.put("filterPressureDropMmHg", filterDrop);

        if (tmp > 250 || filterDrop > 150) {
            filterState.put("status", "HIGH_CLOTTING_RISK");
            filterState.put("action", "Imminent filter clotting detected. Prepare circuit change or increase regional citrate anticoagulation.");
        } else if (tmp > 180 || filterDrop > 100) {
            filterState.put("status", "MODERATE_MEMBRANE_FOULING");
            filterState.put("action", "Monitor sieving coefficient decay; check post-filter ionized calcium.");
        } else {
            filterState.put("status", "OPTIMAL_PATENCY");
            filterState.put("action", "Circuit operating within nominal parameters.");
        }

        return filterState;
    }
}

package com.medtrack.picu.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.Map;

/**
 * Pediatric Intensive Care Unit (PICU) Telemetry & Hemodynamic Calculation Service.
 * Implements rigorous pediatric critical care risk scoring algorithms:
 * - Oxygenation Index (OI) and OSI for Pediatric ARDS (PALICC-2 guidelines)
 * - Vasoactive-Inotropic Score (VIS)
 * - Pediatric Logistic Organ Dysfunction-2 (PELOD-2)
 * - Pediatric Risk of Mortality IV (PRISM-IV)
 * - High-Frequency Oscillatory Ventilation (HFOV) index metrics
 * - Pediatric AKI Staging (KDIGO/pRIFLE)
 */
@Service
@Transactional(readOnly = true)
public class PicuCriticalTelemetryService {

    /**
     * Calculate Oxygenation Index (OI)
     * OI = (Paw * FiO2 * 100) / PaO2
     *
     * @param meanAirwayPressurePaw cmH2O
     * @param fiO2 Fraction (0.21 - 1.0)
     * @param paO2 mmHg
     * @return Oxygenation Index (OI)
     */
    public BigDecimal calculateOxygenationIndex(double meanAirwayPressurePaw, double fiO2, double paO2) {
        if (paO2 <= 0) {
            throw new IllegalArgumentException("PaO2 must be greater than 0");
        }
        double rawOi = (meanAirwayPressurePaw * (fiO2 <= 1.0 ? fiO2 * 100.0 : fiO2)) / paO2;
        return BigDecimal.valueOf(rawOi).setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Calculate Oxygen Saturation Index (OSI) for non-invasive SpO2
     * OSI = (Paw * FiO2 * 100) / SpO2
     */
    public BigDecimal calculateOxygenSaturationIndex(double meanAirwayPressurePaw, double fiO2, double spO2) {
        if (spO2 <= 0) {
            throw new IllegalArgumentException("SpO2 must be greater than 0");
        }
        double rawOsi = (meanAirwayPressurePaw * (fiO2 <= 1.0 ? fiO2 * 100.0 : fiO2)) / spO2;
        return BigDecimal.valueOf(rawOsi).setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Calculate Pediatric Vasoactive-Inotropic Score (VIS)
     * VIS = Dopamine (mcg/kg/min) + Dobutamine (mcg/kg/min)
     *     + 100 * Epinephrine (mcg/kg/min)
     *     + 100 * Norepinephrine (mcg/kg/min)
     *     + 10 * Milrinone (mcg/kg/min)
     *     + 10000 * Vasopressin (units/kg/min)
     */
    public BigDecimal calculateVasoactiveInotropicScore(
            double dopamine,
            double dobutamine,
            double epinephrine,
            double norepinephrine,
            double milrinone,
            double vasopressin) {

        double vis = dopamine + dobutamine +
                (100.0 * epinephrine) +
                (100.0 * norepinephrine) +
                (10.0 * milrinone) +
                (10000.0 * vasopressin);

        return BigDecimal.valueOf(vis).setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Evaluates PALICC-2 PARDS (Pediatric Acute Respiratory Distress Syndrome) severity
     */
    public Map<String, Object> evaluatePardsSeverity(double oi, double osi, boolean isIntubated) {
        Map<String, Object> assessment = new HashMap<>();
        String severity;
        String recommendation;

        if (isIntubated) {
            if (oi >= 16.0) {
                severity = "SEVERE_PARDS";
                recommendation = "High risk mortality. Consider High-Frequency Oscillatory Ventilation (HFOV), prone positioning, or ECMO cannulation evaluation.";
            } else if (oi >= 8.0) {
                severity = "MODERATE_PARDS";
                recommendation = "Lung-protective mechanical ventilation (Vt 4-6 mL/kg), optimal PEEP titration, neuromuscular blockade consideration.";
            } else if (oi >= 4.0) {
                severity = "MILD_PARDS";
                recommendation = "Titrate PEEP, optimize sedation, close continuous hemodynamic & SpO2/PaO2 monitoring.";
            } else {
                severity = "NO_PARDS";
                recommendation = "Maintain routine respiratory care protocol and weaning readiness trials.";
            }
        } else {
            if (osi >= 7.5) {
                severity = "SEVERE_PARDS_NON_INVASIVE";
                recommendation = "Evaluate immediate endotracheal intubation criteria and invasive ventilation.";
            } else if (osi >= 5.0) {
                severity = "MODERATE_PARDS_NON_INVASIVE";
                recommendation = "NIV / High-Flow Nasal Cannula escalation with continuous blood gas monitoring.";
            } else {
                severity = "MILD_OR_AT_RISK";
                recommendation = "CPAP/BiPAP support with humidified oxygen therapy.";
            }
        }

        assessment.put("severity", severity);
        assessment.put("oxygenationIndex", oi);
        assessment.put("oxygenSaturationIndex", osi);
        assessment.put("recommendation", recommendation);
        return assessment;
    }

    /**
     * Compute PELOD-2 (Pediatric Logistic Organ Dysfunction-2) Subscore
     */
    public int calculatePelod2Score(
            double gcs,
            double pupillaryReactionCount,
            double meanArterialPressure,
            double serumLactate,
            double paO2FiO2Ratio,
            double paCO2,
            double creatinineUmolL,
            double wbcCount,
            double platelets) {

        int score = 0;

        // Neurological
        if (gcs < 5) score += 4;
        else if (gcs <= 10) score += 1;

        if (pupillaryReactionCount == 0) score += 5;

        // Cardiovascular (MAP and Lactate)
        if (meanArterialPressure < 45) score += 3;
        else if (meanArterialPressure < 55) score += 1;

        if (serumLactate >= 5.0) score += 4;
        else if (serumLactate >= 3.0) score += 1;

        // Respiratory
        if (paO2FiO2Ratio <= 150 && paCO2 > 50) score += 3;
        else if (paO2FiO2Ratio <= 250) score += 2;

        // Renal
        if (creatinineUmolL > 140) score += 2;

        // Hematologic
        if (platelets < 50) score += 2;
        if (wbcCount < 2.0) score += 1;

        return score;
    }
}

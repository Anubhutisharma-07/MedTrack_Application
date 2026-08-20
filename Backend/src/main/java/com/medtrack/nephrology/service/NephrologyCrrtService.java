package com.medtrack.nephrology.service;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Enterprise Nephrology CRRT & Extracorporeal Blood Purification Telemetry Service.
 * Provides transactional calculations for KDIGO AKI Staging, Weight-based Effluent Clearance Dosing,
 * Transmembrane Pressure (TMP) Filter Longevity Surveillance, and Regional Citrate Anticoagulation (RCA) Safety.
 */
public class NephrologyCrrtService {

    private final Map<String, CrrtSessionRecord> sessionStore = new ConcurrentHashMap<>();

    /**
     * Calculates Weight-Based Effluent Dose in mL/kg/hr.
     * KDIGO Recommendation: 20 - 25 mL/kg/hr prescribed to deliver >= 20 mL/kg/hr.
     */
    public double calculateEffluentDose(double dialysateRate, double replacementPre,
                                       double replacementPost, double netUltrafiltrationRate,
                                       double weightKg) {
        if (weightKg <= 0) {
            return 0.0;
        }
        double totalEffluentPerHour = dialysateRate + replacementPre + replacementPost + netUltrafiltrationRate;
        return Math.round((totalEffluentPerHour / weightKg) * 10.0) / 10.0;
    }

    /**
     * Calculates Transmembrane Pressure (TMP) in mmHg across hollow-fiber dialyzer membranes.
     * Formula: ((P_filter + P_venous) / 2) - P_effluent
     * Threshold: TMP > 250 mmHg indicates imminent membrane clotting and pore clogging.
     */
    public double calculateTransmembranePressure(double filterPressure, double venousPressure, double effluentPressure) {
        double meanBloodPathPressure = (filterPressure + venousPressure) / 2.0;
        return Math.max(0.0, Math.round((meanBloodPathPressure - effluentPressure) * 10.0) / 10.0);
    }

    /**
     * Calculates Filtration Fraction (FF) percentage.
     * Formula: (Replacement_Pre + Net_UFR) / (BloodFlow * 60 * (1 - Hematocrit)) * 100
     * Threshold: FF > 20-25% dramatically increases hemoconcentration and filter clotting.
     */
    public double calculateFiltrationFraction(double replacementPre, double netUfr,
                                             double bloodFlowQb, double hematocrit) {
        double plasmaFlowPerHour = bloodFlowQb * 60.0 * (1.0 - Math.min(0.60, Math.max(0.15, hematocrit)));
        if (plasmaFlowPerHour <= 0) {
            return 0.0;
        }
        return Math.round((((replacementPre + netUfr) / plasmaFlowPerHour) * 100.0) * 10.0) / 10.0;
    }

    /**
     * Classifies KDIGO Acute Kidney Injury (AKI) severity stage based on serum creatinine & urine output.
     */
    public String evaluateKdigoStage(double currentCreatinine, double baselineCreatinine, double urineOutputMlKgHr) {
        double ratio = baselineCreatinine > 0 ? (currentCreatinine / baselineCreatinine) : 1.0;
        if (ratio >= 3.0 || currentCreatinine >= 4.0 || urineOutputMlKgHr < 0.3) {
            return "KDIGO_STAGE_3_CRITICAL";
        } else if (ratio >= 2.0 || urineOutputMlKgHr < 0.5) {
            return "KDIGO_STAGE_2_MODERATE";
        } else if (ratio >= 1.5 || (currentCreatinine - baselineCreatinine) >= 0.3) {
            return "KDIGO_STAGE_1_EARLY";
        }
        return "NO_AKI_BASELINE";
    }

    /**
     * Evaluates Regional Citrate Anticoagulation (RCA) Safety & Citrate Accumulation Toxicity.
     * Citrate Toxicity: Total Calcium (mg/dL) / Systemic Ionized Calcium (mmol/L) ratio > 2.5.
     */
    public CitrateSafetyEvaluation evaluateCitrateSafety(double totalCalciumMgDl, double systemicIcaMmolL,
                                                        double postFilterIcaMmolL) {
        double ratio = systemicIcaMmolL > 0 ? (totalCalciumMgDl / systemicIcaMmolL) : 0.0;
        boolean toxicitySuspected = ratio >= 2.5;
        boolean circuitOptimal = postFilterIcaMmolL >= 0.25 && postFilterIcaMmolL <= 0.35;

        String safetyStatus = "SAFE_THERAPEUTIC";
        if (toxicitySuspected) {
            safetyStatus = "CITRATE_ACCUMULATION_WARNING";
        } else if (!circuitOptimal) {
            safetyStatus = postFilterIcaMmolL > 0.35 ? "SUBTHERAPEUTIC_CLOT_RISK" : "EXCESS_ANTICOAGULATION";
        }

        return new CitrateSafetyEvaluation(ratio, postFilterIcaMmolL, systemicIcaMmolL, safetyStatus, toxicitySuspected, Instant.now());
    }

    /**
     * Records a new active CRRT session telemetry state.
     */
    public CrrtSessionRecord recordCrrtSession(String patientId, String crrtMode, double weightKg,
                                             double bloodFlowQb, double dialysateQd, double repPre,
                                             double repPost, double netUfr, double pFilter,
                                             double pVenous, double pEffluent, double currentCr,
                                             double baselineCr, double systemicIca, double postFilterIca) {
        String sessionId = "CRRT-SES-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        double effluentDose = calculateEffluentDose(dialysateQd, repPre, repPost, netUfr, weightKg);
        double tmp = calculateTransmembranePressure(pFilter, pVenous, pEffluent);
        double ff = calculateFiltrationFraction(repPre, netUfr, bloodFlowQb, 0.30);
        String kdigo = evaluateKdigoStage(currentCr, baselineCr, 0.2);

        CrrtSessionRecord record = new CrrtSessionRecord(
                sessionId, patientId, crrtMode, bloodFlowQb, effluentDose, tmp, ff, kdigo, Instant.now()
        );

        sessionStore.put(sessionId, record);
        return record;
    }

    public CrrtSessionRecord getSession(String sessionId) {
        return sessionStore.get(sessionId);
    }

    /* ------------------------------------------------------------------ */
    /*  Inner Domain Models                                                */
    /* ------------------------------------------------------------------ */

    public static class CrrtSessionRecord {
        private final String sessionId;
        private final String patientId;
        private final String crrtMode;
        private final double bloodFlowQb;
        private final double effluentDose;
        private final double tmp;
        private final double filtrationFraction;
        private final String kdigoStage;
        private final Instant timestamp;

        public CrrtSessionRecord(String sessionId, String patientId, String crrtMode,
                                double bloodFlowQb, double effluentDose, double tmp,
                                double filtrationFraction, String kdigoStage, Instant timestamp) {
            this.sessionId = sessionId;
            this.patientId = patientId;
            this.crrtMode = crrtMode;
            this.bloodFlowQb = bloodFlowQb;
            this.effluentDose = effluentDose;
            this.tmp = tmp;
            this.filtrationFraction = filtrationFraction;
            this.kdigoStage = kdigoStage;
            this.timestamp = timestamp;
        }

        public String getSessionId() { return sessionId; }
        public String getPatientId() { return patientId; }
        public String getCrrtMode() { return crrtMode; }
        public double getBloodFlowQb() { return bloodFlowQb; }
        public double getEffluentDose() { return effluentDose; }
        public double getTmp() { return tmp; }
        public double getFiltrationFraction() { return filtrationFraction; }
        public String getKdigoStage() { return kdigoStage; }
        public Instant getTimestamp() { return timestamp; }
    }

    public static class CitrateSafetyEvaluation {
        private final double totalToIonizedCaRatio;
        private final double postFilterIca;
        private final double systemicIca;
        private final String safetyStatus;
        private final boolean toxicitySuspected;
        private final Instant evaluatedAt;

        public CitrateSafetyEvaluation(double totalToIonizedCaRatio, double postFilterIca,
                                      double systemicIca, String safetyStatus,
                                      boolean toxicitySuspected, Instant evaluatedAt) {
            this.totalToIonizedCaRatio = totalToIonizedCaRatio;
            this.postFilterIca = postFilterIca;
            this.systemicIca = systemicIca;
            this.safetyStatus = safetyStatus;
            this.toxicitySuspected = toxicitySuspected;
            this.evaluatedAt = evaluatedAt;
        }

        public double getTotalToIonizedCaRatio() { return totalToIonizedCaRatio; }
        public double getPostFilterIca() { return postFilterIca; }
        public double getSystemicIca() { return systemicIca; }
        public String getSafetyStatus() { return safetyStatus; }
        public boolean isToxicitySuspected() { return toxicitySuspected; }
        public Instant getEvaluatedAt() { return evaluatedAt; }
    }
}

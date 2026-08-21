package com.medtrack.cardiology.service;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Enterprise Cardiovascular Hemodynamics & ECMO Life-Support Telemetry Service.
 * Provides transactional calculation of clinical hemodynamic parameters (CPO, CI, SVR, PVR),
 * SCAI Cardiogenic Shock Staging, and Extracorporeal Membrane Oxygenation (ELSO) circuit diagnostics.
 */
public class CardiovascularHemodynamicsService {

    private final Map<String, HemodynamicTelemetryRecord> telemetryStore = new ConcurrentHashMap<>();

    /**
     * Calculates Cardiac Power Output (CPO) in Watts.
     * Formula: (MAP * CO) / 451
     * Threshold: CPO <= 0.6 W indicates high cardiogenic shock mortality (SHOCK Trial).
     */
    public double calculateCardiacPowerOutput(double map, double cardiacOutput) {
        if (map <= 0 || cardiacOutput <= 0) {
            return 0.0;
        }
        return Math.round(((map * cardiacOutput) / 451.0) * 100.0) / 100.0;
    }

    /**
     * Calculates Cardiac Index (CI) in L/min/m^2.
     * Formula: CO / BSA
     */
    public double calculateCardiacIndex(double cardiacOutput, double bsa) {
        if (bsa <= 0 || cardiacOutput <= 0) {
            return 0.0;
        }
        return Math.round((cardiacOutput / bsa) * 100.0) / 100.0;
    }

    /**
     * Calculates Systemic Vascular Resistance (SVR) in dynes*sec/cm^5.
     * Formula: ((MAP - CVP) * 80) / CO
     */
    public int calculateSystemicVascularResistance(double map, double cvp, double cardiacOutput) {
        if (cardiacOutput <= 0) {
            return 0;
        }
        return (int) Math.round(((map - cvp) * 80.0) / cardiacOutput);
    }

    /**
     * Calculates Pulmonary Vascular Resistance (PVR) in dynes*sec/cm^5.
     * Formula: ((mPAP - PCWP) * 80) / CO
     */
    public int calculatePulmonaryVascularResistance(double meanPap, double pcwp, double cardiacOutput) {
        if (cardiacOutput <= 0) {
            return 0;
        }
        return (int) Math.round(((meanPap - pcwp) * 80.0) / cardiacOutput);
    }

    /**
     * Calculates Transmembrane Oxygenator Pressure Drop (Delta-P) in mmHg.
     * Formula: P_pre - P_post
     * ELSO Standard: Delta-P > 35-50 mmHg indicates progressive circuit thrombosis / oxygenator failure.
     */
    public double calculateOxygenatorDeltaP(double preMembranePressure, double postMembranePressure) {
        return Math.max(0.0, preMembranePressure - postMembranePressure);
    }

    /**
     * Classifies Society for Cardiovascular Angiography and Interventions (SCAI) Shock Stage.
     * Stages: A (At Risk), B (Beginning), C (Classic), D (Deteriorating), E (Extremis).
     */
    public String evaluateScaiShockStage(double cpo, double lactate, double map, double svo2) {
        if (cpo < 0.4 || lactate > 5.0 || map < 55.0 || svo2 < 50.0) {
            return "STAGE_E_EXTREMIS";
        } else if (cpo < 0.6 || lactate > 3.0 || map < 65.0 || svo2 < 60.0) {
            return "STAGE_D_DETERIORATING";
        } else if (cpo < 0.8 || lactate > 2.0 || map < 70.0) {
            return "STAGE_C_CLASSIC";
        } else if (map < 80.0 || lactate > 1.5) {
            return "STAGE_B_BEGINNING";
        }
        return "STAGE_A_AT_RISK";
    }

    /**
     * Evaluates ELSO ECMO Circuit Thrombosis Risk score.
     */
    public CircuitRiskEvaluation evaluateEcmoCircuitThrombosisRisk(double deltaP, double actSeconds, double antiXa) {
        boolean swapRecommended = deltaP >= 45.0 || (deltaP >= 35.0 && actSeconds < 160.0);
        String riskLevel = "NORMAL";
        if (deltaP >= 45.0) {
            riskLevel = "CRITICAL_THROMBOSIS";
        } else if (deltaP >= 35.0 || actSeconds < 170.0 || antiXa < 0.3) {
            riskLevel = "WARNING_SUBTHERAPEUTIC";
        }

        return new CircuitRiskEvaluation(deltaP, actSeconds, antiXa, riskLevel, swapRecommended, Instant.now());
    }

    /**
     * Records a new hemodynamic and ECMO telemetry session.
     */
    public HemodynamicTelemetryRecord recordTelemetry(String patientId, String ecmoMode, int rpm,
                                                     double flowLpm, double map, double co,
                                                     double cvp, double meanPap, double pcwp,
                                                     double pPre, double pPost, double bsa,
                                                     double lactate, double svo2, double act) {
        String recordId = "HEMO-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        double cpo = calculateCardiacPowerOutput(map, co + (ecmoMode.equals("VA-ECMO") ? flowLpm : 0.0));
        double ci = calculateCardiacIndex(co + (ecmoMode.equals("VA-ECMO") ? flowLpm : 0.0), bsa);
        int svr = calculateSystemicVascularResistance(map, cvp, co + (ecmoMode.equals("VA-ECMO") ? flowLpm : 0.0));
        int pvr = calculatePulmonaryVascularResistance(meanPap, pcwp, co);
        double deltaP = calculateOxygenatorDeltaP(pPre, pPost);
        String scaiStage = evaluateScaiShockStage(cpo, lactate, map, svo2);

        HemodynamicTelemetryRecord record = new HemodynamicTelemetryRecord(
                recordId, patientId, ecmoMode, rpm, flowLpm, map, co, cpo, ci, svr, pvr, deltaP, scaiStage, Instant.now()
        );

        telemetryStore.put(recordId, record);
        return record;
    }

    public HemodynamicTelemetryRecord getRecord(String recordId) {
        return telemetryStore.get(recordId);
    }

    /* ------------------------------------------------------------------ */
    /*  Inner Domain Models                                                */
    /* ------------------------------------------------------------------ */

    public static class HemodynamicTelemetryRecord {
        private final String recordId;
        private final String patientId;
        private final String ecmoMode;
        private final int rpm;
        private final double flowLpm;
        private final double map;
        private final double cardiacOutput;
        private final double cardiacPowerOutput;
        private final double cardiacIndex;
        private final int systemicVascularResistance;
        private final int pulmonaryVascularResistance;
        private final double deltaP;
        private final String scaiStage;
        private final Instant timestamp;

        public HemodynamicTelemetryRecord(String recordId, String patientId, String ecmoMode, int rpm,
                                          double flowLpm, double map, double cardiacOutput, double cardiacPowerOutput,
                                          double cardiacIndex, int systemicVascularResistance, int pulmonaryVascularResistance,
                                          double deltaP, String scaiStage, Instant timestamp) {
            this.recordId = recordId;
            this.patientId = patientId;
            this.ecmoMode = ecmoMode;
            this.rpm = rpm;
            this.flowLpm = flowLpm;
            this.map = map;
            this.cardiacOutput = cardiacOutput;
            this.cardiacPowerOutput = cardiacPowerOutput;
            this.cardiacIndex = cardiacIndex;
            this.systemicVascularResistance = systemicVascularResistance;
            this.pulmonaryVascularResistance = pulmonaryVascularResistance;
            this.deltaP = deltaP;
            this.scaiStage = scaiStage;
            this.timestamp = timestamp;
        }

        public String getRecordId() { return recordId; }
        public String getPatientId() { return patientId; }
        public String getEcmoMode() { return ecmoMode; }
        public int getRpm() { return rpm; }
        public double getFlowLpm() { return flowLpm; }
        public double getMap() { return map; }
        public double getCardiacOutput() { return cardiacOutput; }
        public double getCardiacPowerOutput() { return cardiacPowerOutput; }
        public double getCardiacIndex() { return cardiacIndex; }
        public int getSystemicVascularResistance() { return systemicVascularResistance; }
        public int getPulmonaryVascularResistance() { return pulmonaryVascularResistance; }
        public double getDeltaP() { return deltaP; }
        public String getScaiStage() { return scaiStage; }
        public Instant getTimestamp() { return timestamp; }
    }

    public static class CircuitRiskEvaluation {
        private final double deltaP;
        private final double actSeconds;
        private final double antiXa;
        private final String riskLevel;
        private final boolean oxygenatorSwapRecommended;
        private final Instant evaluatedAt;

        public CircuitRiskEvaluation(double deltaP, double actSeconds, double antiXa,
                                     String riskLevel, boolean oxygenatorSwapRecommended, Instant evaluatedAt) {
            this.deltaP = deltaP;
            this.actSeconds = actSeconds;
            this.antiXa = antiXa;
            this.riskLevel = riskLevel;
            this.oxygenatorSwapRecommended = oxygenatorSwapRecommended;
            this.evaluatedAt = evaluatedAt;
        }

        public double getDeltaP() { return deltaP; }
        public double getActSeconds() { return actSeconds; }
        public double getAntiXa() { return antiXa; }
        public String getRiskLevel() { return riskLevel; }
        public boolean isOxygenatorSwapRecommended() { return oxygenatorSwapRecommended; }
        public Instant getEvaluatedAt() { return evaluatedAt; }
    }
}

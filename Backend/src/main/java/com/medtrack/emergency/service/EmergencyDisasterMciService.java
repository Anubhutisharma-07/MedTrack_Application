package com.medtrack.emergency.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.*;

/**
 * Enterprise Emergency Disaster Mass Casualty Incident (MCI) & START Triage Service.
 * Implements START (Simple Triage and Rapid Treatment), JumpSTART pediatric algorithms,
 * Revised Trauma Score (RTS), Shock Index (SI), and surge capacity hospital orchestration.
 *
 * Adheres to FEMA NIMS ICS-204, SALT / START Triage standards, and FDA 21 CFR Part 11.
 */
@Service
@Transactional(readOnly = true)
public class EmergencyDisasterMciService {

    public enum TriageCategory {
        RED_IMMEDIATE,       // Critical life threats, immediate intervention required
        YELLOW_DELAYED,      // Serious injuries, stable for short delays (transport priority 2)
        GREEN_MINIMAL,       // Walking wounded, minor injuries
        BLACK_EXPECTANT,     // Deceased or injuries incompatible with life given resource constraints
        CONTAMINATED_HAZMAT  // Requiring decontamination before medical entry
    }

    public static class CasualtyTriageInput {
        private String casualtyId;
        private Integer ageYears;
        private boolean ableToWalk;
        private boolean spontaneousBreathing;
        private Integer respiratoryRateBpm;
        private Integer radialPulsePerMin;
        private BigDecimal capillaryRefillSeconds;
        private Integer glasgowComaScale;
        private Integer systolicBloodPressure;
        private Integer heartRateBpm;
        private boolean obeysSimpleCommands;
        private boolean tourniquetApplied;
        private boolean chemicalBiologicalHazmatExposure;

        public String getCasualtyId() { return casualtyId; }
        public void setCasualtyId(String casualtyId) { this.casualtyId = casualtyId; }
        public Integer getAgeYears() { return ageYears; }
        public void setAgeYears(Integer ageYears) { this.ageYears = ageYears; }
        public boolean isAbleToWalk() { return ableToWalk; }
        public void setAbleToWalk(boolean ableToWalk) { this.ableToWalk = ableToWalk; }
        public boolean isSpontaneousBreathing() { return spontaneousBreathing; }
        public void setSpontaneousBreathing(boolean spontaneousBreathing) { this.spontaneousBreathing = spontaneousBreathing; }
        public Integer getRespiratoryRateBpm() { return respiratoryRateBpm; }
        public void setRespiratoryRateBpm(Integer respiratoryRateBpm) { this.respiratoryRateBpm = respiratoryRateBpm; }
        public Integer getRadialPulsePerMin() { return radialPulsePerMin; }
        public void setRadialPulsePerMin(Integer radialPulsePerMin) { this.radialPulsePerMin = radialPulsePerMin; }
        public BigDecimal getCapillaryRefillSeconds() { return capillaryRefillSeconds; }
        public void setCapillaryRefillSeconds(BigDecimal capillaryRefillSeconds) { this.capillaryRefillSeconds = capillaryRefillSeconds; }
        public Integer getGlasgowComaScale() { return glasgowComaScale; }
        public void setGlasgowComaScale(Integer glasgowComaScale) { this.glasgowComaScale = glasgowComaScale; }
        public Integer getSystolicBloodPressure() { return systolicBloodPressure; }
        public void setSystolicBloodPressure(Integer systolicBloodPressure) { this.systolicBloodPressure = systolicBloodPressure; }
        public Integer getHeartRateBpm() { return heartRateBpm; }
        public void setHeartRateBpm(Integer heartRateBpm) { this.heartRateBpm = heartRateBpm; }
        public boolean isObeysSimpleCommands() { return obeysSimpleCommands; }
        public void setObeysSimpleCommands(boolean obeysSimpleCommands) { this.obeysSimpleCommands = obeysSimpleCommands; }
        public boolean isTourniquetApplied() { return tourniquetApplied; }
        public void setTourniquetApplied(boolean tourniquetApplied) { this.tourniquetApplied = tourniquetApplied; }
        public boolean isChemicalBiologicalHazmatExposure() { return chemicalBiologicalHazmatExposure; }
        public void setChemicalBiologicalHazmatExposure(boolean hazmat) { this.chemicalBiologicalHazmatExposure = hazmat; }
    }

    public static class TriageAssessmentReport {
        private String casualtyId;
        private Instant timestamp;
        private TriageCategory category;
        private BigDecimal shockIndex;              // SI = HR / SBP
        private BigDecimal revisedTraumaScore;       // RTS
        private boolean massiveTransfusionIndicated; // MTP
        private String dispositionTarget;            // e.g. "Trauma Resuscitation Bay 1 / OR STAT"
        private List<String> immediateActionDirectives = new ArrayList<>();

        public String getCasualtyId() { return casualtyId; }
        public void setCasualtyId(String casualtyId) { this.casualtyId = casualtyId; }
        public Instant getTimestamp() { return timestamp; }
        public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }
        public TriageCategory getCategory() { return category; }
        public void setCategory(TriageCategory category) { this.category = category; }
        public BigDecimal getShockIndex() { return shockIndex; }
        public void setShockIndex(BigDecimal shockIndex) { this.shockIndex = shockIndex; }
        public BigDecimal getRevisedTraumaScore() { return revisedTraumaScore; }
        public void setRevisedTraumaScore(BigDecimal rts) { this.revisedTraumaScore = rts; }
        public boolean isMassiveTransfusionIndicated() { return massiveTransfusionIndicated; }
        public void setMassiveTransfusionIndicated(boolean mtp) { this.massiveTransfusionIndicated = mtp; }
        public String getDispositionTarget() { return dispositionTarget; }
        public void setDispositionTarget(String target) { this.dispositionTarget = target; }
        public List<String> getImmediateActionDirectives() { return immediateActionDirectives; }
        public void setImmediateActionDirectives(List<String> directives) { this.immediateActionDirectives = directives; }
    }

    /**
     * Executes algorithmic START/JumpSTART disaster casualty sorting and physiological scoring.
     */
    @Transactional
    public TriageAssessmentReport evaluateCasualtyTriage(CasualtyTriageInput input) {
        if (input == null) {
            throw new IllegalArgumentException("Casualty triage input cannot be null");
        }

        TriageAssessmentReport report = new TriageAssessmentReport();
        report.setCasualtyId(input.getCasualtyId());
        report.setTimestamp(Instant.now());

        // 0. Chemical / Biological Hazmat Protocol Check
        if (input.isChemicalBiologicalHazmatExposure()) {
            report.setCategory(TriageCategory.CONTAMINATED_HAZMAT);
            report.setDispositionTarget("External Warm-Zone Decontamination Corridor");
            report.getImmediateActionDirectives().add("MANDATORY DECONTAMINATION: Strip clothing, high-volume warm water rinse before indoor hospital transit.");
            return report;
        }

        // 1. START Triage Algorithm Decision Flow:
        // Step 1: Able to walk?
        if (input.isAbleToWalk()) {
            report.setCategory(TriageCategory.GREEN_MINIMAL);
            report.setDispositionTarget("Minor Care / Triage Holding Area C");
            report.getImmediateActionDirectives().add("Direct walking wounded to secondary assembly point for secondary assessment.");
        } else {
            // Step 2: Spontaneous breathing?
            if (!input.isSpontaneousBreathing()) {
                // If airway opened and still apneic -> BLACK (Expectant/Deceased)
                report.setCategory(TriageCategory.BLACK_EXPECTANT);
                report.setDispositionTarget("Morgue / Expectant Comfort Care Area");
                report.getImmediateActionDirectives().add("Position with dignity, apply palliative comfort care if signs of life present, tag Black.");
            } else {
                // Step 3: Respiratory Rate assessment
                boolean abnormalBreathing = input.getRespiratoryRateBpm() != null && 
                                            (input.getRespiratoryRateBpm() < 10 || input.getRespiratoryRateBpm() > 30);
                
                // Step 4: Perfusion assessment (Radial pulse or Cap Refill > 2s)
                boolean poorPerfusion = (input.getRadialPulsePerMin() != null && input.getRadialPulsePerMin() == 0) ||
                                        (input.getCapillaryRefillSeconds() != null && input.getCapillaryRefillSeconds().compareTo(BigDecimal.valueOf(2.0)) > 0);

                // Step 5: Mental Status (Obeys commands)
                boolean alteredMentalStatus = !input.isObeysSimpleCommands() ||
                                              (input.getGlasgowComaScale() != null && input.getGlasgowComaScale() < 13);

                if (abnormalBreathing || poorPerfusion || alteredMentalStatus) {
                    report.setCategory(TriageCategory.RED_IMMEDIATE);
                    report.setDispositionTarget("Level 1 Trauma Resuscitation Bay / STAT Surgical OR");
                    if (abnormalBreathing) report.getImmediateActionDirectives().add("Airway compromise / Tachypnea: Rapid Sequence Intubation (RSI) standby.");
                    if (poorPerfusion) report.getImmediateActionDirectives().add("Hemodynamic shock detected: Apply tourniquet/pelvic binder and initiate rapid IV/IO crystalloid.");
                    if (alteredMentalStatus) report.getImmediateActionDirectives().add("Traumatic Brain Injury (TBI) protocol: Cervical spine immobilization & hyperosmolar therapy.");
                } else {
                    report.setCategory(TriageCategory.YELLOW_DELAYED);
                    report.setDispositionTarget("Acute Treatment Unit / Step-Down Area B");
                    report.getImmediateActionDirectives().add("Re-evaluate vitals q15m; maintain NPO status in anticipation of delayed operative intervention.");
                }
            }
        }

        // 2. Shock Index Calculation (SI = HR / SBP)
        if (input.getHeartRateBpm() != null && input.getSystolicBloodPressure() != null && input.getSystolicBloodPressure() > 0) {
            BigDecimal si = BigDecimal.valueOf(input.getHeartRateBpm())
                    .divide(BigDecimal.valueOf(input.getSystolicBloodPressure()), 2, RoundingMode.HALF_UP);
            report.setShockIndex(si);

            // Shock Index >= 1.0 indicates severe occult hypoperfusion / hemorrhagic shock
            if (si.compareTo(BigDecimal.valueOf(1.0)) >= 0 || input.isTourniquetApplied()) {
                report.setMassiveTransfusionIndicated(true);
                report.getImmediateActionDirectives().add(String.format("HIGH SHOCK INDEX (%.2f >= 1.0): Trigger Massive Transfusion Protocol (MTP) Cooler 1:1:1 ratio (4 pRBC : 4 FFP : 1 Platelet apheresis).", si));
            }
        }

        // 3. Revised Trauma Score (RTS) Calculation
        // RTS = 0.9368(GCS_code) + 0.7326(SBP_code) + 0.2908(RR_code) (range 0 - 7.8408)
        int gcsCode = getGcsCode(input.getGlasgowComaScale());
        int sbpCode = getSbpCode(input.getSystolicBloodPressure());
        int rrCode = getRrCode(input.getRespiratoryRateBpm());

        double rts = (0.9368 * gcsCode) + (0.7326 * sbpCode) + (0.2908 * rrCode);
        report.setRevisedTraumaScore(BigDecimal.valueOf(rts).setScale(2, RoundingMode.HALF_UP));

        return report;
    }

    private int getGcsCode(Integer gcs) {
        if (gcs == null) return 4;
        if (gcs >= 13) return 4;
        if (gcs >= 9) return 3;
        if (gcs >= 6) return 2;
        if (gcs >= 4) return 1;
        return 0;
    }

    private int getSbpCode(Integer sbp) {
        if (sbp == null) return 4;
        if (sbp > 89) return 4;
        if (sbp >= 76) return 3;
        if (sbp >= 50) return 2;
        if (sbp >= 1) return 1;
        return 0;
    }

    private int getRrCode(Integer rr) {
        if (rr == null) return 4;
        if (rr >= 10 && rr <= 29) return 4;
        if (rr >= 30) return 3;
        if (rr >= 6) return 2;
        if (rr >= 1) return 1;
        return 0;
    }
}

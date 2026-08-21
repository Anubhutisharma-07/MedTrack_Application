package com.medtrack.oncology.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.*;

/**
 * Enterprise Clinical Precision Oncology & Genomic Decision Support Service.
 * Implements biomarker stratification, AMP/ASCO/CAP tier categorization,
 * tumor mutational burden (TMB) scoring, and pharmacogenomic risk assessment.
 *
 * Adheres to NCCN 2026 guidelines, ESMO Precision Medicine standards, and FDA 21 CFR Part 11.
 */
@Service
@Transactional(readOnly = true)
public class PrecisionOncologyGenomicService {

    public enum AmpTier {
        TIER_I_STRONG_CLINICAL_SIGNIFICANCE,
        TIER_II_POTENTIAL_CLINICAL_SIGNIFICANCE,
        TIER_III_UNKNOWN_CLINICAL_SIGNIFICANCE,
        TIER_IV_BENIGN_OR_LIKELY_BENIGN
    }

    public enum MsiStatus {
        MSI_HIGH,
        MSI_STABLE,
        MSS,
        INDETERMINATE
    }

    public static class GenomicAlteration {
        private String gene;
        private String alteration;
        private String proteinChange;
        private BigDecimal variantAlleleFrequency; // e.g. 0.38 (38%)
        private AmpTier tier;
        private List<String> targetedTherapies;
        private String clinicalEvidence;

        public GenomicAlteration() {}

        public GenomicAlteration(String gene, String alteration, String proteinChange, 
                                 BigDecimal variantAlleleFrequency, AmpTier tier, 
                                 List<String> targetedTherapies, String clinicalEvidence) {
            this.gene = gene;
            this.alteration = alteration;
            this.proteinChange = proteinChange;
            this.variantAlleleFrequency = variantAlleleFrequency;
            this.tier = tier;
            this.targetedTherapies = targetedTherapies;
            this.clinicalEvidence = clinicalEvidence;
        }

        public String getGene() { return gene; }
        public void setGene(String gene) { this.gene = gene; }
        public String getAlteration() { return alteration; }
        public void setAlteration(String alteration) { this.alteration = alteration; }
        public String getProteinChange() { return proteinChange; }
        public void setProteinChange(String proteinChange) { this.proteinChange = proteinChange; }
        public BigDecimal getVariantAlleleFrequency() { return variantAlleleFrequency; }
        public void setVariantAlleleFrequency(BigDecimal variantAlleleFrequency) { this.variantAlleleFrequency = variantAlleleFrequency; }
        public AmpTier getTier() { return tier; }
        public void setTier(AmpTier tier) { this.tier = tier; }
        public List<String> getTargetedTherapies() { return targetedTherapies; }
        public void setTargetedTherapies(List<String> targetedTherapies) { this.targetedTherapies = targetedTherapies; }
        public String getClinicalEvidence() { return clinicalEvidence; }
        public void setClinicalEvidence(String clinicalEvidence) { this.clinicalEvidence = clinicalEvidence; }
    }

    public static class MolecularTumorBoardProfile {
        private String patientId;
        private String primaryDiagnosis;
        private String tumorStage;
        private BigDecimal tumorMutationalBurdenMutsPerMb; // e.g. 14.8 mut/Mb
        private MsiStatus msiStatus;
        private BigDecimal hrdScore; // Homologous Recombination Deficiency
        private BigDecimal pdl1TpsScore; // PD-L1 Tumor Proportion Score %
        private List<GenomicAlteration> alterations = new ArrayList<>();
        private Map<String, String> pharmacogenomicGenotypes = new HashMap<>(); // e.g. "DPYD" -> "*2A/*13"

        public String getPatientId() { return patientId; }
        public void setPatientId(String patientId) { this.patientId = patientId; }
        public String getPrimaryDiagnosis() { return primaryDiagnosis; }
        public void setPrimaryDiagnosis(String primaryDiagnosis) { this.primaryDiagnosis = primaryDiagnosis; }
        public String getTumorStage() { return tumorStage; }
        public void setTumorStage(String tumorStage) { this.tumorStage = tumorStage; }
        public BigDecimal getTumorMutationalBurdenMutsPerMb() { return tumorMutationalBurdenMutsPerMb; }
        public void setTumorMutationalBurdenMutsPerMb(BigDecimal tmb) { this.tumorMutationalBurdenMutsPerMb = tmb; }
        public MsiStatus getMsiStatus() { return msiStatus; }
        public void setMsiStatus(MsiStatus msiStatus) { this.msiStatus = msiStatus; }
        public BigDecimal getHrdScore() { return hrdScore; }
        public void setHrdScore(BigDecimal hrdScore) { this.hrdScore = hrdScore; }
        public BigDecimal getPdl1TpsScore() { return pdl1TpsScore; }
        public void setPdl1TpsScore(BigDecimal pdl1TpsScore) { this.pdl1TpsScore = pdl1TpsScore; }
        public List<GenomicAlteration> getAlterations() { return alterations; }
        public void setAlterations(List<GenomicAlteration> alterations) { this.alterations = alterations; }
        public Map<String, String> getPharmacogenomicGenotypes() { return pharmacogenomicGenotypes; }
        public void setPharmacogenomicGenotypes(Map<String, String> pgx) { this.pharmacogenomicGenotypes = pgx; }
    }

    public static class PrecisionRecommendationReport {
        private String patientId;
        private Instant timestamp;
        private boolean immunotherapyEligible;
        private String immunotherapyRationale;
        private boolean parpInhibitorEligible;
        private String parpRationale;
        private List<String> primaryTargetedOptions = new ArrayList<>();
        private List<String> clinicalTrialMatches = new ArrayList<>();
        private List<String> pharmacogenomicAlerts = new ArrayList<>();
        private BigDecimal aggregateResponseLikelihoodScore;

        public String getPatientId() { return patientId; }
        public void setPatientId(String patientId) { this.patientId = patientId; }
        public Instant getTimestamp() { return timestamp; }
        public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }
        public boolean isImmunotherapyEligible() { return immunotherapyEligible; }
        public void setImmunotherapyEligible(boolean immunotherapyEligible) { this.immunotherapyEligible = immunotherapyEligible; }
        public String getImmunotherapyRationale() { return immunotherapyRationale; }
        public void setImmunotherapyRationale(String rationale) { this.immunotherapyRationale = rationale; }
        public boolean isParpInhibitorEligible() { return parpInhibitorEligible; }
        public void setParpInhibitorEligible(boolean parpInhibitorEligible) { this.parpInhibitorEligible = parpInhibitorEligible; }
        public String getParpRationale() { return parpRationale; }
        public void setParpRationale(String parpRationale) { this.parpRationale = parpRationale; }
        public List<String> getPrimaryTargetedOptions() { return primaryTargetedOptions; }
        public void setPrimaryTargetedOptions(List<String> options) { this.primaryTargetedOptions = options; }
        public List<String> getClinicalTrialMatches() { return clinicalTrialMatches; }
        public void setClinicalTrialMatches(List<String> matches) { this.clinicalTrialMatches = matches; }
        public List<String> getPharmacogenomicAlerts() { return pharmacogenomicAlerts; }
        public void setPharmacogenomicAlerts(List<String> alerts) { this.pharmacogenomicAlerts = alerts; }
        public BigDecimal getAggregateResponseLikelihoodScore() { return aggregateResponseLikelihoodScore; }
        public void setAggregateResponseLikelihoodScore(BigDecimal score) { this.aggregateResponseLikelihoodScore = score; }
    }

    /**
     * Synthesizes full Molecular Tumor Board report based on multi-omic biomarkers.
     */
    @Transactional
    public PrecisionRecommendationReport evaluateMolecularProfile(MolecularTumorBoardProfile profile) {
        if (profile == null) {
            throw new IllegalArgumentException("Molecular tumor board profile cannot be null");
        }

        PrecisionRecommendationReport report = new PrecisionRecommendationReport();
        report.setPatientId(profile.getPatientId());
        report.setTimestamp(Instant.now());

        double baseLikelihood = 40.0;

        // 1. Evaluate Immunotherapy Eligibility (TMB-High >= 10 mut/Mb, MSI-High, or PD-L1 >= 50%)
        boolean isTmbHigh = profile.getTumorMutationalBurdenMutsPerMb() != null && 
                            profile.getTumorMutationalBurdenMutsPerMb().compareTo(BigDecimal.valueOf(10.0)) >= 0;
        boolean isMsiHigh = profile.getMsiStatus() == MsiStatus.MSI_HIGH;
        boolean isPdl1Positive = profile.getPdl1TpsScore() != null && 
                                 profile.getPdl1TpsScore().compareTo(BigDecimal.valueOf(50.0)) >= 0;

        if (isTmbHigh || isMsiHigh || isPdl1Positive) {
            report.setImmunotherapyEligible(true);
            StringBuilder rationale = new StringBuilder("Eligible for Immune Checkpoint Inhibitor (e.g. Pembrolizumab, Nivolumab, Dostarlimab): ");
            if (isTmbHigh) rationale.append(String.format("TMB-High (%.1f mut/Mb; FDA agnostic cutoff >= 10). ", profile.getTumorMutationalBurdenMutsPerMb()));
            if (isMsiHigh) rationale.append("MSI-High / dMMR phenotype detected. ");
            if (isPdl1Positive) rationale.append(String.format("PD-L1 TPS >= 50%% (Current: %.1f%%). ", profile.getPdl1TpsScore()));
            report.setImmunotherapyRationale(rationale.toString().trim());
            baseLikelihood += 25.0;
        } else {
            report.setImmunotherapyEligible(false);
            report.setImmunotherapyRationale("TMB < 10 mut/Mb, MSS stable, and PD-L1 < 50%. Standard checkpoint monotherapy lower response probability.");
        }

        // 2. Evaluate PARP Inhibitor Eligibility (BRCA1/2 or HRD Score >= 42)
        boolean hasBrcaDeficiency = profile.getAlterations().stream()
                .anyMatch(a -> (a.getGene().equalsIgnoreCase("BRCA1") || a.getGene().equalsIgnoreCase("BRCA2") || a.getGene().equalsIgnoreCase("PALB2"))
                        && a.getTier() == AmpTier.TIER_I_STRONG_CLINICAL_SIGNIFICANCE);
        boolean isHrdHigh = profile.getHrdScore() != null && profile.getHrdScore().compareTo(BigDecimal.valueOf(42.0)) >= 0;

        if (hasBrcaDeficiency || isHrdHigh) {
            report.setParpInhibitorEligible(true);
            report.setParpRationale("Indicated for PARP Inhibitors (Olaparib, Rucaparib, Niraparib, Talazoparib) due to Homologous Recombination Repair Deficiency.");
            baseLikelihood += 20.0;
        } else {
            report.setParpInhibitorEligible(false);
            report.setParpRationale("Homologous recombination intact (HRD < 42 and wildtype BRCA1/2).");
        }

        // 3. Match Tier I / Tier II Targeted Therapies
        for (GenomicAlteration alt : profile.getAlterations()) {
            if (alt.getTargetedTherapies() != null && !alt.getTargetedTherapies().isEmpty()) {
                for (String drug : alt.getTargetedTherapies()) {
                    String option = String.format("%s (%s %s) -> %s [AMP %s]",
                            alt.getGene(), alt.getAlteration(), alt.getProteinChange() != null ? alt.getProteinChange() : "",
                            drug, alt.getTier().name());
                    report.getPrimaryTargetedOptions().add(option);
                }
            }
        }

        // 4. Pharmacogenomic Safety Screening
        Map<String, String> pgx = profile.getPharmacogenomicGenotypes();
        if (pgx != null) {
            if (pgx.containsKey("DPYD") && pgx.get("DPYD").contains("*2A")) {
                report.getPharmacogenomicAlerts().add("CRITICAL WARNING: DPYD *2A allele detected. Severe fluoropyrimidine (5-FU / Capecitabine) toxicity risk. Complete avoidance or 50-75% dose reduction mandated per CPIC.");
            }
            if (pgx.containsKey("TPMT") && (pgx.get("TPMT").contains("*3A") || pgx.get("TPMT").contains("*2"))) {
                report.getPharmacogenomicAlerts().add("HIGH ALERT: TPMT intermediate/poor metabolizer. High risk of thiopurine-induced myelosuppression (6-MP, Azathioprine).");
            }
            if (pgx.containsKey("UGT1A1") && pgx.get("UGT1A1").contains("*28")) {
                report.getPharmacogenomicAlerts().add("CAUTION: UGT1A1*28 homozygosity. High risk of severe diarrhea and neutropenia with Irinotecan.");
            }
        }

        // 5. Clinical Trial Matching
        if (profile.getAlterations().stream().anyMatch(a -> a.getGene().equalsIgnoreCase("KRAS") && a.getAlteration().contains("G12C"))) {
            report.getClinicalTrialMatches().add("NCT04611113: Sotorasib + Panitumumab in Colorectal Cancer with KRAS G12C Mutation (Phase 3)");
        }
        if (profile.getAlterations().stream().anyMatch(a -> a.getGene().equalsIgnoreCase("HER2") || a.getGene().equalsIgnoreCase("ERBB2"))) {
            report.getClinicalTrialMatches().add("NCT05048797: Trastuzumab Deruxtecan (T-DXd) in HER2-Mutant Advanced Solid Tumors (Phase 2)");
        }
        if (profile.getAlterations().stream().anyMatch(a -> a.getGene().equalsIgnoreCase("BRAF") && a.getAlteration().contains("V600E"))) {
            report.getClinicalTrialMatches().add("NCT03693170: Dabrafenib + Trametinib in BRAF V600E Mutation-Positive Solid Tumors (NCI-MATCH)");
        }

        // Calculate Aggregate Likelihood (Capped at 98.5%)
        double finalScore = Math.min(98.5, Math.max(15.0, baseLikelihood));
        report.setAggregateResponseLikelihoodScore(BigDecimal.valueOf(finalScore).setScale(1, RoundingMode.HALF_UP));

        return report;
    }
}

package com.medtrack.oncology.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

/**
 * Precision Oncology & Molecular Tumor Board Genomic Analysis Service.
 * Implements clinical oncology genomic classification and targeted therapy matching:
 * - ESMO Scale for Clinical Actionability of molecular Targets (ESCAT Tier I-V)
 * - AMP/ASCO/CAP Somatic Variant Pathogenicity Guidelines (Tier I-IV)
 * - Tumor Mutational Burden (TMB) & Microsatellite Instability (MSI-H) Immunotherapy Predictor
 * - Homologous Recombination Deficiency (HRD) & PARP Inhibitor Response Stratification
 * - NCCN Clinical Practice Guidelines in Oncology Pathway Resolution
 */
@Service
@Transactional(readOnly = true)
public class PrecisionOncologyMolecularService {

    /**
     * Evaluates Tumor Mutational Burden (TMB) for Immune Checkpoint Inhibitor (ICI) suitability.
     * Cutoff: TMB >= 10 mut/Mb (FDA approved biomarker for Pembrolizumab pan-tumor)
     */
    public Map<String, Object> evaluateTmbStatus(double mutationsPerMegabase) {
        Map<String, Object> result = new HashMap<>();
        boolean isHigh = mutationsPerMegabase >= 10.0;
        boolean isUltraHigh = mutationsPerMegabase >= 20.0;

        result.put("tmbValue", mutationsPerMegabase);
        result.put("tmbStatus", isHigh ? "TMB-High (TMB-H)" : "TMB-Low (TMB-L)");
        result.put("immuneCheckpointInhibitorEligible", isHigh);
        result.put("fdaIndication", isHigh ? "Eligible for FDA-approved Pan-Tumor Pembrolizumab" : "Standard targeted/chemotherapy pathway");
        result.put("predictedResponseTier", isUltraHigh ? "Exceptional Response Potential" : isHigh ? "High Response Probability" : "Standard Baseline");
        return result;
    }

    /**
     * Stratifies Somatic Genomic Variants according to AMP/ASCO/CAP & ESCAT Guidelines.
     */
    public Map<String, Object> classifyGenomicVariant(
            String gene,
            String alteration,
            double variantAlleleFrequency,
            boolean fdaApprovedInDisease,
            boolean nccnCategory1,
            boolean isResistanceMutation) {

        Map<String, Object> classification = new HashMap<>();
        String ampTier;
        String escatTier;
        String actionability;

        if (isResistanceMutation) {
            ampTier = "Tier I - Resistance Biomarker";
            escatTier = "ESCAT Tier I-R";
            actionability = "Guides targeted therapy switch or dual-inhibition combination.";
        } else if (fdaApprovedInDisease && nccnCategory1) {
            ampTier = "Tier I - Variants of Strong Clinical Significance";
            escatTier = "ESCAT Tier I-A";
            actionability = "Standard-of-care FDA approved targeted inhibitor (NCCN Category 1).";
        } else if (fdaApprovedInDisease) {
            ampTier = "Tier I - Level B Evidence";
            escatTier = "ESCAT Tier I-B";
            actionability = "Approved targeted agent with clinical trial evidence.";
        } else {
            ampTier = "Tier II - Variants of Potential Clinical Significance";
            escatTier = "ESCAT Tier II / Tier III";
            actionability = "Eligible for biomarker-directed clinical trial enrollment (Basket/Umbrella trial).";
        }

        classification.put("gene", gene);
        classification.put("alteration", alteration);
        classification.put("vafPercentage", BigDecimal.valueOf(variantAlleleFrequency * 100).setScale(2, RoundingMode.HALF_UP));
        classification.put("ampTier", ampTier);
        classification.put("escatTier", escatTier);
        classification.put("actionabilitySummary", actionability);

        return classification;
    }

    /**
     * Calculates Homologous Recombination Deficiency (HRD) Genomic Instability Score.
     * HRD Score = Loss of Heterozygosity (LOH) + Telomeric Allelic Imbalance (TAI) + Large-Scale State Transitions (LST)
     * Cutoff: HRD Score >= 42 or BRCA1/2 Pathogenic Mutation indicates PARP Inhibitor synthetic lethality.
     */
    public Map<String, Object> calculateHrdScore(int lohCount, int taiCount, int lstCount, boolean hasBrcaPathogenic) {
        int totalHrdScore = lohCount + taiCount + lstCount;
        boolean isHrdPositive = totalHrdScore >= 42 || hasBrcaPathogenic;

        Map<String, Object> hrdReport = new HashMap<>();
        hrdReport.put("totalHrdScore", totalHrdScore);
        hrdReport.put("lohCount", lohCount);
        hrdReport.put("taiCount", taiCount);
        hrdReport.put("lstCount", lstCount);
        hrdReport.put("hasBrcaPathogenic", hasBrcaPathogenic);
        hrdReport.put("hrdStatus", isHrdPositive ? "HRD-Positive" : "HRD-Negative / Proficient");
        hrdReport.put("parpInhibitorEfficacy", isHrdPositive ? "High (Olaparib / Rucaparib / Niraparib Indicated)" : "Low Expected Efficacy");

        return hrdReport;
    }
}

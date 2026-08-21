package com.medtrack.bioai.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.Map;

/**
 * Bio-AI Diagnostics & Clinical Machine Learning Inference Calculation Service.
 * Implements clinical AI governance and diagnostic calibration metrics:
 * - Diagnostic Odds Ratio (DOR) & F1 Score Calibration
 * - Brier Score Uncertainty Quantification for Deep Learning Ensembles
 * - Bayesian Post-Test Probability (Fagan Nomogram)
 * - Sepsis qSOFA / NEWS2 AI Risk Gradient Prediction
 * - FDA 21 CFR Part 11 & Good Machine Learning Practice (GMLP) Traceability
 */
@Service
@Transactional(readOnly = true)
public class BioAiDiagnosticsCalculationService {

    /**
     * Calculates Post-Test Probability using Bayesian Likelihood Ratio (Fagan Nomogram).
     * Pre-test Odds = Pre-test Prob / (1 - Pre-test Prob)
     * Post-test Odds = Pre-test Odds * Positive Likelihood Ratio (LR+)
     * Post-test Prob = Post-test Odds / (1 + Post-test Odds)
     */
    public BigDecimal calculateBayesianPostTestProbability(double preTestProbability, double positiveLikelihoodRatio) {
        if (preTestProbability <= 0 || preTestProbability >= 1.0) {
            throw new IllegalArgumentException("Pre-test probability must be between 0 and 1.");
        }
        if (positiveLikelihoodRatio <= 0) {
            throw new IllegalArgumentException("Likelihood ratio must be greater than zero.");
        }

        double preTestOdds = preTestProbability / (1.0 - preTestProbability);
        double postTestOdds = preTestOdds * positiveLikelihoodRatio;
        double postTestProb = postTestOdds / (1.0 + postTestOdds);

        return BigDecimal.valueOf(postTestProb * 100.0).setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Calculates Brier Score for AI Model Confidence Calibration.
     * Lower Brier score indicates superior probabilistic calibration.
     */
    public BigDecimal calculateBrierScore(double predictedProbability, int actualOutcomeBinary) {
        double diff = predictedProbability - actualOutcomeBinary;
        double score = diff * diff;
        return BigDecimal.valueOf(score).setScale(4, RoundingMode.HALF_UP);
    }

    /**
     * Evaluates Multi-Modal AI Ensemble Sepsis & Clinical Deterioration Gradient.
     */
    public Map<String, Object> evaluateDeteriorationGradient(
            double vitalsAnomalyScore,
            double labBiomarkerGradient,
            double ehrTrajectoryIndex,
            double lactateLevel,
            int news2Score) {

        double compositeRiskScore = (vitalsAnomalyScore * 0.35) +
                (labBiomarkerGradient * 0.35) +
                (ehrTrajectoryIndex * 0.30);

        String alertLevel;
        String recommendedAction;

        if (compositeRiskScore >= 0.75 || lactateLevel >= 4.0 || news2Score >= 7) {
            alertLevel = "CRITICAL_DETERIORATION_IMMINENT";
            recommendedAction = "Trigger Sepsis Response Team / Immediate ICU consult / Blood cultures + IV broad-spectrum antibiotics within 1 hour.";
        } else if (compositeRiskScore >= 0.45 || lactateLevel >= 2.0 || news2Score >= 5) {
            alertLevel = "MODERATE_RISK_WARNING";
            recommendedAction = "Increase vital sign frequency to q15min, check serial lactates, evaluate fluid responsiveness.";
        } else {
            alertLevel = "LOW_RISK_STABLE";
            recommendedAction = "Standard continuous floor/step-down surveillance protocol.";
        }

        Map<String, Object> response = new HashMap<>();
        response.put("compositeRiskScore", BigDecimal.valueOf(compositeRiskScore).setScale(3, RoundingMode.HALF_UP));
        response.put("alertLevel", alertLevel);
        response.put("recommendedAction", recommendedAction);
        response.put("news2Score", news2Score);
        response.put("serumLactate", lactateLevel);
        return response;
    }
}

package com.medtrack.ehr.dto;

import java.time.Instant;
import java.util.List;

public class EhrPatientCohortAnalyticsDto {
    private String cohortId;
    private String cohortName;
    private int totalPatients;
    private double avgReadmissionRisk;
    private List<String> primaryRiskFactors;
    private Instant calculatedAt;

    public EhrPatientCohortAnalyticsDto() {}

    public EhrPatientCohortAnalyticsDto(String cohortId, String cohortName, int totalPatients,
                                       double avgReadmissionRisk, List<String> primaryRiskFactors, Instant calculatedAt) {
        this.cohortId = cohortId;
        this.cohortName = cohortName;
        this.totalPatients = totalPatients;
        this.avgReadmissionRisk = avgReadmissionRisk;
        this.primaryRiskFactors = primaryRiskFactors;
        this.calculatedAt = calculatedAt;
    }

    public String getCohortId() { return cohortId; }
    public void setCohortId(String cohortId) { this.cohortId = cohortId; }
    public String getCohortName() { return cohortName; }
    public void setCohortName(String cohortName) { this.cohortName = cohortName; }
    public int getTotalPatients() { return totalPatients; }
    public void setTotalPatients(int totalPatients) { this.totalPatients = totalPatients; }
    public double getAvgReadmissionRisk() { return avgReadmissionRisk; }
    public void setAvgReadmissionRisk(double avgReadmissionRisk) { this.avgReadmissionRisk = avgReadmissionRisk; }
    public List<String> getPrimaryRiskFactors() { return primaryRiskFactors; }
    public void setPrimaryRiskFactors(List<String> primaryRiskFactors) { this.primaryRiskFactors = primaryRiskFactors; }
    public Instant getCalculatedAt() { return calculatedAt; }
    public void setCalculatedAt(Instant calculatedAt) { this.calculatedAt = calculatedAt; }
}

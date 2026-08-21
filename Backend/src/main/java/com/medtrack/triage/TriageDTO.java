package com.medtrack.triage;

import java.util.List;

/**
 * Data Transfer Object for Triage Requests.
 * Contains exhaustive validation rules for incoming clinical data.
 */
public class TriageDTO {
    
    private String patientId;
    private String rawClinicalText;
    private List<String> previousConditions;
    private List<String> currentMedications;
    private String vitalSignsJson;
    private boolean urgentFlag;
    
    // Getters and Setters
    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }
    
    public String getRawClinicalText() { return rawClinicalText; }
    public void setRawClinicalText(String rawClinicalText) { this.rawClinicalText = rawClinicalText; }
    
    public List<String> getPreviousConditions() { return previousConditions; }
    public void setPreviousConditions(List<String> previousConditions) { this.previousConditions = previousConditions; }
    
    public List<String> getCurrentMedications() { return currentMedications; }
    public void setCurrentMedications(List<String> currentMedications) { this.currentMedications = currentMedications; }
    
    public String getVitalSignsJson() { return vitalSignsJson; }
    public void setVitalSignsJson(String vitalSignsJson) { this.vitalSignsJson = vitalSignsJson; }
    
    public boolean isUrgentFlag() { return urgentFlag; }
    public void setUrgentFlag(boolean urgentFlag) { this.urgentFlag = urgentFlag; }
    
    public static class TriageResponse {
        private String summary;
        private int score;
        private double confidence;
        private List<String> flaggedKeywords;
        
        public String getSummary() { return summary; }
        public void setSummary(String summary) { this.summary = summary; }
        
        public int getScore() { return score; }
        public void setScore(int score) { this.score = score; }
        
        public double getConfidence() { return confidence; }
        public void setConfidence(double confidence) { this.confidence = confidence; }
        
        public List<String> getFlaggedKeywords() { return flaggedKeywords; }
        public void setFlaggedKeywords(List<String> flaggedKeywords) { this.flaggedKeywords = flaggedKeywords; }
    }
}

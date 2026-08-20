package com.medtrack.auth.siem.dto;

import java.util.ArrayList;
import java.util.List;

/**
 * SiemLogIngestResponse
 * Result of ingesting one normalized event, including which correlation rules
 * matched and which alerts were raised as a consequence.
 */
public class SiemLogIngestResponse {

    private String eventId;
    private String ingestedAt;
    private String status;
    private String normalizationStatus;
    private List<String> triggeredRules = new ArrayList<>();
    private List<String> alertIds = new ArrayList<>();
    private String complianceStandard;

    public SiemLogIngestResponse() {
    }

    public String getEventId() {
        return eventId;
    }

    public void setEventId(String eventId) {
        this.eventId = eventId;
    }

    public String getIngestedAt() {
        return ingestedAt;
    }

    public void setIngestedAt(String ingestedAt) {
        this.ingestedAt = ingestedAt;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getNormalizationStatus() {
        return normalizationStatus;
    }

    public void setNormalizationStatus(String normalizationStatus) {
        this.normalizationStatus = normalizationStatus;
    }

    public List<String> getTriggeredRules() {
        return triggeredRules;
    }

    public void setTriggeredRules(List<String> triggeredRules) {
        this.triggeredRules = triggeredRules;
    }

    public List<String> getAlertIds() {
        return alertIds;
    }

    public void setAlertIds(List<String> alertIds) {
        this.alertIds = alertIds;
    }

    public String getComplianceStandard() {
        return complianceStandard;
    }

    public void setComplianceStandard(String complianceStandard) {
        this.complianceStandard = complianceStandard;
    }
}

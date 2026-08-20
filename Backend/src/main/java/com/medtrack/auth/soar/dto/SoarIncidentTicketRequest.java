package com.medtrack.auth.soar.dto;

import java.util.List;

public class SoarIncidentTicketRequest {

    private String title;
    private String severity;
    private String assignedCommander;
    private List<String> impactedAssets;

    public SoarIncidentTicketRequest() {}

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }

    public String getAssignedCommander() { return assignedCommander; }
    public void setAssignedCommander(String assignedCommander) { this.assignedCommander = assignedCommander; }

    public List<String> getImpactedAssets() { return impactedAssets; }
    public void setImpactedAssets(List<String> impactedAssets) { this.impactedAssets = impactedAssets; }
}

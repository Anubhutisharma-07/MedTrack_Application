package com.medtrack.auth.soar.dto;

import java.util.List;

public class SoarPlaybookExecutionRequest {

    private String playbookName;
    private String triggerEvent;
    private String severity;
    private List<String> targetAssets;

    public SoarPlaybookExecutionRequest() {}

    public String getPlaybookName() { return playbookName; }
    public void setPlaybookName(String playbookName) { this.playbookName = playbookName; }

    public String getTriggerEvent() { return triggerEvent; }
    public void setTriggerEvent(String triggerEvent) { this.triggerEvent = triggerEvent; }

    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }

    public List<String> getTargetAssets() { return targetAssets; }
    public void setTargetAssets(List<String> targetAssets) { this.targetAssets = targetAssets; }
}

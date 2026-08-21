package com.medtrack.auth.pam.dto;

public class PamJitElevationRequest {

    private String requesterUserId;
    private String approverUserId;
    private String targetResource;
    private String requestedRole;
    private String justificationReason;
    private int durationMinutes;

    public PamJitElevationRequest() {}

    public String getRequesterUserId() { return requesterUserId; }
    public void setRequesterUserId(String requesterUserId) { this.requesterUserId = requesterUserId; }

    public String getApproverUserId() { return approverUserId; }
    public void setApproverUserId(String approverUserId) { this.approverUserId = approverUserId; }

    public String getTargetResource() { return targetResource; }
    public void setTargetResource(String targetResource) { this.targetResource = targetResource; }

    public String getRequestedRole() { return requestedRole; }
    public void setRequestedRole(String requestedRole) { this.requestedRole = requestedRole; }

    public String getJustificationReason() { return justificationReason; }
    public void setJustificationReason(String justificationReason) { this.justificationReason = justificationReason; }

    public int getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(int durationMinutes) { this.durationMinutes = durationMinutes; }
}

package com.medtrack.auth.pam.dto;

public class PamSessionLogRequest {

    private String elevationId;
    private String userId;
    private String clientIpAddress;
    private String commandExecuted;

    public PamSessionLogRequest() {}

    public String getElevationId() { return elevationId; }
    public void setElevationId(String elevationId) { this.elevationId = elevationId; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getClientIpAddress() { return clientIpAddress; }
    public void setClientIpAddress(String clientIpAddress) { this.clientIpAddress = clientIpAddress; }

    public String getCommandExecuted() { return commandExecuted; }
    public void setCommandExecuted(String commandExecuted) { this.commandExecuted = commandExecuted; }
}

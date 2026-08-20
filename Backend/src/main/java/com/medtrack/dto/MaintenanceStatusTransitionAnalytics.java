package com.medtrack.dto;

public interface MaintenanceStatusTransitionAnalytics {

    String getPreviousStatus();

    String getNewStatus();

    Long getTransitionCount();
}
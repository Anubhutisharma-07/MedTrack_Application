package com.medtrack.dto;

public interface MaintenanceTechnicianAnalytics {

    Long getTechnicianId();

    String getTechnicianName();

    Long getTaskCount();

    Double getAverageHours();
}
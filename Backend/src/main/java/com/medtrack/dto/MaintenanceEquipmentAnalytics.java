package com.medtrack.dto;

public interface MaintenanceEquipmentAnalytics {

    Long getEquipmentId();

    String getEquipmentName();

    Long getTaskCount();

    Double getAverageHours();
}
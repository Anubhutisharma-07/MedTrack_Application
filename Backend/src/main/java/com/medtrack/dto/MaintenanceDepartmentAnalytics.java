package com.medtrack.dto;

public interface MaintenanceDepartmentAnalytics {

    String getDepartment();

    Long getTaskCount();

    Long getCompletedCount();

    Long getOverdueCount();

    Double getAverageHours();
}
package com.medtrack.dto;

import java.time.LocalDate;

public interface MaintenanceTrendAnalytics {

    LocalDate getDate();

    Long getTaskCount();

    Long getCompletedCount();

    Double getHoursWorked();
}
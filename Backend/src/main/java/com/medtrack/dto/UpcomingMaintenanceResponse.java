package com.medtrack.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Tasks falling due inside the calendar's look-ahead window, with the count alongside them so a
 * caller rendering a badge does not have to page the whole list to size it.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpcomingMaintenanceResponse {

    /** First day of the window (inclusive) - today. */
    private LocalDate windowStart;

    /** Last day of the window (inclusive). */
    private LocalDate windowEnd;

    private long totalUpcoming;

    @Builder.Default
    private List<MaintenanceScheduleResponse> schedules = new ArrayList<>();
}

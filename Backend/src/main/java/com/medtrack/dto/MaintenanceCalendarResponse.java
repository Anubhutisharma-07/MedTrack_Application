package com.medtrack.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * The maintenance calendar for one hospital: every scheduled task plus the counts across them.
 *
 * <p>{@code scheduled}, {@code inProgress} and {@code completed} partition {@code totalSchedules}.
 * {@code totalOverdue} deliberately cuts across those bands - an overdue task is still scheduled or
 * in progress - so it is reported separately rather than as a fourth slice of the same total.</p>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaintenanceCalendarResponse {

    /** The date the calendar was built for; every overdue/upcoming flag is relative to it. */
    private LocalDate date;

    private long totalSchedules;

    private long scheduled;

    private long inProgress;

    private long completed;

    private long totalOverdue;

    private long totalUpcoming;

    @Builder.Default
    private List<MaintenanceScheduleResponse> schedules = new ArrayList<>();
}

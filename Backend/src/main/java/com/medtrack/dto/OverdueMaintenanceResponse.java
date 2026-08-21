package com.medtrack.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Tasks past their deadline and not yet completed, worst first.
 *
 * <p>{@code maxDaysOverdue} is the age of the oldest breach, which is what an escalation rule keys
 * off; it is 0 when nothing is overdue.</p>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OverdueMaintenanceResponse {

    /** The date the list was computed against. */
    private LocalDate asOf;

    private long totalOverdue;

    private long maxDaysOverdue;

    @Builder.Default
    private List<OverdueMaintenanceItem> schedules = new ArrayList<>();

    /** One breached task, carrying how long it has been late. */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OverdueMaintenanceItem {

        private MaintenanceScheduleResponse task;

        private long daysOverdue;
    }
}

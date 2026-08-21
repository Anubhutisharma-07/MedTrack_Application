package com.medtrack.service;

import com.medtrack.model.Hospital;
import com.medtrack.repository.HospitalRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import com.medtrack.dto.SlaSummaryResponse;

import java.util.List;

/**
 * Scheduled driver for SLA state recomputation and alerting.
 *
 * <p>Before this scheduler existed, {@link PreventiveMaintenanceService#refreshSla} only ran when
 * a hospital user opened the SLA dashboard, so a task could sit breached for days with nobody
 * notified if no one happened to load that page. This runs the same recomputation across every
 * hospital on a timer and publishes {@code SLA_WARNING}/{@code SLA_BREACHED}/{@code SLA_ESCALATED}
 * and {@code MAINTENANCE_OVERDUE} operations events on each state transition (see
 * {@code publishSlaTransitionEvent}), so the Activity Center reflects overdue work proactively.</p>
 */
@Service
@RequiredArgsConstructor
public class MaintenanceSlaAlertScheduler {

    private static final Logger log = LoggerFactory.getLogger(MaintenanceSlaAlertScheduler.class);

    private final HospitalRepository hospitalRepository;
    private final PreventiveMaintenanceService preventiveMaintenanceService;

    /**
     * Runs hourly by default (configurable via {@code app.maintenance.sla.alert.cron}).
     */
    @Scheduled(cron = "${app.maintenance.sla.alert.cron:0 0 * * * *}")
    public void runSlaSweep() {
        log.info("Starting scheduled maintenance SLA sweep");

            List<Hospital> hospitals = hospitalRepository.findAll();

            int processedHospitals = 0;
            int failedHospitals = 0;
            long warnings = 0;
            long breaches = 0;
            long escalations = 0;

            for (Hospital hospital : hospitals) {
                if (hospital == null || hospital.getId() == null) {
                    continue;
                }

                try {
                    SlaSummaryResponse summary =
                            preventiveMaintenanceService.refreshSlaForHospitalId(
                                    hospital.getId());

                    processedHospitals++;

                    warnings += summary.getWarning();
                    breaches += summary.getBreached();
                    escalations += summary.getEscalated();

                } catch (RuntimeException exception) {
                    failedHospitals++;

                    log.error(
                            "Scheduled SLA sweep failed for hospital {}",
                            hospital.getId(),
                            exception
                    );
                }
            }

            log.info(
                    "Completed scheduled maintenance SLA sweep: " +
                            "hospitalsProcessed={}, hospitalsFailed={}, " +
                            "warningTasks={}, breachedTasks={}, escalatedTasks={}",
                    processedHospitals,
                    failedHospitals,
                    warnings,
                    breaches,
                    escalations
            );
    }
}

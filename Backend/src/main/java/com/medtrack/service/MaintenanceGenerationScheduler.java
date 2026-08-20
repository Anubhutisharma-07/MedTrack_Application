package com.medtrack.service;

import com.medtrack.model.MaintenancePolicyRule;
import com.medtrack.repository.MaintenancePolicyRuleRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

/**
 * Scheduled driver for preventive-maintenance task generation.
 *
 * <p>Processes all active, non-deleted maintenance policy rules on a configurable
 * schedule. Actual generation is delegated to {@link PreventiveMaintenanceService}
 * so scheduled and manually triggered generation share the same business rules
 * and idempotency guarantees.</p>
 */
@Service
@RequiredArgsConstructor
public class MaintenanceGenerationScheduler {

    private static final Logger log =
            LoggerFactory.getLogger(MaintenanceGenerationScheduler.class);

    private final MaintenancePolicyRuleRepository ruleRepository;
    private final PreventiveMaintenanceService preventiveMaintenanceService;

    /**
     * Runs daily by default.
     *
     * <p>The cron can be overridden using
     * {@code app.maintenance.generation.cron}.</p>
     */
    @Scheduled(cron = "${app.maintenance.generation.cron:0 0 1 * * *}")
    public void runGenerationSweep() {
        LocalDate windowStart = LocalDate.now();

        log.debug("Running scheduled preventive-maintenance generation sweep...");

        List<MaintenancePolicyRule> activeRules =
                ruleRepository.findByActiveTrueAndDeletedFalse();

        int processed = 0;
        int successful = 0;
        int failed = 0;

        for (MaintenancePolicyRule rule : activeRules) {
            if (rule.getId() == null || rule.getHospitalId() == null) {
                log.warn(
                        "Skipping maintenance rule with missing id or hospitalId: {}",
                        rule.getId()
                );
                failed++;
                continue;
            }

            int leadTimeDays = rule.getLeadTimeDays() != null
                    ? rule.getLeadTimeDays()
                    : 7;

            LocalDate windowEnd = windowStart.plusDays(leadTimeDays);

            try {
                preventiveMaintenanceService.generateTasksForScheduler(
                        rule.getId(),
                        windowStart,
                        windowEnd
                );

                successful++;

                log.debug(
                        "Scheduled maintenance generation completed for rule {} " +
                                "(hospital {}, window {}..{})",
                        rule.getId(),
                        rule.getHospitalId(),
                        windowStart,
                        windowEnd
                );

            } catch (RuntimeException exception) {
                failed++;

                log.warn(
                        "Scheduled maintenance generation failed for rule {} " +
                                "(hospital {}): {}",
                        rule.getId(),
                        rule.getHospitalId(),
                        exception.getMessage()
                );
            }

            processed++;
        }

        log.info(
                "Preventive-maintenance generation sweep completed: " +
                        "processed={}, successful={}, failed={}",
                processed,
                successful,
                failed
        );
    }
}
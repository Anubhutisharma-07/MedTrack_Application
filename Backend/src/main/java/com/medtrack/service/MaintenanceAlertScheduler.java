package com.medtrack.service;

import com.medtrack.model.EquipmentStatus;
import com.medtrack.model.MaintenanceTask;
import com.medtrack.model.OperationsEvent;
import com.medtrack.repository.MaintenanceTaskRepository;
import com.medtrack.repository.OperationsEventRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Scheduled driver for maintenance alerts (issue #1156).
 *
 * <p>Runs daily and raises an operations event for maintenance tasks due within the next 7 days.
 * Only tasks with an assigned technician are considered. Tasks belonging to retired or disposed
 * equipment are excluded.</p>
 */
@Service
@RequiredArgsConstructor
public class MaintenanceAlertScheduler {

    private static final Logger log = LoggerFactory.getLogger(MaintenanceAlertScheduler.class);

    private static final int ALERT_HORIZON_DAYS = 7;

    private final MaintenanceTaskRepository maintenanceTaskRepository;
    private final OperationsEventRepository eventRepository;
    private final EventPublisherService eventPublisherService;

    /**
     * Runs daily at 00:10 server-local time.
     */
    @Scheduled(cron = "${app.maintenance.alert.cron:0 10 0 * * *}")
    public void runMaintenanceAlertGeneration() {
        LocalDate today = LocalDate.now();
        LocalDate horizon = today.plusDays(ALERT_HORIZON_DAYS);
        int alertsPublished = 0;
        int candidatesConsidered = 0;

        List<MaintenanceTask> candidates = maintenanceTaskRepository.findAlertableUpcomingTasks(
                today, horizon, EquipmentStatus.DECOMMISSIONED);

        for (MaintenanceTask task : candidates) {
            candidatesConsidered++;

            long daysUntil = ChronoUnit.DAYS.between(today, task.getDeadline());

            if (alreadyAlerted(task.getId(), task.getDeadline())) {
                continue;
            }

            publishAlert(task, daysUntil);
            alertsPublished++;
        }

        log.info("Maintenance alert run finished: {} tasks in the {}-day horizon, {} alerts published",
                candidatesConsidered, ALERT_HORIZON_DAYS, alertsPublished);
    }

    /**
     * Prevents duplicate alerts for the same maintenance task and deadline.
     */
    private boolean alreadyAlerted(Long taskId, LocalDate deadline) {
        String deadlineMarker = "\"deadline\":\"" + deadline + "\"";
        return eventRepository
                .findByEntityTypeAndEntityIdOrderByCreatedAtDesc(
                        OperationsEvent.EntityType.MAINTENANCE_TASK, taskId)
                .stream()
                .filter(event -> event.getType() == OperationsEvent.EventType.MAINTENANCE_DUE_SOON)
                .map(OperationsEvent::getDetail)
                .filter(detail -> detail != null)
                .anyMatch(detail -> detail.contains(deadlineMarker));
    }

    private void publishAlert(MaintenanceTask task, long daysUntil) {
        String title = daysUntil == 0
                ? "Maintenance due today: " + task.getEquipment()
                : "Maintenance due in " + daysUntil + " days: " + task.getEquipment();

        String detail = String.format(
                "{\"taskId\":%d,\"taskCode\":\"%s\",\"equipment\":\"%s\",\"technician\":\"%s\",\"deadline\":\"%s\",\"daysUntil\":%d}",
                task.getId(),
                task.getTaskCode(),
                escapeJson(task.getEquipment()),
                escapeJson(task.getAssignedTechnician()),
                task.getDeadline().toString(),
                daysUntil
        );

        OperationsEvent.EventSeverity severity = daysUntil <= 1
                ? OperationsEvent.EventSeverity.CRITICAL
                : OperationsEvent.EventSeverity.WARNING;

        OperationsEvent event = OperationsEvent.builder()
                .hospitalId(task.getHospitalId())
                .category(OperationsEvent.EventCategory.MAINTENANCE)
                .type(OperationsEvent.EventType.MAINTENANCE_DUE_SOON)
                .title(title)
                .detail(detail)
                .entityId(task.getId())
                .entityType(OperationsEvent.EntityType.MAINTENANCE_TASK)
                .severity(severity)
                .actor("System")
                .build();

        eventPublisherService.publishEvent(event);
    }

    private String escapeJson(String input) {
        if (input == null) return "";
        return input.replace("\"", "\\\"").replace("\n", "\\n");
    }
}

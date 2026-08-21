package com.medtrack.service;

import com.medtrack.model.Equipment;
import com.medtrack.model.EquipmentStatus;
import com.medtrack.model.OperationsEvent;
import com.medtrack.repository.EquipmentRepository;
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
 * Scheduled driver for warranty-expiry alerts (issue #703).
 *
 * <p>Runs daily and raises an operations event - broadcast to the hospital's WebSocket
 * subscribers via {@link EventPublisherService} and listed in the event feed - for every asset
 * that enters one of the alert windows: 90, 60 or 30 days before the warranty ends, and on the
 * day of expiry itself. Assets already past expiry are not re-alerted: the EXPIRED status badge
 * on the inventory pages covers them, and daily spam would drown the feed.</p>
 *
 * <p>Alerting is idempotent per asset and window: the threshold is recorded in the event detail,
 * and an existing event for the same asset and threshold suppresses a duplicate, so the job is
 * safe to run repeatedly and a missed day simply folds the asset into the nearest window.</p>
 *
 * <h2>Which assets are eligible (issue #943)</h2>
 *
 * <p>Only assets still in the operating fleet are alerted on. A warranty date on a
 * {@link EquipmentStatus#RETIRED} or {@link EquipmentStatus#DISPOSED} asset is historical record,
 * not something anyone can act on: the device has left the estate through the decommissioning
 * workflow and the warranty cannot be renewed, so a CRITICAL event about it is pure noise in a feed
 * whose value depends on every entry being actionable. That noise is also permanent, because the
 * per-asset/per-threshold suppression marker gets written on the first run.</p>
 *
 * <p>The eligibility rule lives in {@link EquipmentStatus#DECOMMISSIONED} and is applied by the
 * database in {@link EquipmentRepository#findAlertableByWarrantyExpiryBetween}, which also narrows
 * the scan to the 90-day horizon the thresholds actually cover. The previous implementation loaded
 * the entire {@code equipment} table across every tenant on each run and filtered in Java.</p>
 */
@Service
@RequiredArgsConstructor
public class WarrantyExpiryAlertScheduler {

    private static final Logger log = LoggerFactory.getLogger(WarrantyExpiryAlertScheduler.class);

    /** Alert windows, coarsest first. An asset is alerted once per window it falls into. */
    private static final int[] THRESHOLDS = {90, 60, 30, 0};

    /**
     * How far ahead the job looks, in days. Equal to the coarsest threshold: an asset whose warranty
     * ends beyond this horizon falls into no window and cannot produce an alert, so there is nothing
     * to gain by loading it.
     */
    private static final int ALERT_HORIZON_DAYS = 90;

    private final EquipmentRepository equipmentRepository;
    private final OperationsEventRepository eventRepository;
    private final EventPublisherService eventPublisherService;

    /**
     * Runs daily at 00:05 server-local time (configurable via
     * {@code app.warranty.alert.cron}).
     */
    @Scheduled(cron = "${app.warranty.alert.cron:0 5 0 * * *}")
    public void runWarrantyAlertGeneration() {
        LocalDate today = LocalDate.now();
        LocalDate horizon = today.plusDays(ALERT_HORIZON_DAYS);
        int alertsPublished = 0;
        int candidatesConsidered = 0;

        // Scoped by the database: warranty inside the alert horizon, asset still in service, and
        // (through the entity's soft-delete restriction) not archived.
        List<Equipment> candidates = equipmentRepository.findAlertableByWarrantyExpiryBetween(
                today, horizon, EquipmentStatus.DECOMMISSIONED);

        for (Equipment equipment : candidates) {
            if (!isAlertable(equipment)) {
                continue;
            }
            candidatesConsidered++;

            long daysUntil = ChronoUnit.DAYS.between(today, equipment.getWarrantyExpiry());
            Integer threshold = windowFor(daysUntil);
            if (threshold == null || alreadyAlerted(
                    equipment.getId(), equipment.getWarrantyExpiry(), threshold)) {
                continue;
            }
            publishAlert(equipment, threshold, daysUntil);
            alertsPublished++;
        }

        log.info("Warranty alert run finished: {} assets in the {}-day horizon, {} alerts published",
                candidatesConsidered, ALERT_HORIZON_DAYS, alertsPublished);
    }

    /**
     * Belt-and-braces guard for the rule the query already applies.
     *
     * <p>The repository restricts the result set by status and date, so in production this never
     * rejects a row. It stays because the eligibility rule is the whole point of the job and an
     * in-memory assertion of it costs nothing, while a future caller passing a hand-built list -
     * or a query someone edits without noticing why the predicate is there - would otherwise put
     * decommissioned assets straight back into the feed.</p>
     */
    private boolean isAlertable(Equipment equipment) {
        if (equipment == null || equipment.getHospital() == null) {
            return false;
        }
        if (equipment.getWarrantyExpiry() == null) {
            return false;
        }
        return equipment.getStatus() == null || equipment.getStatus().isInService();
    }

    /**
     * The finest alert window {@code daysUntil} falls into, or {@code null} if none.
     *
     * <p>Derived from {@link #THRESHOLDS} rather than a hand-written ladder, so the windows have a
     * single definition. {@code THRESHOLDS} is ordered coarsest first, so the last threshold the
     * value still fits inside is the tightest one: 15 days matches 90, then 60, then 30, and stops -
     * the asset is reported in the 30-day window.</p>
     */
    private Integer windowFor(long daysUntil) {
        if (daysUntil < 0) {
            // Already expired. The EXPIRED badge on the inventory pages covers these.
            return null;
        }
        Integer window = null;
        for (int threshold : THRESHOLDS) {
            if (daysUntil <= threshold) {
                window = threshold;
            }
        }
        return window;
    }

    /**
     * Whether this asset already has an event for the given contract and threshold. Matching both
     * markers preserves idempotency for repeated runs while allowing a renewed warranty to begin a
     * fresh alert cycle. Existing events are compatible because they already include both fields.
     */
    private boolean alreadyAlerted(Long equipmentId, LocalDate expiry, int threshold) {
        String thresholdMarker = "\"threshold\":" + threshold;
        String expiryMarker = "\"expiry\":\"" + expiry + "\"";
        return eventRepository
                .findByEntityTypeAndEntityIdOrderByCreatedAtDesc(
                        OperationsEvent.EntityType.EQUIPMENT, equipmentId)
                .stream()
                .filter(event -> event.getType() == OperationsEvent.EventType.EQUIPMENT_WARRANTY_EXPIRING)
                .map(OperationsEvent::getDetail)
                .filter(detail -> detail != null)
                .anyMatch(detail -> detail.contains(thresholdMarker) && detail.contains(expiryMarker));
    }

    private void publishAlert(Equipment equipment, int threshold, long daysUntil) {
        String title = threshold == 0
                ? "Warranty expires today: " + equipment.getName()
                : "Warranty expires in " + threshold + " days: " + equipment.getName();
        String detail = "{"
                + "\"equipmentCode\":\"" + escape(equipment.getEquipmentCode()) + "\","
                + "\"threshold\":" + threshold + ","
                + "\"daysUntil\":" + daysUntil + ","
                + "\"expiry\":\"" + equipment.getWarrantyExpiry() + "\""
                + "}";
        OperationsEvent.EventSeverity severity = threshold == 0
                ? OperationsEvent.EventSeverity.CRITICAL
                : OperationsEvent.EventSeverity.WARNING;

        eventPublisherService.publishEvent(
                equipment.getHospital().getId(),
                OperationsEvent.EventCategory.EQUIPMENT,
                OperationsEvent.EventType.EQUIPMENT_WARRANTY_EXPIRING,
                title,
                detail,
                equipment.getId(),
                OperationsEvent.EntityType.EQUIPMENT,
                "system",
                severity);
    }

    private String escape(String value) {
        if (value == null) {
            return "";
        }
        return value.replace("\\", "\\\\")
                .replace("\"", "\\\"");
    }
}

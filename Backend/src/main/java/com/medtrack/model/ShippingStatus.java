package com.medtrack.model;

import java.util.Arrays;
import java.util.EnumSet;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * The shipping states a supplier may move an {@link EquipmentOrder} through.
 *
 * <p>{@code EquipmentOrder} documents two vocabularies in its Javadoc - a workflow {@code status}
 * ({@code PENDING}, {@code CONFIRMED}, {@code DISPATCHED}, {@code IN_TRANSIT}, {@code DELIVERED})
 * and a supplier-facing {@code shippingStatus} ({@code Processing}, {@code Shipped},
 * {@code Delivered}, {@code Cancelled}) - and {@code OrderService.updateOrderStatus} used to assign
 * the caller's raw string to both. One of the two columns was therefore always wrong even when the
 * caller sent a legal value, and neither was validated at all: {@code ?status=banana} was accepted
 * and written, after which every {@code "Delivered".equalsIgnoreCase(...)} comparison downstream -
 * supplier KPIs, spend analytics, the paid/unpaid badge on the invoice - silently bucketed the order
 * as not delivered, permanently.</p>
 *
 * <p>This enum is the single definition of what the two columns may contain, how a caller's string
 * maps onto them, and which moves are legal. The labels are exactly the four the supplier UI offers
 * in {@code OrdersList.jsx}.</p>
 */
public enum ShippingStatus {

    /** Accepted, not yet dispatched. Carries the workflow status an order is created with. */
    PROCESSING("Processing", "PENDING"),

    /** Handed to the carrier. This is the transition that legitimately stamps a dispatch date. */
    SHIPPED("Shipped", "DISPATCHED"),

    /** Received by the hospital. Terminal. */
    DELIVERED("Delivered", "DELIVERED"),

    /** Called off. Terminal, and excluded from the supplier's outstanding work. */
    CANCELLED("Cancelled", "CANCELLED");

    private final String label;
    private final String workflowStatus;

    ShippingStatus(String label, String workflowStatus) {
        this.label = label;
        this.workflowStatus = workflowStatus;
    }

    /** The canonical stored form of {@code shippingStatus}, as the frontend renders it. */
    public String getLabel() {
        return label;
    }

    /** The matching value for the {@code status} column, which uses the workflow vocabulary. */
    public String getWorkflowStatus() {
        return workflowStatus;
    }

    /**
     * Parses a caller-supplied status, case-insensitively and tolerant of the aliases already in the
     * database.
     *
     * <p>{@code Pending} appears in seeded and legacy rows and means the same as {@code Processing};
     * {@code Dispatched} and {@code In Transit} were both treated as a dispatch by the previous
     * implementation and stay accepted so existing supplier integrations do not break. Anything else
     * is rejected rather than stored.</p>
     */
    public static Optional<ShippingStatus> parse(String raw) {
        if (raw == null || raw.isBlank()) {
            return Optional.empty();
        }
        String normalized = raw.trim().toLowerCase(Locale.ROOT).replace('_', ' ');
        return switch (normalized) {
            case "processing", "pending" -> Optional.of(PROCESSING);
            case "shipped", "dispatched", "in transit" -> Optional.of(SHIPPED);
            case "delivered" -> Optional.of(DELIVERED);
            case "cancelled", "canceled" -> Optional.of(CANCELLED);
            default -> Optional.empty();
        };
    }

    /**
     * Reads the status already stored on an order.
     *
     * <p>Rows written before this validation existed may hold anything at all, so an unreadable
     * value is reported as absent and treated as "no known state" rather than guessed at.</p>
     */
    public static Optional<ShippingStatus> current(EquipmentOrder order) {
        return order == null ? Optional.empty() : parse(order.getShippingStatus());
    }

    /** A state an order cannot be moved out of. */
    public boolean isTerminal() {
        return this == DELIVERED || this == CANCELLED;
    }

    /**
     * Whether this state may move to {@code next}.
     *
     * <p>Forward only, plus a no-op repeat so re-sending the current status from the UI is not an
     * error. A delivered order cannot go back to processing - that used to leave {@code deliveredAt}
     * populated on an order that was no longer delivered - and a cancelled order cannot be revived.</p>
     */
    public boolean canTransitionTo(ShippingStatus next) {
        if (next == this) {
            return true;
        }
        return switch (this) {
            case PROCESSING -> next == SHIPPED || next == DELIVERED || next == CANCELLED;
            case SHIPPED -> next == DELIVERED || next == CANCELLED;
            case DELIVERED, CANCELLED -> false;
        };
    }

    /** The accepted values, for the message a rejected caller gets back. */
    public static String acceptedLabels() {
        return Arrays.stream(values())
                .map(ShippingStatus::getLabel)
                .collect(Collectors.joining(", "));
    }

    /** The states that still represent outstanding work for a supplier. */
    public static Set<ShippingStatus> outstanding() {
        return EnumSet.of(PROCESSING, SHIPPED);
    }
}

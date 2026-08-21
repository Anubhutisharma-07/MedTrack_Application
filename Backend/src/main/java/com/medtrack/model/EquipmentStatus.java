package com.medtrack.model;

import java.util.Collections;
import java.util.EnumSet;
import java.util.Set;

/**
 * Represents the lifecycle status of a medical equipment asset.
 *
 * <p>{@link #ACTIVE} and {@link #UNDER_MAINTENANCE} describe an asset that is still part of the
 * operating fleet: it may be in the ward or on a workbench, but it is expected back in service.
 * {@link #RETIRED} and {@link #DISPOSED} describe an asset that has permanently left the estate
 * through the decommissioning workflow and will never be serviced, renewed or scheduled again.</p>
 *
 * <p>That second group is what most background automation needs to exclude. The rule used to be
 * restated inline at every call site, which is how the warranty-expiry scheduler ended up raising
 * alerts for equipment that had already been disposed of. {@link #DECOMMISSIONED} and
 * {@link #isDecommissioned()} give the rule one definition to share.</p>
 */
public enum EquipmentStatus {

    /** In service and available for clinical use. */
    ACTIVE,

    /** Temporarily out of service for maintenance; still part of the operating fleet. */
    UNDER_MAINTENANCE,

    /** Withdrawn from service and awaiting disposal. */
    RETIRED,

    /** Decommissioned and removed from the estate; the disposal certificate has been issued. */
    DISPOSED;

    /**
     * Statuses meaning the asset has permanently left the operating fleet.
     *
     * <p>Background jobs, alerting and fleet-level dashboards should exclude these. The set is
     * immutable and safe to pass straight into a repository query.</p>
     */
    public static final Set<EquipmentStatus> DECOMMISSIONED =
            Collections.unmodifiableSet(EnumSet.of(RETIRED, DISPOSED));

    /**
     * Statuses meaning the asset is still part of the operating fleet, whether or not it happens to
     * be usable right now.
     */
    public static final Set<EquipmentStatus> IN_SERVICE =
            Collections.unmodifiableSet(EnumSet.of(ACTIVE, UNDER_MAINTENANCE));

    /** Whether an asset in this status has permanently left the operating fleet. */
    public boolean isDecommissioned() {
        return DECOMMISSIONED.contains(this);
    }

    /** Whether an asset in this status is still part of the operating fleet. */
    public boolean isInService() {
        return !isDecommissioned();
    }
}

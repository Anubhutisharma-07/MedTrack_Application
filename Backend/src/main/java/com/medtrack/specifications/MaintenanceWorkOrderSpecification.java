package com.medtrack.specifications;

import com.medtrack.model.MaintenanceWorkOrder;
import com.medtrack.model.MaintenanceWorkOrderPriority;
import com.medtrack.model.MaintenanceWorkOrderStatus;
import com.medtrack.model.MaintenanceWorkOrderType;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;

public final class MaintenanceWorkOrderSpecification {

    private MaintenanceWorkOrderSpecification() {
        // Utility class
    }

    /**
     * Restricts results to a specific hospital.
     */
    public static Specification<MaintenanceWorkOrder> hasHospitalId(
            Long hospitalId
    ) {
        return (root, query, criteriaBuilder) ->
                hospitalId == null
                        ? null
                        : criteriaBuilder.equal(
                        root.get("hospitalId"),
                        hospitalId
                );
    }

    /**
     * Filters by work-order status.
     */
    public static Specification<MaintenanceWorkOrder> hasStatus(
            MaintenanceWorkOrderStatus status
    ) {
        return (root, query, criteriaBuilder) ->
                status == null
                        ? null
                        : criteriaBuilder.equal(
                        root.get("status"),
                        status
                );
    }

    /**
     * Filters by priority.
     */
    public static Specification<MaintenanceWorkOrder> hasPriority(
            MaintenanceWorkOrderPriority priority
    ) {
        return (root, query, criteriaBuilder) ->
                priority == null
                        ? null
                        : criteriaBuilder.equal(
                        root.get("priority"),
                        priority
                );
    }

    /**
     * Filters by maintenance type.
     */
    public static Specification<MaintenanceWorkOrder> hasMaintenanceType(
            MaintenanceWorkOrderType maintenanceType
    ) {
        return (root, query, criteriaBuilder) ->
                maintenanceType == null
                        ? null
                        : criteriaBuilder.equal(
                        root.get("maintenanceType"),
                        maintenanceType
                );
    }

    /**
     * Filters work orders associated with an equipment item.
     */
    public static Specification<MaintenanceWorkOrder> hasEquipmentId(
            Long equipmentId
    ) {
        return (root, query, criteriaBuilder) ->
                equipmentId == null
                        ? null
                        : criteriaBuilder.equal(
                        root.get("equipmentId"),
                        equipmentId
                );
    }

    /**
     * Filters work orders assigned to a specific technician/user.
     */
    public static Specification<MaintenanceWorkOrder> hasAssignedUserId(
            Long assignedUserId
    ) {
        return (root, query, criteriaBuilder) ->
                assignedUserId == null
                        ? null
                        : criteriaBuilder.equal(
                        root.get("assignedUserId"),
                        assignedUserId
                );
    }

    /**
     * Filters work orders created on or after the supplied date.
     */
    public static Specification<MaintenanceWorkOrder> createdFrom(
            LocalDate date
    ) {
        return (root, query, criteriaBuilder) -> {

            if (date == null) {
                return null;
            }

            return criteriaBuilder.greaterThanOrEqualTo(
                    root.get("createdAt"),
                    date.atStartOfDay()
            );
        };
    }

    /**
     * Filters work orders created on or before the supplied date.
     */
    public static Specification<MaintenanceWorkOrder> createdTo(
            LocalDate date
    ) {
        return (root, query, criteriaBuilder) -> {

            if (date == null) {
                return null;
            }

            return criteriaBuilder.lessThan(
                    root.get("createdAt"),
                    date.plusDays(1).atStartOfDay()
            );
        };
    }

    /**
     * Filters work orders whose due date is on or after
     * the supplied date.
     */
    public static Specification<MaintenanceWorkOrder> dueFrom(
            LocalDate date
    ) {
        return (root, query, criteriaBuilder) ->
                date == null
                        ? null
                        : criteriaBuilder.greaterThanOrEqualTo(
                        root.get("dueDate"),
                        date
                );
    }

    /**
     * Filters work orders whose due date is on or before
     * the supplied date.
     */
    public static Specification<MaintenanceWorkOrder> dueTo(
            LocalDate date
    ) {
        return (root, query, criteriaBuilder) ->
                date == null
                        ? null
                        : criteriaBuilder.lessThanOrEqualTo(
                        root.get("dueDate"),
                        date
                );
    }

    /**
     * Finds work orders that are currently overdue.
     *
     * <p>An order is considered overdue when its due date is before
     * today and it has not reached COMPLETED or CANCELLED.</p>
     */
    public static Specification<MaintenanceWorkOrder> overdue() {

        return (root, query, criteriaBuilder) -> {

            LocalDate today = LocalDate.now();

            return criteriaBuilder.and(
                    criteriaBuilder.isNotNull(
                            root.get("dueDate")
                    ),

                    criteriaBuilder.lessThan(
                            root.get("dueDate"),
                            today
                    ),

                    root.get("status").in(
                            MaintenanceWorkOrderStatus.OPEN,
                            MaintenanceWorkOrderStatus.ASSIGNED,
                            MaintenanceWorkOrderStatus.IN_PROGRESS,
                            MaintenanceWorkOrderStatus.ON_HOLD
                    )
            );
        };
    }

    /**
     * Searches work orders by title, description,
     * work-order code, or assigned technician.
     */
    public static Specification<MaintenanceWorkOrder> search(
            String search
    ) {
        return (root, query, criteriaBuilder) -> {

            if (search == null || search.isBlank()) {
                return null;
            }

            String pattern =
                    "%" + search.trim().toLowerCase() + "%";

            return criteriaBuilder.or(

                    criteriaBuilder.like(
                            criteriaBuilder.lower(
                                    root.get("workOrderCode")
                            ),
                            pattern
                    ),

                    criteriaBuilder.like(
                            criteriaBuilder.lower(
                                    root.get("title")
                            ),
                            pattern
                    ),

                    criteriaBuilder.like(
                            criteriaBuilder.lower(
                                    root.get("description")
                            ),
                            pattern
                    ),

                    criteriaBuilder.like(
                            criteriaBuilder.lower(
                                    root.get("assignedTechnician")
                            ),
                            pattern
                    )
            );
        };
    }

    /**
     * Combines all supported filters into a single specification.
     */
    public static Specification<MaintenanceWorkOrder> build(
            Long hospitalId,
            MaintenanceWorkOrderStatus status,
            MaintenanceWorkOrderPriority priority,
            MaintenanceWorkOrderType maintenanceType,
            Long equipmentId,
            Long assignedUserId,
            LocalDate createdFrom,
            LocalDate createdTo,
            LocalDate dueFrom,
            LocalDate dueTo,
            String search,
            Boolean overdue
    ) {

        Specification<MaintenanceWorkOrder> specification =
                Specification.where(
                        hasHospitalId(hospitalId)
                );

        specification = specification.and(
                hasStatus(status)
        );

        specification = specification.and(
                hasPriority(priority)
        );

        specification = specification.and(
                hasMaintenanceType(maintenanceType)
        );

        specification = specification.and(
                hasEquipmentId(equipmentId)
        );

        specification = specification.and(
                hasAssignedUserId(assignedUserId)
        );

        specification = specification.and(
                createdFrom(createdFrom)
        );

        specification = specification.and(
                createdTo(createdTo)
        );

        specification = specification.and(
                dueFrom(dueFrom)
        );

        specification = specification.and(
                dueTo(dueTo)
        );

        specification = specification.and(
                search(search)
        );

        if (Boolean.TRUE.equals(overdue)) {
            specification = specification.and(
                    overdue()
            );
        }

        return specification;
    }
}
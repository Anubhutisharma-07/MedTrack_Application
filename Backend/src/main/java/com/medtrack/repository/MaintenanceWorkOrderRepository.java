package com.medtrack.repository;

import com.medtrack.model.MaintenanceWorkOrder;
import com.medtrack.model.MaintenanceWorkOrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;

public interface MaintenanceWorkOrderRepository
        extends JpaRepository<MaintenanceWorkOrder, Long>,
        JpaSpecificationExecutor<MaintenanceWorkOrder> {

    /**
     * Find a work order belonging to a specific hospital.
     */
    Optional<MaintenanceWorkOrder> findByIdAndHospitalId(
            Long id,
            Long hospitalId
    );

    /**
     * Find a work order by its public code.
     */
    Optional<MaintenanceWorkOrder> findByWorkOrderCode(
            String workOrderCode
    );

    /**
     * Find a work order by public code within a hospital.
     */
    Optional<MaintenanceWorkOrder> findByWorkOrderCodeAndHospitalId(
            String workOrderCode,
            Long hospitalId
    );

    /**
     * Check whether a work-order code already exists.
     */
    boolean existsByWorkOrderCode(String workOrderCode);

    /**
     * Get all work orders for a hospital.
     */
    List<MaintenanceWorkOrder> findAllByHospitalIdOrderByCreatedAtDesc(
            Long hospitalId
    );

    /**
     * Get work orders by status for a hospital.
     */
    List<MaintenanceWorkOrder> findAllByHospitalIdAndStatusOrderByCreatedAtDesc(
            Long hospitalId,
            MaintenanceWorkOrderStatus status
    );

    /**
     * Get work orders assigned to a technician.
     */
    List<MaintenanceWorkOrder> findAllByHospitalIdAndAssignedUserIdOrderByDueDateAsc(
            Long hospitalId,
            Long assignedUserId
    );

    /**
     * Get work orders belonging to an equipment item.
     */
    List<MaintenanceWorkOrder> findAllByHospitalIdAndEquipmentIdOrderByCreatedAtDesc(
            Long hospitalId,
            Long equipmentId
    );

    /**
     * Count work orders by status.
     */
    long countByHospitalIdAndStatus(
            Long hospitalId,
            MaintenanceWorkOrderStatus status
    );

    /**
     * Count open/active work orders assigned to a technician.
     */
    long countByHospitalIdAndAssignedUserIdAndStatus(
            Long hospitalId,
            Long assignedUserId,
            MaintenanceWorkOrderStatus status
    );

    /**
     * Check whether an active work order exists for a maintenance task.
     */
    boolean existsByHospitalIdAndMaintenanceTaskIdAndStatusIn(
            Long hospitalId,
            Long maintenanceTaskId,
            List<MaintenanceWorkOrderStatus> statuses
    );

    /**
     * Count active work orders for an equipment item.
     */
    long countByHospitalIdAndEquipmentIdAndStatusIn(
            Long hospitalId,
            Long equipmentId,
            List<MaintenanceWorkOrderStatus> statuses
    );
}
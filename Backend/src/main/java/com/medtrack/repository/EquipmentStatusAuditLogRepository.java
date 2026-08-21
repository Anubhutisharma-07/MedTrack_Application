package com.medtrack.repository;

import com.medtrack.model.EquipmentStatusAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EquipmentStatusAuditLogRepository extends JpaRepository<EquipmentStatusAuditLog, Long> {
    List<EquipmentStatusAuditLog> findByEquipmentIdOrderByTimestampDesc(Long equipmentId);
}

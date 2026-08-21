package com.medtrack.repository;

import com.medtrack.model.EquipmentAudit;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Stream;

public interface EquipmentAuditRepository
        extends JpaRepository<EquipmentAudit, Long> {

    List<EquipmentAudit> findByHospitalIdOrderByTimestampDesc(Long hospitalId);
    Stream<EquipmentAudit> streamByHospitalIdOrderByTimestampDesc(Long hospitalId);

    List<EquipmentAudit> findByEquipmentIdOrderByTimestampDesc(Long equipmentId);

    List<EquipmentAudit> findByEquipmentIdAndHospitalIdOrderByTimestampDesc(
            Long equipmentId,
            Long hospitalId
    );

    List<EquipmentAudit> findByHospitalIdAndActionOrderByTimestampDesc(
            Long hospitalId,
            String action
    );

    List<EquipmentAudit> findByHospitalIdAndUsernameOrderByTimestampDesc(
            Long hospitalId,
            String username
    );

    List<EquipmentAudit> findByHospitalIdAndTimestampBetweenOrderByTimestampDesc(
            Long hospitalId,
            LocalDateTime start,
            LocalDateTime end
    );

    List<EquipmentAudit> findByUsernameOrderByTimestampDesc(String username);

    List<EquipmentAudit> findByActionOrderByTimestampDesc(String action);

    List<EquipmentAudit> findByTimestampBetweenOrderByTimestampDesc(
            LocalDateTime start,
            LocalDateTime end
    );
}
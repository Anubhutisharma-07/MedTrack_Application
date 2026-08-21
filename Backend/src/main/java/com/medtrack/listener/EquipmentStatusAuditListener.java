package com.medtrack.listener;

import com.medtrack.model.Equipment;
import com.medtrack.model.EquipmentStatusAuditLog;
import com.medtrack.repository.EquipmentStatusAuditLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.context.annotation.Lazy;

import jakarta.persistence.PreUpdate;
import java.time.LocalDateTime;

@Component
public class EquipmentStatusAuditListener {
    private static final Logger logger = LoggerFactory.getLogger(EquipmentStatusAuditListener.class);

    // Use ObjectProvider/Lazy to avoid circular dependencies during JPA initialization
    private final ObjectProvider<EquipmentStatusAuditLogRepository> auditLogRepositoryProvider;

    // Default constructor for Hibernate when SpringBeanContainer is not available (e.g. hand-rolled test configs)
    public EquipmentStatusAuditListener() {
        this.auditLogRepositoryProvider = null;
    }

    @org.springframework.beans.factory.annotation.Autowired
    public EquipmentStatusAuditListener(ObjectProvider<EquipmentStatusAuditLogRepository> auditLogRepositoryProvider) {
        this.auditLogRepositoryProvider = auditLogRepositoryProvider;
    }

    @PreUpdate
    public void onPreUpdate(Equipment equipment) {
        // If the original status hasn't been set (e.g., this is a newly created entity that wasn't loaded from DB),
        // or if the status hasn't changed, do nothing.
        if (equipment.getOriginalStatus() == null || equipment.getOriginalStatus() == equipment.getStatus()) {
            return;
        }

        String userId = "SYSTEM";
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getName() != null) {
            userId = authentication.getName();
        }

        EquipmentStatusAuditLog auditLog = EquipmentStatusAuditLog.builder()
                .equipmentId(equipment.getId())
                .userId(userId)
                .oldStatus(equipment.getOriginalStatus())
                .newStatus(equipment.getStatus())
                .timestamp(LocalDateTime.now())
                .build();

        try {
            if (auditLogRepositoryProvider != null) {
                auditLogRepositoryProvider.ifAvailable(repo -> repo.save(auditLog));
            }
            // Update the original status so that subsequent saves in the same session don't re-trigger
            equipment.setOriginalStatus(equipment.getStatus());
        } catch (Exception e) {
            logger.error("Failed to save EquipmentStatusAuditLog", e);
        }
    }
}

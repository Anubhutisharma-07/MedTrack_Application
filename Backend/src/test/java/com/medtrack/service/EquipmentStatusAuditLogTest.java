package com.medtrack.service;

import com.medtrack.model.Equipment;
import com.medtrack.model.EquipmentStatus;
import com.medtrack.model.Hospital;
import com.medtrack.model.EquipmentStatusAuditLog;
import com.medtrack.repository.EquipmentRepository;
import com.medtrack.repository.EquipmentStatusAuditLogRepository;
import com.medtrack.repository.HospitalRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest(properties = {
        "eureka.client.enabled=false",
        "spring.cloud.discovery.enabled=false",
        "spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.kafka.KafkaAutoConfiguration",
        "spring.datasource.url=jdbc:h2:mem:audit-log-tests;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "app.data-initializer.enabled=false"
})
@Transactional
@DisplayName("equipment status audit logging")
class EquipmentStatusAuditLogTest {

    @Autowired
    private EquipmentRepository equipmentRepository;

    @Autowired
    private HospitalRepository hospitalRepository;

    @Autowired
    private EquipmentStatusAuditLogRepository auditLogRepository;

    private Hospital hospital;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("testuser", "password", List.of())
        );

        hospital = new Hospital();
        hospital.setName("Test Hospital");
        hospital.setLocation("123 Med St");
        hospital = hospitalRepository.saveAndFlush(hospital);
    }

    @Test
    void testAuditLogCreatedOnStatusChange() {
        // Create an equipment with AVAILABLE status
        Equipment equipment = Equipment.builder()
                .name("Defibrillator")
                .equipmentCode("DEF-001")
                .hospital(hospital)
                .department("Cardiology")
                .status(EquipmentStatus.ACTIVE)
                .build();
        
        equipment = equipmentRepository.saveAndFlush(equipment);

        // No audit log should be created for the initial save (or if there is, we ignore it, but ideally none)
        int initialLogs = auditLogRepository.findByEquipmentIdOrderByTimestampDesc(equipment.getId()).size();

        // Change status to UNDER_MAINTENANCE
        equipment.setStatus(EquipmentStatus.UNDER_MAINTENANCE);
        equipmentRepository.saveAndFlush(equipment);

        List<EquipmentStatusAuditLog> logs = auditLogRepository.findByEquipmentIdOrderByTimestampDesc(equipment.getId());
        assertEquals(initialLogs + 1, logs.size());

        EquipmentStatusAuditLog log = logs.get(0);
        assertEquals(equipment.getId(), log.getEquipmentId());
        assertEquals("testuser", log.getUserId());
        assertEquals(EquipmentStatus.ACTIVE, log.getOldStatus());
        assertEquals(EquipmentStatus.UNDER_MAINTENANCE, log.getNewStatus());
        assertNotNull(log.getTimestamp());
    }

    @Test
    void testNoAuditLogCreatedOnUnrelatedFieldChange() {
        Equipment equipment = Equipment.builder()
                .name("Defibrillator")
                .equipmentCode("DEF-002")
                .hospital(hospital)
                .department("Cardiology")
                .status(EquipmentStatus.ACTIVE)
                .build();
        
        equipment = equipmentRepository.saveAndFlush(equipment);
        int initialLogs = auditLogRepository.findByEquipmentIdOrderByTimestampDesc(equipment.getId()).size();

        // Change name, but keep status the same
        equipment.setName("Updated Defibrillator");
        equipmentRepository.saveAndFlush(equipment);

        List<EquipmentStatusAuditLog> logs = auditLogRepository.findByEquipmentIdOrderByTimestampDesc(equipment.getId());
        assertEquals(initialLogs, logs.size());
    }
}

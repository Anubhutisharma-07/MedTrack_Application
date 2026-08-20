package com.medtrack.service;

import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.dto.EquipmentAuditResponse;
import com.medtrack.exception.ResourceNotFoundException;
import com.medtrack.model.Equipment;
import com.medtrack.model.EquipmentAudit;
import com.medtrack.model.Hospital;
import com.medtrack.repository.EquipmentAuditRepository;
import com.medtrack.repository.EquipmentRepository;
import com.medtrack.repository.HospitalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EquipmentAuditService {

    private static final DateTimeFormatter TIMESTAMP_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final EquipmentAuditRepository equipmentAuditRepository;
    private final EquipmentRepository equipmentRepository;
    private final HospitalRepository hospitalRepository;
    private final UserRepository userRepository;

    private Hospital getHospitalForUser(String username) {
        if (username == null || username.isBlank()) {
            throw new IllegalArgumentException("Username or email is required");
        }
        String identifier = username.trim();
        User user = userRepository.findByUsername(identifier)
                .or(() -> userRepository.findByEmail(identifier.toLowerCase(java.util.Locale.ROOT)))
                .orElseThrow(() -> new ResourceNotFoundException("User not found with username: " + username));
        return hospitalRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Hospital profile not found for user"));
    }

    public void logAction(
            Equipment equipment,
            Hospital hospital,
            String username,
            String action,
            String changedFields,
            String previousValue,
            String newValue
    ) {

        EquipmentAudit audit = EquipmentAudit.builder()
                .equipmentId(equipment.getId())
                .hospital(hospital)
                .username(username)
                .action(action)
                .changedFields(changedFields)
                .previousValue(previousValue)
                .newValue(newValue)
                .timestamp(LocalDateTime.now())
                .build();

        equipmentAuditRepository.save(audit);
    }

    @Transactional(readOnly = true)
    public List<EquipmentAuditResponse> getEquipmentHistory(Long equipmentId, String username) {
        if (equipmentId == null) {
            throw new IllegalArgumentException("Equipment ID is required");
        }
        Hospital hospital = getHospitalForUser(username);
        equipmentRepository.findByIdAndHospitalId(equipmentId, hospital.getId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Equipment not found or access denied"));

        return equipmentAuditRepository
                .findByEquipmentIdAndHospitalIdOrderByTimestampDesc(equipmentId, hospital.getId())
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<EquipmentAuditResponse> getEquipmentHistory(Long equipmentId) {
        if (equipmentId == null) {
            throw new IllegalArgumentException("Equipment ID is required");
        }
        return equipmentAuditRepository
                .findByEquipmentIdOrderByTimestampDesc(equipmentId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<EquipmentAuditResponse> getHospitalHistory(Long hospitalId) {
        if (hospitalId == null) {
            throw new IllegalArgumentException("Hospital ID is required");
        }
        return equipmentAuditRepository
                .findByHospitalIdOrderByTimestampDesc(hospitalId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<EquipmentAuditResponse> getHospitalHistory(String username) {
        Hospital hospital = getHospitalForUser(username);
        return equipmentAuditRepository
                .findByHospitalIdOrderByTimestampDesc(hospital.getId())
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<EquipmentAuditResponse> getFilteredHospitalHistory(
            String username,
            String action,
            String filterUser,
            LocalDateTime start,
            LocalDateTime end
    ) {
        Hospital hospital = getHospitalForUser(username);
        List<EquipmentAudit> audits;

        if (action != null && !action.isBlank()) {
            audits = equipmentAuditRepository.findByHospitalIdAndActionOrderByTimestampDesc(
                    hospital.getId(), action.trim());
        } else if (filterUser != null && !filterUser.isBlank()) {
            audits = equipmentAuditRepository.findByHospitalIdAndUsernameOrderByTimestampDesc(
                    hospital.getId(), filterUser.trim());
        } else if (start != null && end != null) {
            audits = equipmentAuditRepository.findByHospitalIdAndTimestampBetweenOrderByTimestampDesc(
                    hospital.getId(), start, end);
        } else {
            audits = equipmentAuditRepository.findByHospitalIdOrderByTimestampDesc(hospital.getId());
        }

        return audits.stream().map(this::mapToResponse).toList();
    }

    @Transactional(readOnly = true)
    public void exportAuditHistoryCsv(String username, jakarta.servlet.http.HttpServletResponse response) throws java.io.IOException {
        Hospital hospital = getHospitalForUser(username);

        response.setContentType("text/csv");
        response.setHeader("Content-Disposition", "attachment; filename=audit-history.csv");

        try (java.io.PrintWriter writer = response.getWriter();
             java.util.stream.Stream<EquipmentAudit> auditStream = equipmentAuditRepository.streamByHospitalIdOrderByTimestampDesc(hospital.getId())) {
            
            writer.write("ID,Equipment ID,Username,Action,Changed Fields,Previous Value,New Value,Timestamp\n");

            auditStream.forEach(audit -> {
                EquipmentAuditResponse log = mapToResponse(audit);
                writer.write(log.getId() + "," +
                        (log.getEquipmentId() != null ? log.getEquipmentId() : "") + "," +
                        escapeCsv(log.getUsername()) + "," +
                        escapeCsv(log.getAction()) + "," +
                        escapeCsv(log.getChangedFields()) + "," +
                        escapeCsv(log.getPreviousValue()) + "," +
                        escapeCsv(log.getNewValue()) + "," +
                        (log.getTimestamp() != null ? log.getTimestamp().format(TIMESTAMP_FORMATTER) : "") + "\n");
            });
            writer.flush();
        }
    }

    private String escapeCsv(String value) {
        if (value == null) {
            return "";
        }
        String sanitized = value.replace("\"", "\"\"");
        if (sanitized.contains(",") || sanitized.contains("\n") || sanitized.contains("\"")) {
            return "\"" + sanitized + "\"";
        }
        return sanitized;
    }

    private EquipmentAuditResponse mapToResponse(EquipmentAudit audit) {

        return EquipmentAuditResponse.builder()
                .id(audit.getId())
                .equipmentId(audit.getEquipmentId())
                .username(audit.getUsername())
                .action(audit.getAction())
                .changedFields(audit.getChangedFields())
                .previousValue(audit.getPreviousValue())
                .newValue(audit.getNewValue())
                .timestamp(audit.getTimestamp())
                .build();
    }
}
package com.medtrack.controller;

import com.medtrack.dto.EquipmentAuditResponse;
import com.medtrack.service.EquipmentAuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/equipment")
@RequiredArgsConstructor
public class EquipmentAuditController {

    private final EquipmentAuditService equipmentAuditService;

    @GetMapping("/{id}/history")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<List<EquipmentAuditResponse>> getEquipmentHistory(
            @PathVariable Long id,
            Principal principal
    ) {
        if (principal == null || principal.getName() == null || principal.getName().isBlank()) {
            throw new IllegalArgumentException("Authenticated principal username is required");
        }
        return ResponseEntity.ok(
                equipmentAuditService.getEquipmentHistory(id, principal.getName())
        );
    }

    @GetMapping("/audit-history")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<List<EquipmentAuditResponse>> getHospitalAuditHistory(
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String user,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            Principal principal
    ) {
        if (principal == null || principal.getName() == null || principal.getName().isBlank()) {
            throw new IllegalArgumentException("Authenticated principal username is required");
        }
        if (action != null || user != null || (startDate != null && endDate != null)) {
            return ResponseEntity.ok(
                    equipmentAuditService.getFilteredHospitalHistory(
                            principal.getName(), action, user, startDate, endDate)
            );
        }
        return ResponseEntity.ok(
                equipmentAuditService.getHospitalHistory(principal.getName())
        );
    }

    @GetMapping("/audit-history/export")
    @PreAuthorize("hasRole('HOSPITAL')")
    public void exportHospitalAuditHistoryCsv(Principal principal, jakarta.servlet.http.HttpServletResponse response) throws java.io.IOException {
        equipmentAuditService.exportAuditHistoryCsv(principal.getName(), response);
    }
}
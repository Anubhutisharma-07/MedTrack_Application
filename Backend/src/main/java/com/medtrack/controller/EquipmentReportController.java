package com.medtrack.controller;

import com.medtrack.dto.EquipmentReportRequest;
import com.medtrack.dto.EquipmentReportResponse;
import com.medtrack.service.EquipmentReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

@RestController
@RequestMapping("/api/equipment")
@RequiredArgsConstructor
@Tag(name = "Equipment Management", description = "Endpoints for equipment inventory operations and reports.")
public class EquipmentReportController {

    private final EquipmentReportService equipmentReportService;

    @PostMapping("/report")
    @PreAuthorize("hasRole('HOSPITAL')")
    @Operation(summary = "Generate equipment summary report", description = "Generates aggregated metrics and filtered equipment records for the authenticated hospital.")
    public ResponseEntity<EquipmentReportResponse> generateReport(
            @Valid @RequestBody EquipmentReportRequest request,
            Principal principal
    ) {
        return ResponseEntity.ok(
                equipmentReportService.generateReport(
                        request,
                        principal.getName()
                )
        );
    }
}
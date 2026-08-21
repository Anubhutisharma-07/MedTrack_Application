package com.medtrack.dto;

import com.medtrack.model.EquipmentCategory;
import com.medtrack.model.EquipmentStatus;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EquipmentReportRequest {

    @Size(max = 100, message = "Department name must not exceed 100 characters")
    private String department;

    private EquipmentCategory category;

    private EquipmentStatus status;

    @Size(max = 100, message = "Manufacturer name must not exceed 100 characters")
    private String manufacturer;

    private LocalDate purchaseStartDate;

    private LocalDate purchaseEndDate;

    private Boolean warrantyExpired;
}

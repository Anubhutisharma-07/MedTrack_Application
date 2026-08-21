package com.medtrack.dto;

import com.medtrack.model.Equipment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EquipmentReportResponse {

    private EquipmentReportSummary summary;
    private List<Equipment> equipment;
}

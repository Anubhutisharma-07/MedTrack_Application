package com.medtrack.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EquipmentReportSummary {

    private long totalEquipment;
    private long active;
    private long maintenance;
    private long retired;
    private long expiredWarranty;
    private long expiringSoon;
    private long lowStock;
}

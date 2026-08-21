package com.medtrack.dto;

import com.medtrack.model.SparePart;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PredictiveSupplyForecastResponse {
    private Long sparePartId;
    private String partNumber;
    private String description;
    private Integer currentStockLevel;
    private Integer reorderPoint;
    private Double unitCost;
    private Double consumptionVelocity;
    private Double seasonalityMultiplier;
    private Double predictedShortage;
    private LocalDateTime generatedAt;

    public static PredictiveSupplyForecastResponse from(SparePart part, double velocity, double seasonality, double shortage) {
        if (part == null) return null;
        return PredictiveSupplyForecastResponse.builder()
                .sparePartId(part.getId())
                .partNumber(part.getPartNumber())
                .description(part.getDescription())
                .currentStockLevel(part.getStockLevel())
                .reorderPoint(part.getReorderPoint())
                .unitCost(part.getUnitCost())
                .consumptionVelocity(velocity)
                .seasonalityMultiplier(seasonality)
                .predictedShortage(shortage)
                .generatedAt(LocalDateTime.now())
                .build();
    }
}

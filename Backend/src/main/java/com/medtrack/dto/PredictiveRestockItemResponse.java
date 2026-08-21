package com.medtrack.dto;

import com.medtrack.model.SparePart;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PredictiveRestockItemResponse {
    private Long sparePartId;
    private String partNumber;
    private String description;
    private Integer currentStock;
    private Double predictedDemand;
    private Integer recommendedReorderAmount;
    private String status;

    public static PredictiveRestockItemResponse from(SparePart part, double predictedDemand, int reorderAmount) {
        if (part == null) return null;
        return PredictiveRestockItemResponse.builder()
                .sparePartId(part.getId())
                .partNumber(part.getPartNumber())
                .description(part.getDescription())
                .currentStock(part.getStockLevel())
                .predictedDemand(predictedDemand)
                .recommendedReorderAmount(reorderAmount)
                .status("REORDER_NEEDED")
                .build();
    }
}

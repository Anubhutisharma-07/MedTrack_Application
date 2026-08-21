package com.medtrack.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * Structured DTO representing a spare part quantity allocation or consumption item
 * during maintenance work order execution.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SparePartDeductionItem {

    @NotBlank(message = "Spare part number is required")
    private String partNumber;

    @Min(value = 1, message = "Quantity consumed must be at least 1")
    @Builder.Default
    private Integer quantity = 1;

    /**
     * Parses a string representation of consumed spare parts into structured deduction items.
     * Supports formats like "PRT-1001: 2, PRT-1002: 1", "PRT-1001 (2)", or comma/newline separated part numbers.
     *
     * @param partsUsed raw text entered by technician
     * @return list of parsed deduction items
     */
    public static List<SparePartDeductionItem> parsePartsUsed(String partsUsed) {
        List<SparePartDeductionItem> items = new ArrayList<>();
        if (partsUsed == null || partsUsed.isBlank()) {
            return items;
        }

        String[] tokens = partsUsed.split("[,;\\n]+");
        for (String token : tokens) {
            String trimmed = token.trim();
            if (trimmed.isEmpty()) {
                continue;
            }

            String partNum = trimmed;
            int qty = 1;

            if (trimmed.contains(":")) {
                String[] parts = trimmed.split(":", 2);
                partNum = parts[0].trim();
                try {
                    qty = Integer.parseInt(parts[1].trim());
                } catch (NumberFormatException ignored) {
                    qty = 1;
                }
            } else if (trimmed.contains("(") && trimmed.endsWith(")")) {
                int openIdx = trimmed.indexOf("(");
                partNum = trimmed.substring(0, openIdx).trim();
                String qtyStr = trimmed.substring(openIdx + 1, trimmed.length() - 1).trim();
                try {
                    qty = Integer.parseInt(qtyStr);
                } catch (NumberFormatException ignored) {
                    qty = 1;
                }
            }

            if (!partNum.isEmpty() && qty > 0) {
                items.add(SparePartDeductionItem.builder()
                        .partNumber(partNum)
                        .quantity(qty)
                        .build());
            }
        }
        return items;
    }
}

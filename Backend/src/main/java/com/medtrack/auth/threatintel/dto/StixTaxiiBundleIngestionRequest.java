package com.medtrack.auth.threatintel.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Payload for ingesting bulk OASIS STIX/TAXII 2.1 Cyber Threat Intelligence (CTI) JSON bundles.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StixTaxiiBundleIngestionRequest {

    @NotBlank(message = "STIX Bundle Type is required (bundle)")
    private String type;

    @NotBlank(message = "STIX Bundle ID is required")
    private String id;

    @NotBlank(message = "STIX Spec Version is required (e.g., 2.1)")
    private String specVersion;

    private String feedSource;
    private List<StixObjectDto> objects;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StixObjectDto {
        private String type; // "indicator", "attack-pattern", "malware", "threat-actor"
        private String id;
        private String name;
        private String description;
        private String pattern;
        private String patternType; // "stix", "snort", "yara"
        private Integer confidence;
        private List<String> indicatorTypes;
        private List<String> killChainPhases;
    }
}

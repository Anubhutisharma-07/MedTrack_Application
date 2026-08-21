package com.medtrack.auth.microsegmentation.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request payload for evaluating real-time Zero-Trust packet access.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EvaluateTrafficAccessRequest {

    @NotBlank(message = "Source segment is required")
    private String sourceSegment;

    @NotBlank(message = "Destination segment is required")
    private String destinationSegment;

    @NotBlank(message = "Allowed protocol is required (TCP/UDP/ICMP/ALL)")
    private String protocol;

    @NotBlank(message = "Port range is required (e.g. 443, 5432, *)")
    private String port;

    private String clientCertificateFingerprint;
    private String userIdentityToken;
    private String sourceIpAddress;
}

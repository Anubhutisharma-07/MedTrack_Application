package com.medtrack.auth.siem.dto;

/**
 * SiemAlertTriageRequest
 * Payload for analyst-driven alert triage (acknowledgement attribution and
 * resolution notes), supporting the incident-handling accountability required
 * by NIST SP 800-61 Rev. 2 and ISO/IEC 27035:2023.
 */
public class SiemAlertTriageRequest {

    private String analyst;
    private String resolutionNotes;

    public SiemAlertTriageRequest() {
    }

    public String getAnalyst() {
        return analyst;
    }

    public void setAnalyst(String analyst) {
        this.analyst = analyst;
    }

    public String getResolutionNotes() {
        return resolutionNotes;
    }

    public void setResolutionNotes(String resolutionNotes) {
        this.resolutionNotes = resolutionNotes;
    }
}

package com.medtrack.auth.saml2.dto;

public class Saml2AcsConsumeRequest {

    private String samlResponseBase64;
    private String relayState;
    private String idpEntityId;

    public Saml2AcsConsumeRequest() {}

    public String getSamlResponseBase64() { return samlResponseBase64; }
    public void setSamlResponseBase64(String samlResponseBase64) { this.samlResponseBase64 = samlResponseBase64; }

    public String getRelayState() { return relayState; }
    public void setRelayState(String relayState) { this.relayState = relayState; }

    public String getIdpEntityId() { return idpEntityId; }
    public void setIdpEntityId(String idpEntityId) { this.idpEntityId = idpEntityId; }
}

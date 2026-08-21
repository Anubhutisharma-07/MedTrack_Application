package com.medtrack.auth.fido2.dto;

public class Fido2RegistrationRequest {

    private String userId;
    private String authenticatorName;
    private String attestationObjectBase64;
    private String clientDataJsonBase64;

    public Fido2RegistrationRequest() {}

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getAuthenticatorName() { return authenticatorName; }
    public void setAuthenticatorName(String authenticatorName) { this.authenticatorName = authenticatorName; }

    public String getAttestationObjectBase64() { return attestationObjectBase64; }
    public void setAttestationObjectBase64(String attestationObjectBase64) { this.attestationObjectBase64 = attestationObjectBase64; }

    public String getClientDataJsonBase64() { return clientDataJsonBase64; }
    public void setClientDataJsonBase64(String clientDataJsonBase64) { this.clientDataJsonBase64 = clientDataJsonBase64; }
}

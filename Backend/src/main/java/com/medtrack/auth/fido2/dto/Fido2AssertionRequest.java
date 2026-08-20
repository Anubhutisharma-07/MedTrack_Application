package com.medtrack.auth.fido2.dto;

public class Fido2AssertionRequest {

    private String credentialId;
    private String authenticatorDataBase64;
    private String clientDataJsonBase64;
    private String signatureBase64;

    public Fido2AssertionRequest() {}

    public String getCredentialId() { return credentialId; }
    public void setCredentialId(String credentialId) { this.credentialId = credentialId; }

    public String getAuthenticatorDataBase64() { return authenticatorDataBase64; }
    public void setAuthenticatorDataBase64(String authenticatorDataBase64) { this.authenticatorDataBase64 = authenticatorDataBase64; }

    public String getClientDataJsonBase64() { return clientDataJsonBase64; }
    public void setClientDataJsonBase64(String clientDataJsonBase64) { this.clientDataJsonBase64 = clientDataJsonBase64; }

    public String getSignatureBase64() { return signatureBase64; }
    public void setSignatureBase64(String signatureBase64) { this.signatureBase64 = signatureBase64; }
}

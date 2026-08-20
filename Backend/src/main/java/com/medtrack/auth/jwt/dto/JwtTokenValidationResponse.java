package com.medtrack.auth.jwt.dto;

import java.util.List;

public class JwtTokenValidationResponse {

    private boolean valid;
    private String jti;
    private String subject;
    private List<String> roles;
    private String keyId;
    private String signatureAlgorithm;
    private String error;

    public JwtTokenValidationResponse(boolean valid, String jti, String subject, List<String> roles, String keyId, String signatureAlgorithm) {
        this.valid = valid;
        this.jti = jti;
        this.subject = subject;
        this.roles = roles;
        this.keyId = keyId;
        this.signatureAlgorithm = signatureAlgorithm;
    }

    public JwtTokenValidationResponse(boolean valid, String error) {
        this.valid = valid;
        this.error = error;
    }

    public boolean isValid() { return valid; }
    public String getJti() { return jti; }
    public String getSubject() { return subject; }
    public List<String> getRoles() { return roles; }
    public String getKeyId() { return keyId; }
    public String getSignatureAlgorithm() { return signatureAlgorithm; }
    public String getError() { return error; }
}

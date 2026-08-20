package com.medtrack.auth.jwt.dto;

import java.util.List;

public class JwtTokenIssueRequest {

    private String userId;
    private String email;
    private String role;
    private List<String> roles;
    private String audience;
    private String signatureAlgorithm; // RS256 or ES256

    public JwtTokenIssueRequest() {}

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public void setUserId(Long userId) { this.userId = String.valueOf(userId); }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public List<String> getRoles() { return roles; }
    public void setRoles(List<String> roles) { this.roles = roles; }

    public String getAudience() { return audience; }
    public void setAudience(String audience) { this.audience = audience; }

    public String getSignatureAlgorithm() { return signatureAlgorithm; }
    public void setSignatureAlgorithm(String signatureAlgorithm) { this.signatureAlgorithm = signatureAlgorithm; }
}

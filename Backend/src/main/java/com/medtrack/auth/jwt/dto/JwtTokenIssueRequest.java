package com.medtrack.auth.jwt.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

public class JwtTokenIssueRequest {

    @Size(max = 64, message = "userId must be at most 64 characters")
    private String userId;

    @Size(max = 254, message = "email must be at most 254 characters")
    @Email(message = "email must be a valid email address")
    private String email;

    @Size(max = 64, message = "role must be at most 64 characters")
    private String role;

    @Size(max = 16, message = "roles must contain at most 16 entries")
    private List<String> roles;

    @Size(max = 128, message = "audience must be at most 128 characters")
    private String audience;

    @Pattern(regexp = "RS256|ES256", message = "signatureAlgorithm must be RS256 or ES256")
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

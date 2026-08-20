package com.medtrack.auth.jwt.model;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * JwtTokenRecord JPA Entity
 * Represents an issued JWT token with JTI (JWT ID) tracking, key rotation metadata,
 * RS256/ES256 algorithm profiles, and explicit revocation blacklisting.
 */
@Entity
@Table(name = "jwt_token_records")
public class JwtTokenRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String jti; // Unique JWT ID UUID

    @Column(nullable = false)
    private String subjectUserId;

    @Column(nullable = false)
    private String issuer; // e.g. https://medtrack.health/auth

    @Column(nullable = false)
    private String keyId; // Key ID (kid) used for signing

    @Column(nullable = false)
    private String signatureAlgorithm; // RS256, ES256, HS512

    @Column(nullable = false)
    private boolean revoked;

    private String revocationReason;

    @Column(nullable = false)
    private Instant issuedAt;

    @Column(nullable = false)
    private Instant expiresAt;

    public JwtTokenRecord() {}

    public JwtTokenRecord(String jti, String subjectUserId, String issuer, String keyId,
                          String signatureAlgorithm, Instant issuedAt, Instant expiresAt) {
        this.jti = jti;
        this.subjectUserId = subjectUserId;
        this.issuer = issuer;
        this.keyId = keyId;
        this.signatureAlgorithm = signatureAlgorithm;
        this.revoked = false;
        this.issuedAt = issuedAt;
        this.expiresAt = expiresAt;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public String getJti() { return jti; }
    public void setJti(String jti) { this.jti = jti; }

    public String getSubjectUserId() { return subjectUserId; }
    public void setSubjectUserId(String subjectUserId) { this.subjectUserId = subjectUserId; }

    public String getIssuer() { return issuer; }
    public void setIssuer(String issuer) { this.issuer = issuer; }

    public String getKeyId() { return keyId; }
    public void setKeyId(String keyId) { this.keyId = keyId; }

    public String getSignatureAlgorithm() { return signatureAlgorithm; }
    public void setSignatureAlgorithm(String signatureAlgorithm) { this.signatureAlgorithm = signatureAlgorithm; }

    public boolean isRevoked() { return revoked; }
    public void setRevoked(boolean revoked) { this.revoked = revoked; }

    public String getRevocationReason() { return revocationReason; }
    public void setRevocationReason(String revocationReason) { this.revocationReason = revocationReason; }

    public Instant getIssuedAt() { return issuedAt; }
    public void setIssuedAt(Instant issuedAt) { this.issuedAt = issuedAt; }

    public Instant getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }
}

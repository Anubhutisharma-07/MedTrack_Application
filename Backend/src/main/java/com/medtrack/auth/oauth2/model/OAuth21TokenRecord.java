package com.medtrack.auth.oauth2.model;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * OAuth21TokenRecord JPA Entity
 * Represents an active or revoked OAuth 2.1 Token with DPoP (Demonstrating Proof-of-Possession)
 * binding, PKCE code challenge verification, and JWT ID (JTI) tracking.
 */
@Entity
@Table(name = "oauth21_token_records")
public class OAuth21TokenRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String tokenId;

    @Column(nullable = false)
    private String subjectUserId;

    @Column(nullable = false)
    private String clientId;

    @Column(nullable = false)
    private String grantType; // authorization_code, client_credentials, refresh_token

    @Column(nullable = false)
    private String dpopJktHash; // SHA-256 hash of DPoP JWK Thumbprint

    @Column(nullable = false)
    private boolean dpopBound;

    @Column(nullable = false)
    private String pkceCodeChallenge;

    @Column(nullable = false)
    private String pkceCodeChallengeMethod; // S256

    @Column(nullable = false)
    private boolean revoked;

    private String revocationReason;

    @Column(nullable = false)
    private Instant issuedAt;

    @Column(nullable = false)
    private Instant expiresAt;

    public OAuth21TokenRecord() {}

    public OAuth21TokenRecord(String tokenId, String subjectUserId, String clientId, String grantType,
                              String dpopJktHash, boolean dpopBound, String pkceCodeChallenge,
                              String pkceCodeChallengeMethod, Instant issuedAt, Instant expiresAt) {
        this.tokenId = tokenId;
        this.subjectUserId = subjectUserId;
        this.clientId = clientId;
        this.grantType = grantType;
        this.dpopJktHash = dpopJktHash;
        this.dpopBound = dpopBound;
        this.pkceCodeChallenge = pkceCodeChallenge;
        this.pkceCodeChallengeMethod = pkceCodeChallengeMethod;
        this.revoked = false;
        this.issuedAt = issuedAt;
        this.expiresAt = expiresAt;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public String getTokenId() { return tokenId; }
    public void setTokenId(String tokenId) { this.tokenId = tokenId; }

    public String getSubjectUserId() { return subjectUserId; }
    public void setSubjectUserId(String subjectUserId) { this.subjectUserId = subjectUserId; }

    public String getClientId() { return clientId; }
    public void setClientId(String clientId) { this.clientId = clientId; }

    public String getGrantType() { return grantType; }
    public void setGrantType(String grantType) { this.grantType = grantType; }

    public String getDpopJktHash() { return dpopJktHash; }
    public void setDpopJktHash(String dpopJktHash) { this.dpopJktHash = dpopJktHash; }

    public boolean isDpopBound() { return dpopBound; }
    public void setDpopBound(boolean dpopBound) { this.dpopBound = dpopBound; }

    public String getPkceCodeChallenge() { return pkceCodeChallenge; }
    public void setPkceCodeChallenge(String pkceCodeChallenge) { this.pkceCodeChallenge = pkceCodeChallenge; }

    public String getPkceCodeChallengeMethod() { return pkceCodeChallengeMethod; }
    public void setPkceCodeChallengeMethod(String pkceCodeChallengeMethod) { this.pkceCodeChallengeMethod = pkceCodeChallengeMethod; }

    public boolean isRevoked() { return revoked; }
    public void setRevoked(boolean revoked) { this.revoked = revoked; }

    public String getRevocationReason() { return revocationReason; }
    public void setRevocationReason(String revocationReason) { this.revocationReason = revocationReason; }

    public Instant getIssuedAt() { return issuedAt; }
    public void setIssuedAt(Instant issuedAt) { this.issuedAt = issuedAt; }

    public Instant getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }
}

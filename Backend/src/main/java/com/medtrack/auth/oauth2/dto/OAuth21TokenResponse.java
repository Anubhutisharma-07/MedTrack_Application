package com.medtrack.auth.oauth2.dto;

import java.time.Instant;

public class OAuth21TokenResponse {

    private String tokenId;
    private String accessToken;
    private String tokenType; // DPoP or Bearer
    private Long expiresIn;
    private String scope;
    private String dpopJkt;
    private Instant issuedAt;

    public OAuth21TokenResponse(String tokenId, String accessToken, String tokenType, Long expiresIn, String scope, String dpopJkt, Instant issuedAt) {
        this.tokenId = tokenId;
        this.accessToken = accessToken;
        this.tokenType = tokenType;
        this.expiresIn = expiresIn;
        this.scope = scope;
        this.dpopJkt = dpopJkt;
        this.issuedAt = issuedAt;
    }

    public String getTokenId() { return tokenId; }
    public String getAccessToken() { return accessToken; }
    public String getTokenType() { return tokenType; }
    public Long getExpiresIn() { return expiresIn; }
    public String getScope() { return scope; }
    public String getDpopJkt() { return dpopJkt; }
    public Instant getIssuedAt() { return issuedAt; }
}

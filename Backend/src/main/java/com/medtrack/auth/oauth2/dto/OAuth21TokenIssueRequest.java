package com.medtrack.auth.oauth2.dto;

public class OAuth21TokenIssueRequest {

    private String subjectUserId;
    private String clientId;
    private String grantType; // authorization_code
    private String codeVerifier; // PKCE code_verifier
    private String codeChallenge; // PKCE code_challenge
    private String dpopProofHeader; // DPoP JWT Proof Header

    public OAuth21TokenIssueRequest() {}

    public String getSubjectUserId() { return subjectUserId; }
    public void setSubjectUserId(String subjectUserId) { this.subjectUserId = subjectUserId; }

    public String getClientId() { return clientId; }
    public void setClientId(String clientId) { this.clientId = clientId; }

    public String getGrantType() { return grantType; }
    public void setGrantType(String grantType) { this.grantType = grantType; }

    public String getCodeVerifier() { return codeVerifier; }
    public void setCodeVerifier(String codeVerifier) { this.codeVerifier = codeVerifier; }

    public String getCodeChallenge() { return codeChallenge; }
    public void setCodeChallenge(String codeChallenge) { this.codeChallenge = codeChallenge; }

    public String getDpopProofHeader() { return dpopProofHeader; }
    public void setDpopProofHeader(String dpopProofHeader) { this.dpopProofHeader = dpopProofHeader; }
}

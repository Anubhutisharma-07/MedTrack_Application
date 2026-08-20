package com.medtrack.auth.oauth2.controller;

import com.medtrack.auth.oauth2.dto.OAuth21TokenIssueRequest;
import com.medtrack.auth.oauth2.dto.OAuth21TokenResponse;
import com.medtrack.auth.oauth2.model.OAuth21TokenRecord;
import com.medtrack.auth.oauth2.service.OAuth21TokenSecurityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * OAuth21TokenSecurityController
 * Spring Boot REST Controller exposing OAuth 2.1 Security Gateway Endpoints:
 * 1. POST /api/auth/oauth21/token - Issue DPoP & PKCE bound OAuth 2.1 token
 * 2. POST /api/auth/oauth21/introspect - Verify DPoP proof and active token status
 * 3. POST /api/auth/oauth21/revoke - Revoke token and blacklist JTI
 * 4. GET /api/auth/oauth21/user-tokens - List active tokens for user
 * 5. GET /api/auth/oauth21/spec-standards - OAuth 2.1 RFC 9700 BCP Standards
 */
@RestController
@RequestMapping("/api/auth/oauth21")
public class OAuth21TokenSecurityController {

    private final OAuth21TokenSecurityService oauthService;

    @Autowired
    public OAuth21TokenSecurityController(OAuth21TokenSecurityService oauthService) {
        this.oauthService = oauthService;
    }

    /**
     * Issue OAuth 2.1 Access Token (Enforces PKCE S256 & DPoP Binding)
     */
    @PostMapping("/token")
    public ResponseEntity<?> issueToken(@RequestBody OAuth21TokenIssueRequest request) {
        try {
            OAuth21TokenResponse response = oauthService.issueOAuth21Token(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "invalid_grant");
            error.put("error_description", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    /**
     * Introspect & Validate Token DPoP Proof
     */
    @PostMapping("/introspect")
    public ResponseEntity<?> introspectToken(
            @RequestParam String tokenId,
            @RequestHeader(value = "DPoP", required = false) String dpopHeader) {
        try {
            boolean valid = oauthService.validateDpopTokenIngress(tokenId, dpopHeader);
            Map<String, Object> result = new HashMap<>();
            result.put("active", valid);
            result.put("tokenId", tokenId);
            result.put("dpopVerified", valid);
            result.put("compliance", "RFC 9700 OAuth 2.1 BCP");
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> result = new HashMap<>();
            result.put("active", false);
            result.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(result);
        }
    }

    /**
     * Revoke Token & Blacklist JTI
     */
    @PostMapping("/revoke")
    public ResponseEntity<?> revokeToken(
            @RequestParam String tokenId,
            @RequestParam(required = false, defaultValue = "REVOKED_BY_USER") String reason) {
        try {
            oauthService.revokeToken(tokenId, reason);
            Map<String, String> response = new HashMap<>();
            response.put("status", "SUCCESS");
            response.put("message", "Token " + tokenId + " revoked successfully.");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "revocation_failed");
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    /**
     * Get Active User Tokens
     */
    @GetMapping("/user-tokens")
    public ResponseEntity<List<OAuth21TokenRecord>> getUserTokens(
            @RequestParam(defaultValue = "user-medtrack-admin") String userId) {
        List<OAuth21TokenRecord> tokens = oauthService.getActiveTokensForUser(userId);
        return ResponseEntity.ok(tokens);
    }

    /**
     * Get OAuth 2.1 Security Standards
     */
    @GetMapping("/spec-standards")
    public ResponseEntity<?> getStandards() {
        Map<String, Object> standards = new HashMap<>();
        standards.put("specification", "RFC 9700 OAuth 2.1 Security Best Current Practice");
        standards.put("pkceRequirement", "Mandatory S256 Code Challenge for ALL Clients (Public & Confidential)");
        standards.put("dpopRequirement", "RFC 9449 Demonstrating Proof-of-Possession at the Application Layer");
        standards.put("implicitGrantState", "OMITTED & DEPRECATED (Disallowed in OAuth 2.1)");
        standards.put("resourceOwnerPasswordGrantState", "OMITTED & DEPRECATED (Disallowed in OAuth 2.1)");
        return ResponseEntity.ok(standards);
    }
}

package com.medtrack.auth.jwt.controller;

import com.medtrack.auth.jwt.dto.JwtTokenIssueRequest;
import com.medtrack.auth.jwt.dto.JwtTokenValidationResponse;
import com.medtrack.auth.jwt.service.JwtSecurityTokenService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * JwtSecurityTokenController
 * Spring Boot REST Controller exposing RFC 7519 JWT Endpoints:
 * 1. POST /api/auth/jwt/token - Issue cryptographically signed RS256/ES256 token
 * 2. POST /api/auth/jwt/validate - Validate JWT signature and JTI revocation status
 * 3. POST /api/auth/jwt/revoke - Revoke/blacklist JTI token
 * 4. POST /api/auth/jwt/rotate-key - Rotate cryptographic signing Key ID (`kid`)
 * 5. GET /api/auth/jwt/.well-known/jwks.json - Expose RFC 7517 JWKS Public Key Set
 * 6. GET /api/auth/jwt/audit-metrics - Expose JWT security compliance metrics
 */
@RestController
@RequestMapping("/api/auth/jwt")
public class JwtSecurityTokenController {

    private final JwtSecurityTokenService jwtService;

    @Autowired
    public JwtSecurityTokenController(JwtSecurityTokenService jwtService) {
        this.jwtService = jwtService;
    }

    /**
     * Issue JWT Token
     */
    @PostMapping("/token")
    public ResponseEntity<?> issueToken(@RequestBody JwtTokenIssueRequest request) {
        try {
            Map<String, Object> tokenResponse = jwtService.issueJwtToken(request);
            return ResponseEntity.ok(tokenResponse);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "token_issuance_failed");
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    /**
     * Validate JWT JTI & Signature
     */
    @PostMapping("/validate")
    public ResponseEntity<JwtTokenValidationResponse> validateToken(@RequestParam String jti) {
        JwtTokenValidationResponse response = jwtService.validateJwtToken(jti);
        if (!response.isValid()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }
        return ResponseEntity.ok(response);
    }

    /**
     * Revoke / Blacklist JTI Token
     */
    @PostMapping("/revoke")
    public ResponseEntity<?> revokeToken(
            @RequestParam String jti,
            @RequestParam(required = false, defaultValue = "LOGOUT") String reason) {
        try {
            jwtService.revokeJwtToken(jti, reason);
            Map<String, String> response = new HashMap<>();
            response.put("status", "SUCCESS");
            response.put("message", "JTI " + jti + " blacklisted successfully.");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "revocation_failed");
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    /**
     * Rotate Signing Key ID (`kid`)
     */
    @PostMapping("/rotate-key")
    public ResponseEntity<Map<String, String>> rotateKey() {
        Map<String, String> result = jwtService.rotateSigningKey();
        return ResponseEntity.ok(result);
    }

    /**
     * JWKS Public Key Discovery Endpoint (RFC 7517)
     */
    @GetMapping("/.well-known/jwks.json")
    public ResponseEntity<Map<String, Object>> getJwks() {
        Map<String, Object> jwks = jwtService.getJwksKeys();
        return ResponseEntity.ok(jwks);
    }

    /**
     * Get JWT Security Audit Metrics
     */
    @GetMapping("/audit-metrics")
    public ResponseEntity<Map<String, Object>> getAuditMetrics() {
        Map<String, Object> metrics = jwtService.getJwtAuditMetrics();
        return ResponseEntity.ok(metrics);
    }

    /**
     * Purge Expired JWT Tokens
     */
    @DeleteMapping("/purge-expired")
    public ResponseEntity<Map<String, Object>> purgeExpiredTokens() {
        int purgedCount = jwtService.purgeExpiredTokens();
        Map<String, Object> result = new HashMap<>();
        result.put("status", "SUCCESS");
        result.put("purgedTokenCount", purgedCount);
        return ResponseEntity.ok(result);
    }
}


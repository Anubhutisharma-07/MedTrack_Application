package com.medtrack.auth.fido2.controller;

import com.medtrack.auth.fido2.dto.Fido2AssertionRequest;
import com.medtrack.auth.fido2.dto.Fido2RegistrationRequest;
import com.medtrack.auth.fido2.model.Fido2WebAuthnRecord;
import com.medtrack.auth.fido2.service.Fido2WebAuthnService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Fido2WebAuthnController
 * Spring Boot REST Controller exposing FIDO2 WebAuthn Passkey Endpoints:
 * 1. POST /api/auth/fido2/register-challenge - Generate registration challenge
 * 2. POST /api/auth/fido2/register-complete - Register COSE public key
 * 3. POST /api/auth/fido2/authenticate - Verify biometric assertion & sign counter
 * 4. GET /api/auth/fido2/authenticators - List user registered passkeys
 * 5. GET /api/auth/fido2/audit-metrics - WebAuthn compliance audit metrics
 */
@RestController
@RequestMapping("/api/auth/fido2")
public class Fido2WebAuthnController {

    private final Fido2WebAuthnService fidoService;

    @Autowired
    public Fido2WebAuthnController(Fido2WebAuthnService fidoService) {
        this.fidoService = fidoService;
    }

    /**
     * Generate Registration Challenge
     */
    @PostMapping("/register-challenge")
    public ResponseEntity<Map<String, Object>> getRegistrationChallenge(
            @RequestParam(defaultValue = "user-medtrack-doctor") String userId) {
        Map<String, Object> challenge = fidoService.generateRegistrationChallenge(userId);
        return ResponseEntity.ok(challenge);
    }

    /**
     * Complete Passkey Registration
     */
    @PostMapping("/register-complete")
    public ResponseEntity<?> completeRegistration(@RequestBody Fido2RegistrationRequest request) {
        try {
            Fido2WebAuthnRecord record = fidoService.registerCredential(request);
            return ResponseEntity.ok(record);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "registration_failed");
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    /**
     * Authenticate FIDO2 Assertion
     */
    @PostMapping("/authenticate")
    public ResponseEntity<?> authenticateAssertion(@RequestBody Fido2AssertionRequest request) {
        try {
            Map<String, Object> result = fidoService.verifyAssertion(request);
            return ResponseEntity.ok(result);
        } catch (IllegalStateException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "clone_detected");
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "authentication_failed");
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    /**
     * Get User Registered Passkeys
     */
    @GetMapping("/authenticators")
    public ResponseEntity<List<Fido2WebAuthnRecord>> getUserAuthenticators(
            @RequestParam(defaultValue = "user-medtrack-doctor") String userId) {
        List<Fido2WebAuthnRecord> records = fidoService.getUserAuthenticators(userId);
        return ResponseEntity.ok(records);
    }

    /**
     * Get Audit Metrics
     */
    @GetMapping("/audit-metrics")
    public ResponseEntity<Map<String, Object>> getAuditMetrics() {
        Map<String, Object> metrics = fidoService.getWebAuthnAuditMetrics();
        return ResponseEntity.ok(metrics);
    }

    /**
     * Revoke Passkey Credential
     */
    @DeleteMapping("/credentials/{credentialId}")
    public ResponseEntity<?> revokeCredential(
            @PathVariable String credentialId,
            @RequestParam(defaultValue = "USER_REQUESTED") String reason) {
        try {
            fidoService.revokeCredential(credentialId, reason);
            Map<String, String> response = new HashMap<>();
            response.put("status", "SUCCESS");
            response.put("message", "Passkey " + credentialId + " revoked successfully.");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "revocation_failed");
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    /**
     * Get WebAuthn Specifications & FIDO Alliance Metadata
     */
    @GetMapping("/spec-standards")
    public ResponseEntity<Map<String, Object>> getSpecStandards() {
        Map<String, Object> specs = new HashMap<>();
        specs.put("webAuthnVersion", "W3C WebAuthn Level 3 Recommendation");
        specs.put("fidoVersion", "FIDO2 / CTAP2.1 Protocol Specification");
        specs.put("algorithms", List.of("ES256 (ECDSA P-256)", "RS256 (RSA 2048)", "EdDSA (Ed25519)"));
        specs.put("userVerificationRequirement", "REQUIRED (Biometric TouchID/FaceID or PIN)");
        specs.put("residentKeySupport", "PREFERRED (Discoverable Credentials)");
        return ResponseEntity.ok(specs);
    }
}


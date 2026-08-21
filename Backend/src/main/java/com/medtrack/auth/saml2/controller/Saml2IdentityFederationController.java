package com.medtrack.auth.saml2.controller;

import com.medtrack.auth.saml2.dto.Saml2AcsConsumeRequest;
import com.medtrack.auth.saml2.dto.Saml2IdpRegistrationRequest;
import com.medtrack.auth.saml2.model.Saml2IdentityProviderRecord;
import com.medtrack.auth.saml2.service.Saml2IdentityFederationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Saml2IdentityFederationController
 * Spring Boot REST Controller exposing SAML 2.0 Identity Federation Endpoints:
 * 1. GET /api/auth/saml2/sp-metadata - Service Provider XML Metadata
 * 2. POST /api/auth/saml2/register-idp - Register Enterprise Identity Provider
 * 3. GET /api/auth/saml2/sso-login - Generate AuthnRequest URL for SP-Initiated SSO
 * 4. POST /api/auth/saml2/acs - Assertion Consumer Service (ACS) Endpoint
 * 5. GET /api/auth/saml2/idps - List registered IdPs
 */
@RestController
@RequestMapping("/api/auth/saml2")
public class Saml2IdentityFederationController {

    private final Saml2IdentityFederationService samlService;

    @Autowired
    public Saml2IdentityFederationController(Saml2IdentityFederationService samlService) {
        this.samlService = samlService;
    }

    /**
     * Get SP Metadata XML
     */
    @GetMapping(value = "/sp-metadata", produces = MediaType.APPLICATION_XML_VALUE)
    public ResponseEntity<String> getSpMetadataXml() {
        String metadataXml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n" +
                "<md:EntityDescriptor xmlns:md=\"urn:oasis:names:tc:SAML:2.0:metadata\" entityID=\"https://medtrack.health/saml2/sp/metadata\">\n" +
                "  <md:SPSSODescriptor AuthnRequestsSigned=\"true\" WantAssertionsSigned=\"true\" protocolSupportEnumeration=\"urn:oasis:names:tc:SAML:2.0:protocol\">\n" +
                "    <md:NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</md:NameIDFormat>\n" +
                "    <md:AssertionConsumerService Binding=\"urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST\" Location=\"https://medtrack.health/api/auth/saml2/acs\" index=\"1\" isDefault=\"true\"/>\n" +
                "  </md:SPSSODescriptor>\n" +
                "</md:EntityDescriptor>";
        return ResponseEntity.ok(metadataXml);
    }

    /**
     * Register New Enterprise Identity Provider
     */
    @PostMapping("/register-idp")
    public ResponseEntity<?> registerIdp(@RequestBody Saml2IdpRegistrationRequest request) {
        try {
            Saml2IdentityProviderRecord record = samlService.registerIdp(request);
            return ResponseEntity.ok(record);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "idp_registration_failed");
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    /**
     * Generate AuthnRequest Redirect URL for SP-Initiated SSO Login
     */
    @GetMapping("/sso-login")
    public ResponseEntity<?> getSsoLoginUrl(
            @RequestParam(defaultValue = "https://idp.mayoclinic.org/saml2/metadata") String idpEntityId,
            @RequestParam(required = false) String relayState) {
        try {
            Map<String, String> redirectInfo = samlService.generateAuthnRequestRedirect(idpEntityId, relayState);
            return ResponseEntity.ok(redirectInfo);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "sso_initiating_failed");
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    /**
     * Assertion Consumer Service (ACS) Endpoint
     */
    @PostMapping("/acs")
    public ResponseEntity<?> consumeAcsResponse(@RequestBody Saml2AcsConsumeRequest request) {
        try {
            Map<String, Object> result = samlService.consumeAcsResponse(request);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "acs_consumption_failed");
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        }
    }

    /**
     * List Registered Identity Providers
     */
    @GetMapping("/idps")
    public ResponseEntity<List<Saml2IdentityProviderRecord>> getIdps() {
        List<Saml2IdentityProviderRecord> idps = samlService.getActiveIdentityProviders();
        return ResponseEntity.ok(idps);
    }

    /**
     * SAML 2.0 Single Logout (SLO) Endpoint
     */
    @GetMapping("/slo-logout")
    public ResponseEntity<?> initiateSingleLogout(
            @RequestParam String idpEntityId,
            @RequestParam String nameId) {
        try {
            Map<String, String> logoutInfo = samlService.generateSingleLogoutRequest(idpEntityId, nameId);
            return ResponseEntity.ok(logoutInfo);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "slo_failed");
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    /**
     * Get SAML 2.0 Audit Metrics
     */
    @GetMapping("/audit-metrics")
    public ResponseEntity<Map<String, Object>> getAuditMetrics() {
        Map<String, Object> metrics = samlService.getSaml2AuditMetrics();
        return ResponseEntity.ok(metrics);
    }
}


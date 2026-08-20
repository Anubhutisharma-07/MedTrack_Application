package com.medtrack.auth.scim.controller;

import com.medtrack.auth.scim.dto.ScimListResponseDto;
import com.medtrack.auth.scim.dto.ScimUserDto;
import com.medtrack.auth.scim.service.ScimUserProvisioningService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.NoSuchElementException;

/**
 * ScimUserProvisioningController
 * Spring Boot REST Controller exposing RFC 7644 SCIM 2.0 Endpoints with `application/scim+json` media type:
 * 1. POST /api/scim/v2/Users - Provision new user
 * 2. GET /api/scim/v2/Users - Search / List users
 * 3. GET /api/scim/v2/Users/{id} - Get user by ID
 * 4. PUT /api/scim/v2/Users/{id} - Replace user
 * 5. DELETE /api/scim/v2/Users/{id} - Deprovision user
 * 6. GET /api/scim/v2/ServiceProviderConfig - RFC 7644 Service Provider Capability Spec
 */
@RestController
@RequestMapping("/api/scim/v2")
public class ScimUserProvisioningController {

    private final ScimUserProvisioningService scimService;

    @Autowired
    public ScimUserProvisioningController(ScimUserProvisioningService scimService) {
        this.scimService = scimService;
    }

    /**
     * Create / Provision New SCIM User
     */
    @PostMapping(value = "/Users", produces = "application/scim+json", consumes = "application/scim+json")
    public ResponseEntity<?> createScimUser(@RequestBody ScimUserDto request) {
        try {
            ScimUserDto created = scimService.createScimUser(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("schemas", Map.of("urn:ietf:params:scim:api:messages:2.0:Error", "Error"));
            error.put("status", "400");
            error.put("detail", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    /**
     * Search / List SCIM Users
     */
    @GetMapping(value = "/Users", produces = "application/scim+json")
    public ResponseEntity<ScimListResponseDto<ScimUserDto>> getScimUsers(
            @RequestParam(defaultValue = "1") int startIndex,
            @RequestParam(defaultValue = "100") int count) {
        ScimListResponseDto<ScimUserDto> response = scimService.searchScimUsers(startIndex, count);
        return ResponseEntity.ok(response);
    }

    /**
     * Get SCIM User by ID
     */
    @GetMapping(value = "/Users/{scimId}", produces = "application/scim+json")
    public ResponseEntity<?> getScimUserById(@PathVariable String scimId) {
        try {
            ScimUserDto dto = scimService.getScimUserById(scimId);
            return ResponseEntity.ok(dto);
        } catch (NoSuchElementException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("schemas", Map.of("urn:ietf:params:scim:api:messages:2.0:Error", "Error"));
            error.put("status", "404");
            error.put("detail", "SCIM User resource not found");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        }
    }

    /**
     * Update / Replace SCIM User
     */
    @PutMapping(value = "/Users/{scimId}", produces = "application/scim+json", consumes = "application/scim+json")
    public ResponseEntity<?> updateScimUser(@PathVariable String scimId, @RequestBody ScimUserDto request) {
        try {
            ScimUserDto updated = scimService.updateScimUser(scimId, request);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("schemas", Map.of("urn:ietf:params:scim:api:messages:2.0:Error", "Error"));
            error.put("status", "400");
            error.put("detail", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    /**
     * De-provision SCIM User (DELETE)
     */
    @DeleteMapping("/Users/{scimId}")
    public ResponseEntity<?> deleteScimUser(@PathVariable String scimId) {
        try {
            scimService.deleteScimUser(scimId);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * RFC 7644 Service Provider Configuration Endpoint
     */
    @GetMapping(value = "/ServiceProviderConfig", produces = "application/scim+json")
    public ResponseEntity<Map<String, Object>> getServiceProviderConfig() {
        Map<String, Object> config = new HashMap<>();
        config.put("schemas", Map.of("urn:ietf:params:scim:schemas:core:2.0:ServiceProviderConfig", "Config"));
        config.put("documentationUri", "https://medtrack.health/docs/scim2");
        config.put("patch", Map.of("supported", true));
        config.put("bulk", Map.of("supported", false));
        config.put("filter", Map.of("supported", true, "maxResults", 500));
        config.put("changePassword", Map.of("supported", false));
        config.put("sort", Map.of("supported", true));
        config.put("etag", Map.of("supported", false));
        config.put("authenticationSchemes", Map.of(
                "name", "OAuth Bearer Token",
                "description", "Authentication scheme using OAuth 2.0 Bearer tokens",
                "type", "oauthbearertoken"
        ));
        return ResponseEntity.ok(config);
    }
}

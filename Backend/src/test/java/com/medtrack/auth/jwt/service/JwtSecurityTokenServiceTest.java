package com.medtrack.auth.jwt.service;

import com.medtrack.auth.jwt.dto.JwtTokenIssueRequest;
import com.medtrack.auth.jwt.dto.JwtTokenValidationResponse;
import com.medtrack.auth.jwt.model.JwtTokenRecord;
import com.medtrack.auth.jwt.repository.JwtTokenRecordRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link JwtSecurityTokenService} verifying issue #1485:
 * real RS256-signed tokens instead of fabricated strings, unknown JTIs validate as invalid,
 * and the JWKS endpoint exposes the actual RSA public key material.
 */
@ExtendWith(MockitoExtension.class)
public class JwtSecurityTokenServiceTest {

    @Mock
    private JwtTokenRecordRepository tokenRepository;

    @InjectMocks
    private JwtSecurityTokenService jwtService;

    @BeforeEach
    void setUp() {
        jwtService.initializeSigningKeys();
    }

    @Test
    void issueTokenReturnsRealSignedJwt() {
        when(tokenRepository.save(any(JwtTokenRecord.class))).thenAnswer(invocation -> invocation.getArgument(0));

        JwtTokenIssueRequest request = new JwtTokenIssueRequest();
        request.setUserId("42");
        request.setRole("SECURITY_HUB");

        Map<String, Object> response = jwtService.issueJwtToken(request);

        String accessToken = (String) response.get("accessToken");
        assertNotNull(accessToken);
        String[] parts = accessToken.split("\\.");
        assertEquals(3, parts.length, "a real JWT must have header.payload.signature parts");
        assertFalse(accessToken.contains("I..."), "token must not be the fabricated stub string");
        assertFalse(accessToken.contains("eyJhbGciOiJSUzI1NiIsImtpZCI6Ii"), "token must not reuse the stub header");
        assertNotNull(response.get("jti"));
        assertEquals("RS256", jwtService.inspectTokenHeader(accessToken).get("alg"));
    }

    @Test
    void issueTokenRejectsUnsupportedAlgorithm() {
        JwtTokenIssueRequest request = new JwtTokenIssueRequest();
        request.setSignatureAlgorithm("ES256");

        org.junit.jupiter.api.Assertions.assertThrows(IllegalArgumentException.class,
                () -> jwtService.issueJwtToken(request));
    }

    @Test
    void validateJwtTokenRejectsUnknownJti() {
        when(tokenRepository.findByJti("never-issued-jti")).thenReturn(Optional.empty());

        JwtTokenValidationResponse response = jwtService.validateJwtToken("never-issued-jti");

        assertFalse(response.isValid(), "unknown JTIs must not validate as valid");
        assertTrue(response.getError().toLowerCase().contains("unknown"));
    }

    @Test
    void validateJwtTokenAcceptsActiveIssuedToken() {
        JwtTokenRecord record = new JwtTokenRecord(
                "jti_known", "42", "https://medtrack.health/auth", "kid_2026_rsa_001",
                "RS256", Instant.now().minusSeconds(60), Instant.now().plusSeconds(1700));
        when(tokenRepository.findByJti("jti_known")).thenReturn(Optional.of(record));

        JwtTokenValidationResponse response = jwtService.validateJwtToken("jti_known");

        assertTrue(response.isValid());
        assertEquals("42", response.getSubject());
    }

    @Test
    void isJtiRevokedFalseForUnrecordedJti() {
        when(tokenRepository.findByJti("session-jti")).thenReturn(Optional.empty());

        assertFalse(jwtService.isJtiRevoked("session-jti"),
                "regular session JWTs not in the gateway ledger must not be treated as revoked");
    }

    @Test
    void isJtiRevokedTrueForRevokedGatewayToken() {
        JwtTokenRecord record = new JwtTokenRecord(
                "jti_revoked", "42", "https://medtrack.health/auth", "kid_2026_rsa_001",
                "RS256", Instant.now().minusSeconds(60), Instant.now().plusSeconds(1700));
        record.setRevoked(true);
        when(tokenRepository.findByJti("jti_revoked")).thenReturn(Optional.of(record));

        assertTrue(jwtService.isJtiRevoked("jti_revoked"));
    }

    @Test
    void jwksExposesRealRsaModulusAndExponent() {
        Map<String, Object> jwks = jwtService.getJwksKeys();

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> keys = (List<Map<String, Object>>) jwks.get("keys");
        assertNotNull(keys);
        assertFalse(keys.isEmpty());

        Map<String, Object> key = keys.get(0);
        assertTrue(key.containsKey("n"));
        assertTrue(key.containsKey("e"));
        assertEquals("RSA", key.get("kty"));
        assertEquals("RS256", key.get("alg"));
        assertFalse(((String) key.get("n")).contains("u1W...M4"), "JWKS must not expose the fake modulus");
    }
}
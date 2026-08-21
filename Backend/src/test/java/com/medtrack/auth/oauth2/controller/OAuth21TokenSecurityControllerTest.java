package com.medtrack.auth.oauth2.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medtrack.auth.oauth2.dto.OAuth21TokenIssueRequest;
import com.medtrack.auth.oauth2.dto.OAuth21TokenResponse;
import com.medtrack.auth.oauth2.model.OAuth21TokenRecord;
import com.medtrack.auth.oauth2.service.OAuth21TokenSecurityService;
import com.medtrack.auth.security.OwnershipAccessGuard;
import com.medtrack.exception.GlobalExceptionHandler;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Unit tests for {@link OAuth21TokenSecurityController} verifying the IDOR fix:
 * a caller may only list, introspect or revoke their own OAuth 2.1 tokens unless they
 * hold the HOSPITAL administrator role.
 */
@ExtendWith(MockitoExtension.class)
public class OAuth21TokenSecurityControllerTest {

    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private OAuth21TokenSecurityService oauthService;

    @Mock
    private OwnershipAccessGuard ownershipAccessGuard;

    @InjectMocks
    private OAuth21TokenSecurityController oauthController;

    private final Authentication technician = new UsernamePasswordAuthenticationToken(
            "technician@medtrack.org", null, List.of(new SimpleGrantedAuthority("ROLE_TECHNICIAN")));

    private final Authentication hospitalAdmin = new UsernamePasswordAuthenticationToken(
            "admin@medtrack.org", null, List.of(new SimpleGrantedAuthority("ROLE_HOSPITAL")));

    private OAuth21TokenRecord tokenRecord;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(oauthController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        tokenRecord = new OAuth21TokenRecord(
                "oauth21_tok_victim123",
                "99",
                "medtrack-web-portal",
                "authorization_code",
                "sha256_jkt_hash",
                true,
                "S256_CHALLENGE",
                "S256",
                Instant.now(),
                Instant.now().plusSeconds(3600));
    }

    @Test
    void getUserTokens_nonAdminRequestingForeignUser_isForbidden() throws Exception {
        when(ownershipAccessGuard.getCallerUserId(technician)).thenReturn(50L);
        when(ownershipAccessGuard.isHospitalAdmin(technician)).thenReturn(false);

        mockMvc.perform(get("/api/auth/oauth21/user-tokens")
                        .param("userId", "99")
                        .principal(technician))
                .andExpect(status().isForbidden());

        verify(oauthService, never()).getActiveTokensForUser(anyString());
    }

    @Test
    void getUserTokens_nonAdminListingOwnTokens_isAllowed() throws Exception {
        when(ownershipAccessGuard.getCallerUserId(technician)).thenReturn(50L);
        when(ownershipAccessGuard.isHospitalAdmin(technician)).thenReturn(false);
        when(oauthService.getActiveTokensForUser("50")).thenReturn(List.of(tokenRecord));

        mockMvc.perform(get("/api/auth/oauth21/user-tokens")
                        .principal(technician))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].tokenId").value("oauth21_tok_victim123"));
    }

    @Test
    void getUserTokens_nonAdminRequestingOwnUserId_isAllowed() throws Exception {
        when(ownershipAccessGuard.getCallerUserId(technician)).thenReturn(50L);
        when(ownershipAccessGuard.isHospitalAdmin(technician)).thenReturn(false);
        when(oauthService.getActiveTokensForUser("50")).thenReturn(List.of(tokenRecord));

        mockMvc.perform(get("/api/auth/oauth21/user-tokens")
                        .param("userId", "50")
                        .principal(technician))
                .andExpect(status().isOk());
    }

    @Test
    void getUserTokens_adminMayListAnyUser() throws Exception {
        when(ownershipAccessGuard.getCallerUserId(hospitalAdmin)).thenReturn(1L);
        when(ownershipAccessGuard.isHospitalAdmin(hospitalAdmin)).thenReturn(true);
        when(oauthService.getActiveTokensForUser("99")).thenReturn(List.of(tokenRecord));

        mockMvc.perform(get("/api/auth/oauth21/user-tokens")
                        .param("userId", "99")
                        .principal(hospitalAdmin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].subjectUserId").value("99"));
    }

    @Test
    void revokeToken_nonAdminRevokingForeignToken_isForbidden() throws Exception {
        when(oauthService.findTokenById("oauth21_tok_victim123")).thenReturn(tokenRecord);
        doThrow(new AccessDeniedException("Not authorized"))
                .when(ownershipAccessGuard).assertSelfOrHospitalAdmin(any(), anyString());

        mockMvc.perform(post("/api/auth/oauth21/revoke")
                        .param("tokenId", "oauth21_tok_victim123")
                        .principal(technician))
                .andExpect(status().isForbidden());

        verify(oauthService, never()).revokeToken(anyString(), anyString());
    }

    @Test
    void revokeToken_nonAdminRevokingOwnToken_isAllowed() throws Exception {
        OAuth21TokenRecord ownToken = new OAuth21TokenRecord(
                "oauth21_tok_own123", "50", "medtrack-web-portal", "authorization_code",
                "sha256_jkt_hash", true, "S256_CHALLENGE", "S256",
                Instant.now(), Instant.now().plusSeconds(3600));
        when(oauthService.findTokenById("oauth21_tok_own123")).thenReturn(ownToken);

        mockMvc.perform(post("/api/auth/oauth21/revoke")
                        .param("tokenId", "oauth21_tok_own123")
                        .principal(technician))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUCCESS"));

        verify(oauthService).revokeToken("oauth21_tok_own123", "REVOKED_BY_USER");
    }

    @Test
    void revokeToken_adminMayRevokeAnyToken() throws Exception {
        when(oauthService.findTokenById("oauth21_tok_victim123")).thenReturn(tokenRecord);

        mockMvc.perform(post("/api/auth/oauth21/revoke")
                        .param("tokenId", "oauth21_tok_victim123")
                        .principal(hospitalAdmin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUCCESS"));

        verify(oauthService).revokeToken(eq("oauth21_tok_victim123"), anyString());
    }

    @Test
    void revokeToken_unknownToken_returnsBadRequest() throws Exception {
        when(oauthService.findTokenById("oauth21_tok_missing"))
                .thenThrow(new IllegalArgumentException("Invalid OAuth 2.1 Token ID"));

        mockMvc.perform(post("/api/auth/oauth21/revoke")
                        .param("tokenId", "oauth21_tok_missing")
                        .principal(hospitalAdmin))
                .andExpect(status().isBadRequest());
    }

    @Test
    void introspectToken_nonAdminIntrospectingForeignToken_isForbidden() throws Exception {
        when(oauthService.findTokenById("oauth21_tok_victim123")).thenReturn(tokenRecord);
        doThrow(new AccessDeniedException("Not authorized"))
                .when(ownershipAccessGuard).assertSelfOrHospitalAdmin(any(), anyString());

        mockMvc.perform(post("/api/auth/oauth21/introspect")
                        .param("tokenId", "oauth21_tok_victim123")
                        .principal(technician))
                .andExpect(status().isForbidden());
    }

    @Test
    void introspectToken_adminMayIntrospectAnyToken() throws Exception {
        when(oauthService.findTokenById("oauth21_tok_victim123")).thenReturn(tokenRecord);
        when(oauthService.validateDpopTokenIngress("oauth21_tok_victim123", null)).thenReturn(true);

        mockMvc.perform(post("/api/auth/oauth21/introspect")
                        .param("tokenId", "oauth21_tok_victim123")
                        .principal(hospitalAdmin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active").value(true))
                .andExpect(jsonPath("$.dpopVerified").value(true));
    }

    @Test
    void issueToken_nonAdminSubjectIsForcedToCaller() throws Exception {
        when(ownershipAccessGuard.isHospitalAdmin(technician)).thenReturn(false);
        when(ownershipAccessGuard.getCallerUserId(technician)).thenReturn(50L);
        when(oauthService.issueOAuth21Token(any())).thenAnswer(invocation -> {
            OAuth21TokenIssueRequest req = invocation.getArgument(0);
            return new OAuth21TokenResponse(
                    "oauth21_tok_new123", "dpop_at_new123", "DPoP", 3600L,
                    "read:ehr write:ehr openid profile", "sha256_jkt_hash", Instant.now());
        });

        OAuth21TokenIssueRequest request = new OAuth21TokenIssueRequest();
        request.setSubjectUserId("user-medtrack-admin");
        request.setClientId("medtrack-web-portal");

        mockMvc.perform(post("/api/auth/oauth21/token")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request))
                        .principal(technician))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tokenId").value("oauth21_tok_new123"));

        ArgumentCaptor<OAuth21TokenIssueRequest> captor = ArgumentCaptor.forClass(OAuth21TokenIssueRequest.class);
        verify(oauthService).issueOAuth21Token(captor.capture());
        assertEquals("50", captor.getValue().getSubjectUserId());
    }

    @Test
    void issueToken_adminMaySpecifySubject() throws Exception {
        when(ownershipAccessGuard.isHospitalAdmin(hospitalAdmin)).thenReturn(true);
        when(oauthService.issueOAuth21Token(any())).thenAnswer(invocation -> {
            OAuth21TokenIssueRequest req = invocation.getArgument(0);
            return new OAuth21TokenResponse(
                    "oauth21_tok_new456", "dpop_at_new456", "DPoP", 3600L,
                    "read:ehr write:ehr openid profile", "sha256_jkt_hash", Instant.now());
        });

        OAuth21TokenIssueRequest request = new OAuth21TokenIssueRequest();
        request.setSubjectUserId("99");
        request.setClientId("medtrack-web-portal");

        mockMvc.perform(post("/api/auth/oauth21/token")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request))
                        .principal(hospitalAdmin))
                .andExpect(status().isOk());

        ArgumentCaptor<OAuth21TokenIssueRequest> captor = ArgumentCaptor.forClass(OAuth21TokenIssueRequest.class);
        verify(oauthService).issueOAuth21Token(captor.capture());
        assertEquals("99", captor.getValue().getSubjectUserId());
    }
}
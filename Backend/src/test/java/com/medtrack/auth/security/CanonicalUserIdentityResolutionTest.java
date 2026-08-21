package com.medtrack.auth.security;

import com.medtrack.auth.model.AccountStatus;
import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.config.PaginationConfig;
import com.medtrack.controller.AnalyticsController;
import com.medtrack.controller.OperationsEventController;
import com.medtrack.dto.EquipmentFailureRiskDto;
import com.medtrack.dto.HospitalAnalyticsDto;
import com.medtrack.dto.NotificationPreferenceResponse;
import com.medtrack.exception.ResourceNotFoundException;
import com.medtrack.model.Hospital;
import com.medtrack.repository.EventReadReceiptRepository;
import com.medtrack.repository.HospitalRepository;
import com.medtrack.repository.NotificationPreferenceRepository;
import com.medtrack.repository.OperationsEventRepository;
import com.medtrack.service.AnalyticsService;
import com.medtrack.service.NotificationPreferenceService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.socket.WebSocketSession;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit test suite verifying canonical user identity resolution (username lookup with email fallback)
 * across NotificationPreferenceService, OperationsEventController, AnalyticsController, and EventStreamAccessGuard.
 */
@ExtendWith(MockitoExtension.class)
class CanonicalUserIdentityResolutionTest {

    @Mock private UserRepository userRepository;
    @Mock private HospitalRepository hospitalRepository;
    @Mock private NotificationPreferenceRepository preferenceRepository;
    @Mock private OperationsEventRepository eventRepository;
    @Mock private EventReadReceiptRepository readReceiptRepository;
    @Mock private AnalyticsService analyticsService;
    @Mock private Authentication authentication;

    private User usernameUser;
    private User emailUser;
    private Hospital hospital;

    @BeforeEach
    void setUp() {
        usernameUser = User.builder()
                .id(101L)
                .username("john_doe")
                .email("john.doe@medtrack.health")
                .accountStatus(AccountStatus.ACTIVE)
                .role("HOSPITAL")
                .build();

        emailUser = User.builder()
                .id(102L)
                .username("jane_admin")
                .email("jane.admin@hospital.org")
                .accountStatus(AccountStatus.ACTIVE)
                .role("HOSPITAL")
                .build();

        hospital = Hospital.builder()
                .id(501L)
                .name("City General Hospital")
                .location("Central Wing")
                .user(usernameUser)
                .build();
    }

    @Test
    void notificationPreferenceService_ResolvesUserByUsername() {
        NotificationPreferenceService service = new NotificationPreferenceService(preferenceRepository, userRepository);
        when(authentication.getName()).thenReturn("john_doe");
        when(userRepository.findByUsername("john_doe")).thenReturn(Optional.of(usernameUser));
        when(preferenceRepository.findByUserId(101L)).thenReturn(List.of());

        NotificationPreferenceResponse response = service.getPreferences(authentication);

        assertNotNull(response);
        verify(userRepository).findByUsername("john_doe");
    }

    @Test
    void notificationPreferenceService_ResolvesUserByEmailFallback() {
        NotificationPreferenceService service = new NotificationPreferenceService(preferenceRepository, userRepository);
        when(authentication.getName()).thenReturn("jane.admin@hospital.org");
        when(userRepository.findByUsername("jane.admin@hospital.org")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("jane.admin@hospital.org")).thenReturn(Optional.of(emailUser));
        when(preferenceRepository.findByUserId(102L)).thenReturn(List.of());

        NotificationPreferenceResponse response = service.getPreferences(authentication);

        assertNotNull(response);
        verify(userRepository).findByUsername("jane.admin@hospital.org");
        verify(userRepository).findByEmail("jane.admin@hospital.org");
    }

    @Test
    void notificationPreferenceService_RejectsInvalidPrincipal() {
        NotificationPreferenceService service = new NotificationPreferenceService(preferenceRepository, userRepository);
        when(authentication.getName()).thenReturn("   ");

        AccessDeniedException exception = assertThrows(AccessDeniedException.class,
                () -> service.getPreferences(authentication));

        assertEquals("An authenticated account is required", exception.getMessage());
    }

    @Test
    void operationsEventController_ResolvesUserByUsername() {
        OperationsEventController controller = new OperationsEventController(eventRepository, readReceiptRepository, preferenceRepository, userRepository, hospitalRepository, new PaginationConfig());
        when(authentication.getName()).thenReturn("john_doe");
        when(userRepository.findByUsername("john_doe")).thenReturn(Optional.of(usernameUser));
        when(hospitalRepository.findByUserId(101L)).thenReturn(Optional.of(hospital));
        when(preferenceRepository.mutedCategoriesFor(101L)).thenReturn(Set.of());
        when(eventRepository.findByHospitalIdOrderByCreatedAtDesc(eq(501L), any(Pageable.class))).thenReturn(new PageImpl<>(List.of()));

        ResponseEntity<?> response = controller.getEvents(null, false, 0, 20, authentication);

        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());
        verify(userRepository, atLeastOnce()).findByUsername("john_doe");
    }

    @Test
    void operationsEventController_ResolvesUserByEmailFallback() {
        OperationsEventController controller = new OperationsEventController(eventRepository, readReceiptRepository, preferenceRepository, userRepository, hospitalRepository, new PaginationConfig());
        when(authentication.getName()).thenReturn("jane.admin@hospital.org");
        when(userRepository.findByUsername("jane.admin@hospital.org")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("jane.admin@hospital.org")).thenReturn(Optional.of(emailUser));
        when(hospitalRepository.findByUserId(102L)).thenReturn(Optional.of(hospital));
        when(preferenceRepository.mutedCategoriesFor(102L)).thenReturn(Set.of());
        when(eventRepository.findByHospitalIdOrderByCreatedAtDesc(eq(501L), any(Pageable.class))).thenReturn(new PageImpl<>(List.of()));

        ResponseEntity<?> response = controller.getEvents(null, false, 0, 20, authentication);

        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());
        verify(userRepository, atLeastOnce()).findByUsername("jane.admin@hospital.org");
        verify(userRepository, atLeastOnce()).findByEmail("jane.admin@hospital.org");
    }

    @Test
    void operationsEventController_RejectsUnauthenticatedCaller() {
        OperationsEventController controller = new OperationsEventController(eventRepository, readReceiptRepository, preferenceRepository, userRepository, hospitalRepository, new PaginationConfig());
        when(authentication.getName()).thenReturn(null);

        AccessDeniedException exception = assertThrows(AccessDeniedException.class,
                () -> controller.getEvents(null, false, 0, 20, authentication));

        assertEquals("An authenticated account is required", exception.getMessage());
    }

    @Test
    void analyticsController_ResolvesUserByUsername() {
        AnalyticsController controller = new AnalyticsController(analyticsService, userRepository, hospitalRepository);
        when(authentication.getName()).thenReturn("john_doe");
        when(userRepository.findByUsername("john_doe")).thenReturn(Optional.of(usernameUser));
        when(hospitalRepository.findByUserId(101L)).thenReturn(Optional.of(hospital));
        when(analyticsService.getHospitalAnalytics(501L)).thenReturn(new HospitalAnalyticsDto());

        ResponseEntity<HospitalAnalyticsDto> response = controller.getHospitalAnalytics(authentication);

        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());
        verify(userRepository).findByUsername("john_doe");
    }

    @Test
    void analyticsController_ResolvesUserByEmailFallback() {
        AnalyticsController controller = new AnalyticsController(analyticsService, userRepository, hospitalRepository);
        when(authentication.getName()).thenReturn("jane.admin@hospital.org");
        when(userRepository.findByUsername("jane.admin@hospital.org")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("jane.admin@hospital.org")).thenReturn(Optional.of(emailUser));
        when(hospitalRepository.findByUserId(102L)).thenReturn(Optional.of(hospital));
        when(analyticsService.predictFailureRisk(99L, 501L)).thenReturn(new EquipmentFailureRiskDto());

        ResponseEntity<EquipmentFailureRiskDto> response = controller.getEquipmentFailureRisk(99L, authentication);

        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());
        verify(userRepository).findByUsername("jane.admin@hospital.org");
        verify(userRepository).findByEmail("jane.admin@hospital.org");
    }

    @Test
    void analyticsController_ThrowsResourceNotFoundWhenUserMissing() {
        AnalyticsController controller = new AnalyticsController(analyticsService, userRepository, hospitalRepository);
        when(authentication.getName()).thenReturn("unknown_user");
        when(userRepository.findByUsername("unknown_user")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("unknown_user")).thenReturn(Optional.empty());

        ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class,
                () -> controller.getHospitalAnalytics(authentication));

        assertEquals("User not found", exception.getMessage());
    }

    @Test
    void eventStreamAccessGuard_BindsAuthorizedHospitalByUsername() {
        EventStreamAccessGuard guard = new EventStreamAccessGuard(userRepository, hospitalRepository);
        WebSocketSession session = mock(WebSocketSession.class);
        Map<String, Object> attributes = new HashMap<>();
        when(session.getAttributes()).thenReturn(attributes);
        when(session.getPrincipal()).thenReturn(authentication);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn("john_doe");
        when(authentication.getAuthorities()).thenReturn((List) List.of(new SimpleGrantedAuthority("ROLE_HOSPITAL")));
        when(userRepository.findByUsername("john_doe")).thenReturn(Optional.of(usernameUser));
        when(hospitalRepository.findByUserId(101L)).thenReturn(Optional.of(hospital));

        Long hospitalId = guard.bindAuthorizedHospital(session);

        assertEquals(501L, hospitalId);
        assertEquals(501L, attributes.get(EventStreamAccessGuard.AUTHORIZED_HOSPITAL_ID));
        verify(userRepository).findByUsername("john_doe");
    }

    @Test
    void eventStreamAccessGuard_BindsAuthorizedHospitalByEmailFallback() {
        EventStreamAccessGuard guard = new EventStreamAccessGuard(userRepository, hospitalRepository);
        WebSocketSession session = mock(WebSocketSession.class);
        Map<String, Object> attributes = new HashMap<>();
        when(session.getAttributes()).thenReturn(attributes);
        when(session.getPrincipal()).thenReturn(authentication);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn("jane.admin@hospital.org");
        when(authentication.getAuthorities()).thenReturn((List) List.of(new SimpleGrantedAuthority("ROLE_HOSPITAL")));
        when(userRepository.findByUsername("jane.admin@hospital.org")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("jane.admin@hospital.org")).thenReturn(Optional.of(emailUser));
        when(hospitalRepository.findByUserId(102L)).thenReturn(Optional.of(hospital));

        Long hospitalId = guard.bindAuthorizedHospital(session);

        assertEquals(501L, hospitalId);
        assertEquals(501L, attributes.get(EventStreamAccessGuard.AUTHORIZED_HOSPITAL_ID));
        verify(userRepository).findByUsername("jane.admin@hospital.org");
        verify(userRepository).findByEmail("jane.admin@hospital.org");
    }

    @Test
    void eventStreamAccessGuard_RejectsInactiveHospitalAccount() {
        EventStreamAccessGuard guard = new EventStreamAccessGuard(userRepository, hospitalRepository);
        WebSocketSession session = mock(WebSocketSession.class);
        User inactiveUser = User.builder().id(103L).username("inactive_hospital").accountStatus(AccountStatus.DISABLED).role("HOSPITAL").build();

        when(session.getPrincipal()).thenReturn(authentication);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn("inactive_hospital");
        when(authentication.getAuthorities()).thenReturn((List) List.of(new SimpleGrantedAuthority("ROLE_HOSPITAL")));
        when(userRepository.findByUsername("inactive_hospital")).thenReturn(Optional.of(inactiveUser));

        AccessDeniedException exception = assertThrows(AccessDeniedException.class,
                () -> guard.bindAuthorizedHospital(session));

        assertEquals("An active hospital account is required", exception.getMessage());
    }
}

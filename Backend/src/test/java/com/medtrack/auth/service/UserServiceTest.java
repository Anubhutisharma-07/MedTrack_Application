package com.medtrack.auth.service;

import com.medtrack.auth.dto.AuthResponse;
import com.medtrack.auth.dto.LoginRequest;
import com.medtrack.auth.dto.LoginResponse;
import com.medtrack.auth.dto.RegisterRequest;
import com.medtrack.exception.EmailAlreadyExistsException;
import com.medtrack.auth.model.RefreshToken;
import com.medtrack.auth.model.User;
import com.medtrack.auth.model.AccountStatus;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.auth.repository.RefreshTokenRepository;
import com.medtrack.auth.repository.PasswordResetTokenRepository;
import com.medtrack.auth.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link UserService} covering registration, login, token refresh, and logout flows.
 * Uses real instances of {@link JwtUtil} and {@link RefreshTokenService} to bypass JDK 25 class-mocking restrictions.
 */
@ExtendWith(MockitoExtension.class)
public class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Mock
    private EmailService emailService;

    @Mock
    private KafkaEventPublisher kafkaEventPublisher;

    @Mock
    private com.medtrack.auth.scim.service.ScimUserProvisioningService scimUserProvisioningService;

    private final JwtUtil jwtUtil = new JwtUtil();

    private RefreshTokenService refreshTokenService;
    private UserService userService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(jwtUtil, "secret", "medtrack-super-secret-key-change-this-in-production-1234567890");
        ReflectionTestUtils.setField(jwtUtil, "expirationMs", 604800000L);
        refreshTokenService = new RefreshTokenService(refreshTokenRepository);
        ReflectionTestUtils.setField(refreshTokenService, "refreshExpirationDays", 7L);
        com.medtrack.auth.scim.service.ScimUserProvisioningService scimService = org.mockito.Mockito.mock(com.medtrack.auth.scim.service.ScimUserProvisioningService.class);
        userService = new UserService(
                userRepository,
                passwordEncoder,
                jwtUtil,
                refreshTokenService,
                authenticationManager,
                passwordResetTokenRepository,
                emailService,
                kafkaEventPublisher,
                new PublicRegistrationRolePolicy(),
                scimService
        );
        ReflectionTestUtils.setField(userService, "lockDurationMinutes", 30);
        ReflectionTestUtils.setField(userService, "jwtExpirationMs", 900000L);
    }

    @Test
    void register_SupplierRole_Succeeds() {
        RegisterRequest request = RegisterRequest.builder()
                .name("Test User")
                .organization("St. Mary Clinic")
                .email("test@example.com")
                .phone("+1 (555) 019-2834")
                .password("password123")
                .confirmPassword("password123")
                .role("SUPPLIER")
                .build();

        User savedUser = User.builder()
                .id(1L)
                .name("Test User")
                .organization("St. Mary Clinic")
                .email("test@example.com")
                .phone("+1 (555) 019-2834")
                .username("test")
                .password("hashed_password")
                .role("SUPPLIER")
                .accountStatus(AccountStatus.ACTIVE)
                .build();

        when(userRepository.existsByUsername("test")).thenReturn(false);
        when(userRepository.existsByEmail(request.getEmail())).thenReturn(false);
        when(passwordEncoder.encode(request.getPassword())).thenReturn("hashed_password");
        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(invocation -> {
            RefreshToken rt = invocation.getArgument(0);
            rt.setId(10L);
            return rt;
        });

        AuthResponse response = userService.register(request);

        assertNotNull(response);
        assertTrue(response.isSuccess());
        assertEquals("Account created successfully", response.getMessage());
        assertNotNull(response.getUser());
        assertEquals(1L, response.getUser().getId());
        assertEquals("Test User", response.getUser().getName());
        assertEquals("test@example.com", response.getUser().getEmail());
        assertEquals("+1 (555) 019-2834", response.getUser().getPhone());
        assertEquals("St. Mary Clinic", response.getUser().getOrganization());
        assertEquals("SUPPLIER", response.getUser().getRole());
        assertNotNull(response.getToken());
        assertFalse(response.getToken().isEmpty());
        assertNotNull(response.getRefreshToken());

        verify(userRepository).existsByUsername("test");
        verify(userRepository).existsByEmail(request.getEmail());
        verify(passwordEncoder).encode(request.getPassword());
        verify(userRepository).save(any(User.class));
        verify(refreshTokenRepository).save(any(RefreshToken.class));
        verify(kafkaEventPublisher, times(1)).publishUserRegistered(any());
    }

    @Test
    void register_MissingRole_DefaultsToTechnician() {
        RegisterRequest request = RegisterRequest.builder()
                .name("Test User")
                .organization("St. Mary Clinic")
                .email("test@example.com")
                .phone("+1 (555) 019-2834")
                .password("password123")
                .confirmPassword("password123")
                .role(null)
                .build();

        User savedUser = User.builder()
                .id(1L)
                .name("Test User")
                .organization("St. Mary Clinic")
                .email("test@example.com")
                .phone("+1 (555) 019-2834")
                .username("test")
                .password("hashed_password")
                .role("TECHNICIAN")
                .accountStatus(AccountStatus.ACTIVE)
                .build();

        when(userRepository.existsByUsername("test")).thenReturn(false);
        when(userRepository.existsByEmail(request.getEmail())).thenReturn(false);
        when(passwordEncoder.encode(request.getPassword())).thenReturn("hashed_password");
        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(invocation -> {
            RefreshToken rt = invocation.getArgument(0);
            rt.setId(10L);
            return rt;
        });

        AuthResponse response = userService.register(request);

        assertNotNull(response);
        assertEquals("TECHNICIAN", response.getUser().getRole());
    }

    @Test
    void register_PermittedRole_IsTrimmedAndNormalized() {
        RegisterRequest request = RegisterRequest.builder()
                .name("Test User")
                .organization("St. Mary Clinic")
                .email("test@example.com")
                .phone("+1 (555) 019-2834")
                .password("password123")
                .confirmPassword("password123")
                .role("  supplier  ")
                .build();

        User savedUser = User.builder()
                .id(1L)
                .name("Test User")
                .organization("St. Mary Clinic")
                .email("test@example.com")
                .phone("+1 (555) 019-2834")
                .username("test")
                .password("hashed_password")
                .role("SUPPLIER")
                .accountStatus(AccountStatus.ACTIVE)
                .build();

        when(userRepository.existsByEmail(request.getEmail())).thenReturn(false);
        when(userRepository.existsByUsername("test")).thenReturn(false);
        when(passwordEncoder.encode(request.getPassword())).thenReturn("hashed_password");
        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(refreshTokenRepository.save(any(RefreshToken.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        AuthResponse response = userService.register(request);

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        assertEquals("SUPPLIER", userCaptor.getValue().getRole());
        assertEquals("SUPPLIER", response.getRole());
    }

    @Test
    void register_EmailAlreadyExists_ThrowsException() {
        RegisterRequest request = RegisterRequest.builder()
                .name("Test User")
                .organization("St. Mary Clinic")
                .email("test@example.com")
                .phone("+1 (555) 019-2834")
                .password("password123")
                .confirmPassword("password123")
                .role("SUPPLIER")
                .build();

        when(userRepository.existsByEmail(request.getEmail())).thenReturn(true);

        assertThrows(EmailAlreadyExistsException.class, () -> userService.register(request));

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void register_UsernameCollision_AutoGeneratesUniqueUsername() {
        RegisterRequest request = RegisterRequest.builder()
                .name("Test User")
                .organization("St. Mary Clinic")
                .email("test@example.com")
                .phone("+1 (555) 019-2834")
                .password("password123")
                .confirmPassword("password123")
                .role("TECHNICIAN")
                .build();

        User savedUser = User.builder()
                .id(1L)
                .name("Test User")
                .organization("St. Mary Clinic")
                .email("test@example.com")
                .phone("+1 (555) 019-2834")
                .username("test1") // Unique username auto-generated
                .password("hashed_password")
                .role("TECHNICIAN")
                .accountStatus(AccountStatus.ACTIVE)
                .build();

        // mock "test" as already existing, but "test1" as unique
        when(userRepository.existsByUsername("test")).thenReturn(true);
        when(userRepository.existsByUsername("test1")).thenReturn(false);
        when(userRepository.existsByEmail(request.getEmail())).thenReturn(false);
        when(passwordEncoder.encode(request.getPassword())).thenReturn("hashed_password");
        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(invocation -> {
            RefreshToken rt = invocation.getArgument(0);
            rt.setId(10L);
            return rt;
        });

        AuthResponse response = userService.register(request);

        assertNotNull(response);
        assertEquals("test1", response.getUsername()); // legacy flat field will map to username
    }

    @Test
    void register_InvalidRole_ThrowsException() {
        RegisterRequest request = RegisterRequest.builder()
                .name("Test User")
                .organization("St. Mary Clinic")
                .email("test@example.com")
                .phone("+1 (555) 019-2834")
                .password("password123")
                .confirmPassword("password123")
                .role("INVALID_ROLE")
                .build();

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> userService.register(request));
        assertEquals("Invalid registration role. Must be TECHNICIAN or SUPPLIER", exception.getMessage());

        verifyNoInteractions(userRepository, passwordEncoder, refreshTokenRepository, kafkaEventPublisher);
    }

    @Test
    void register_HospitalRole_IsRejectedBeforeAnySideEffects() {
        RegisterRequest request = RegisterRequest.builder()
                .name("Attacker")
                .organization("Untrusted Organization")
                .email("attacker@example.com")
                .phone("+1 (555) 019-9999")
                .password("password123")
                .confirmPassword("password123")
                .role("HOSPITAL")
                .build();

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> userService.register(request)
        );

        assertEquals(
                "HOSPITAL accounts cannot be created through public registration",
                exception.getMessage()
        );
        verifyNoInteractions(userRepository, passwordEncoder, refreshTokenRepository, kafkaEventPublisher);
    }

    @Test
    void register_MixedCaseHospitalRole_CannotBypassPolicy() {
        RegisterRequest request = RegisterRequest.builder()
                .name("Attacker")
                .organization("Untrusted Organization")
                .email("attacker@example.com")
                .phone("+1 (555) 019-9999")
                .password("password123")
                .confirmPassword("password123")
                .role("  hOsPiTaL  ")
                .build();

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> userService.register(request)
        );

        assertTrue(exception.getMessage().contains("cannot be created"));
        verifyNoInteractions(userRepository, passwordEncoder, refreshTokenRepository, kafkaEventPublisher);
    }

    @Test
    void register_PasswordMismatch_ThrowsException() {
        RegisterRequest request = RegisterRequest.builder()
                .name("Test User")
                .organization("St. Mary Clinic")
                .email("test@example.com")
                .phone("+1 (555) 019-2834")
                .password("password123")
                .confirmPassword("different_password")
                .role("HOSPITAL")
                .build();

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> userService.register(request));
        assertEquals("Passwords do not match", exception.getMessage());

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void login_Success() {
        LoginRequest request = new LoginRequest("test@example.com", "password123", "HOSPITAL");
        User user = User.builder()
                .id(1L)
                .name("Test User")
                .username("testuser")
                .email("test@example.com")
                .password("hashed_password")
                .role("HOSPITAL")
                .accountStatus(AccountStatus.ACTIVE)
                .build();

        when(passwordEncoder.matches(request.getPassword(), user.getPassword())).thenReturn(true);
        when(userRepository.findByEmail(request.getEmail())).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(invocation -> {
            RefreshToken rt = invocation.getArgument(0);
            rt.setId(10L);
            return rt;
        });

        AuthResponse response = userService.login(request);

        assertNotNull(response);
        assertNotNull(response.getToken());
        assertFalse(response.getToken().isEmpty());
        assertNotNull(response.getRefreshToken());
        verify(kafkaEventPublisher, times(1)).publishUserLogin(any());
    }

    @Test
    void login_UserNotFound_ThrowsException() {
        LoginRequest request = new LoginRequest("test@example.com", "password123", "HOSPITAL");

        when(userRepository.findByEmail(request.getEmail())).thenReturn(Optional.empty());

        assertThrows(BadCredentialsException.class, () -> userService.login(request));
    }

    @Test
    void login_PasswordMismatch_ThrowsException() {
        LoginRequest request = new LoginRequest("test@example.com", "wrong_password", "HOSPITAL");
        User user = User.builder()
                .id(1L)
                .username("testuser")
                .email("test@example.com")
                .password("hashed_password")
                .role("HOSPITAL")
                .accountStatus(AccountStatus.ACTIVE)
                .build();

        when(userRepository.findByEmail(request.getEmail())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(request.getPassword(), user.getPassword())).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        assertThrows(BadCredentialsException.class, () -> userService.login(request));
        assertEquals(1, user.getFailedLoginAttempts());
    }

    @Test
    void login_FailedAttemptsIncremented() {
        LoginRequest request = new LoginRequest("test@example.com", "wrong_password", "HOSPITAL");
        User user = User.builder()
                .id(1L)
                .email("test@example.com")
                .password("hashed_password")
                .role("HOSPITAL")
                .failedLoginAttempts(2)
                .accountStatus(AccountStatus.ACTIVE)
                .build();

        when(userRepository.findByEmail(request.getEmail())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(request.getPassword(), user.getPassword())).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        assertThrows(BadCredentialsException.class, () -> userService.login(request));
        assertEquals(3, user.getFailedLoginAttempts());
    }

    @Test
    void login_AccountLockedAfter5Failures() {
        LoginRequest request = new LoginRequest("test@example.com", "wrong_password", "HOSPITAL");
        User user = User.builder()
                .id(1L)
                .email("test@example.com")
                .password("hashed_password")
                .role("HOSPITAL")
                .failedLoginAttempts(4)
                .accountStatus(AccountStatus.ACTIVE)
                .build();

        when(userRepository.findByEmail(request.getEmail())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(request.getPassword(), user.getPassword())).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        assertThrows(BadCredentialsException.class, () -> userService.login(request));
        assertEquals(AccountStatus.LOCKED, user.getAccountStatus());
        assertNotNull(user.getAccountLockedUntil());
        assertEquals(0, user.getFailedLoginAttempts());
    }

    @Test
    void login_LockedAccountRejected() {
        LoginRequest request = new LoginRequest("test@example.com", "password123", "HOSPITAL");
        User user = User.builder()
                .id(1L)
                .email("test@example.com")
                .accountStatus(AccountStatus.LOCKED)
                .accountLockedUntil(LocalDateTime.now().plusMinutes(15))
                .build();

        when(userRepository.findByEmail(request.getEmail())).thenReturn(Optional.of(user));

        LockedException exception = assertThrows(LockedException.class, () -> userService.login(request));
        assertEquals("Account is temporarily locked. Please try again later.", exception.getMessage());
        verify(passwordEncoder, never()).matches(any(), any());
    }

    @Test
    void login_LockedAccountAutoUnlockedAfterCooldown() {
        LoginRequest request = new LoginRequest("test@example.com", "password123", "HOSPITAL");
        User user = User.builder()
                .id(1L)
                .email("test@example.com")
                .password("hashed_password")
                .name("Test User")
                .role("HOSPITAL")
                .accountStatus(AccountStatus.LOCKED)
                .accountLockedUntil(LocalDateTime.now().minusMinutes(5)) // Expired
                .failedLoginAttempts(0)
                .build();

        when(userRepository.findByEmail(request.getEmail())).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(passwordEncoder.matches(request.getPassword(), user.getPassword())).thenReturn(true);

        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(invocation -> {
            RefreshToken rt = invocation.getArgument(0);
            rt.setId(10L);
            return rt;
        });

        AuthResponse response = userService.login(request);

        assertNotNull(response);
        assertEquals(AccountStatus.ACTIVE, user.getAccountStatus());
        assertNull(user.getAccountLockedUntil());
        assertEquals(0, user.getFailedLoginAttempts());
    }

    @Test
    void refreshAccessToken_Success() {
        String tokenStr = "mock-refresh-token";
        RefreshToken mockRefreshToken = RefreshToken.builder()
                .token(tokenStr)
                .userId(1L)
                .expiryDate(LocalDateTime.now().plusDays(1))
                .revoked(false)
                .build();

        User user = User.builder()
                .id(1L)
                .username("testuser")
                .email("test@example.com")
                .role("HOSPITAL")
                .accountStatus(AccountStatus.ACTIVE)
                .build();

        when(refreshTokenRepository.findByTokenForUpdate(tokenStr)).thenReturn(Optional.of(mockRefreshToken));
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AuthResponse response = userService.refreshAccessToken(tokenStr);

        assertNotNull(response);
        assertNotNull(response.getToken());
        assertFalse(response.getToken().isEmpty());
        assertNotNull(response.getRefreshToken());

        verify(refreshTokenRepository).findByTokenForUpdate(tokenStr);
        verify(refreshTokenRepository, never()).findByToken(tokenStr);
        assertTrue(mockRefreshToken.isRevoked());
    }

    @Test
    void logout_Success() {
        String tokenStr = "mock-refresh-token";
        RefreshToken mockRefreshToken = RefreshToken.builder()
                .token(tokenStr)
                .userId(1L)
                .expiryDate(LocalDateTime.now().plusDays(1))
                .revoked(false)
                .build();

        when(refreshTokenRepository.findByToken(tokenStr)).thenReturn(Optional.of(mockRefreshToken));
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(invocation -> invocation.getArgument(0));

        userService.logout(tokenStr);

        verify(refreshTokenRepository).findByToken(tokenStr);
        verify(refreshTokenRepository).save(mockRefreshToken);
        assertTrue(mockRefreshToken.isRevoked());
    }
}

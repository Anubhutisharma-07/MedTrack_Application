package com.medtrack.auth.security;

import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.exception.ResourceNotFoundException;
import com.medtrack.model.Hospital;
import com.medtrack.repository.HospitalRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("HospitalAccessGuard Tests")
class HospitalAccessGuardTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private HospitalRepository hospitalRepository;

    @InjectMocks
    private HospitalAccessGuard hospitalAccessGuard;

    private User testUser;
    private Hospital testHospital;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("hospital@example.com");
        testUser.setRole("hospital");

        testHospital = new Hospital();
        testHospital.setId(42L);
        testHospital.setUser(testUser);
    }

    @Test
    @DisplayName("resolveHospitalFromEmail returns hospital for valid email")
    void resolveHospitalFromEmail_validEmail_returnsHospital() {
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(testUser));
        when(hospitalRepository.findByUserId(1L)).thenReturn(Optional.of(testHospital));

        Hospital result = hospitalAccessGuard.resolveHospitalFromEmail("hospital@example.com");

        assertEquals(42L, result.getId());
        assertEquals(testUser, result.getUser());
    }

    @Test
    @DisplayName("resolveHospitalFromEmail throws when user not found")
    void resolveHospitalFromEmail_userNotFound_throwsException() {
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());

        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class,
                () -> hospitalAccessGuard.resolveHospitalFromEmail("unknown@example.com"));

        assertEquals("User not found with email: unknown@example.com", ex.getMessage());
    }

    @Test
    @DisplayName("resolveHospitalFromEmail throws when hospital not found")
    void resolveHospitalFromEmail_hospitalNotFound_throwsException() {
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(testUser));
        when(hospitalRepository.findByUserId(1L)).thenReturn(Optional.empty());

        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class,
                () -> hospitalAccessGuard.resolveHospitalFromEmail("hospital@example.com"));

        assertEquals("Hospital profile not found for user", ex.getMessage());
    }

    @Test
    @DisplayName("resolveUserFromEmail returns user for valid email")
    void resolveUserFromEmail_validEmail_returnsUser() {
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(testUser));

        User result = hospitalAccessGuard.resolveUserFromEmail("hospital@example.com");

        assertEquals(1L, result.getId());
        assertEquals("hospital@example.com", result.getEmail());
    }

    @Test
    @DisplayName("resolveUserFromEmail throws when user not found")
    void resolveUserFromEmail_userNotFound_throwsException() {
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());

        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class,
                () -> hospitalAccessGuard.resolveUserFromEmail("missing@example.com"));

        assertEquals("User not found with email: missing@example.com", ex.getMessage());
    }

    @Test
    @DisplayName("resolveHospitalIdFromEmail returns ID for valid email")
    void resolveHospitalIdFromEmail_validEmail_returnsId() {
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(testUser));
        when(hospitalRepository.findByUserId(1L)).thenReturn(Optional.of(testHospital));

        Long result = hospitalAccessGuard.resolveHospitalIdFromEmail("hospital@example.com");

        assertEquals(42L, result);
    }
}

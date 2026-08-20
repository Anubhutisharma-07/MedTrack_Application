package com.medtrack.auth.security;

import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.exception.ResourceNotFoundException;
import com.medtrack.model.Hospital;
import com.medtrack.repository.HospitalRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
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
        testUser = User.builder().id(1L).email("test@hospital.com").role("HOSPITAL").build();
        testHospital = Hospital.builder().id(10L).build();
        testHospital.setUser(testUser);
    }

    @Test
    void resolveHospitalFromEmail_returnsHospital() {
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(testUser));
        when(hospitalRepository.findByUserId(1L)).thenReturn(Optional.of(testHospital));

        Hospital result = hospitalAccessGuard.resolveHospitalFromEmail("test@hospital.com");

        assertNotNull(result);
        assertEquals(10L, result.getId());
    }

    @Test
    void resolveHospitalFromEmail_throwsWhenUserNotFound() {
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());

        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class,
                () -> hospitalAccessGuard.resolveHospitalFromEmail("missing@hospital.com"));
        assertTrue(ex.getMessage().contains("User not found"));
    }

    @Test
    void resolveHospitalFromEmail_throwsWhenHospitalNotFound() {
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(testUser));
        when(hospitalRepository.findByUserId(1L)).thenReturn(Optional.empty());

        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class,
                () -> hospitalAccessGuard.resolveHospitalFromEmail("test@hospital.com"));
        assertTrue(ex.getMessage().contains("Hospital profile not found"));
    }

    @Test
    void resolveHospitalIdFromEmail_returnsId() {
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(testUser));
        when(hospitalRepository.findByUserId(1L)).thenReturn(Optional.of(testHospital));

        Long id = hospitalAccessGuard.resolveHospitalIdFromEmail("test@hospital.com");
        assertEquals(10L, id);
    }

    @Test
    void resolveUserFromEmail_returnsUser() {
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(testUser));

        User result = hospitalAccessGuard.resolveUserFromEmail("test@hospital.com");
        assertEquals("test@hospital.com", result.getEmail());
    }

    @Test
    void resolveUserFromEmail_throwsWhenNotFound() {
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> hospitalAccessGuard.resolveUserFromEmail("missing@hospital.com"));
    }
}

package com.medtrack.service;

import com.medtrack.auth.model.AccountStatus;
import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.dto.MaintenanceRuleStatusRequest;
import com.medtrack.dto.MaintenanceRuleResponse;
import com.medtrack.exception.ResourceNotFoundException;
import com.medtrack.model.Hospital;
import com.medtrack.model.MaintenancePolicyRule;
import com.medtrack.model.MaintenancePolicyStatus;
import com.medtrack.repository.EquipmentRepository;
import com.medtrack.repository.HospitalRepository;
import com.medtrack.repository.MaintenanceGenerationRunRepository;
import com.medtrack.repository.MaintenancePolicyRuleRepository;
import com.medtrack.repository.MaintenanceTaskRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MaintenancePolicyLifecycleServiceTest {

    @Mock
    private MaintenancePolicyRuleRepository ruleRepository;

    @Mock
    private MaintenanceGenerationRunRepository runRepository;

    @Mock
    private MaintenanceTaskRepository taskRepository;

    @Mock
    private EquipmentRepository equipmentRepository;

    @Mock
    private HospitalRepository hospitalRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private MaintenanceActivityService activityService;

    @Mock
    private EventPublisherService eventPublisherService;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private PreventiveMaintenanceService service;

    private User hospitalUser;
    private Hospital hospital;
    private MaintenancePolicyRule rule;

    @BeforeEach
    void setUp() {
        hospitalUser = User.builder()
                .id(10L)
                .email("hospital@example.com")
                .role("hospital")
                .accountStatus(AccountStatus.ACTIVE)
                .build();

        hospital = Hospital.builder()
                .id(100L)
                .user(hospitalUser)
                .build();

        rule = MaintenancePolicyRule.builder()
                .id(1L)
                .hospitalId(100L)
                .name("Preventive Maintenance")
                .maintenanceType("Inspection")
                .status(MaintenancePolicyStatus.DRAFT)
                .active(false)
                .createdAt(LocalDateTime.now())
                .build();

        when(authentication.getName()).thenReturn("hospital@example.com");

        when(userRepository.findByEmail("hospital@example.com"))
                .thenReturn(Optional.of(hospitalUser));

        when(hospitalRepository.findByUserId(10L))
                .thenReturn(Optional.of(hospital));

        when(ruleRepository.findByIdAndHospitalId(1L, 100L))
                .thenReturn(Optional.of(rule));

        lenient().when(ruleRepository.save(any(MaintenancePolicyRule.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void shouldTransitionDraftToActive() {
        MaintenanceRuleStatusRequest request =
                MaintenanceRuleStatusRequest.builder()
                        .status(MaintenancePolicyStatus.ACTIVE)
                        .build();

        MaintenanceRuleResponse response =
                service.updateRuleStatus(1L, request, authentication);

        assertEquals(MaintenancePolicyStatus.ACTIVE, rule.getStatus());
        assertTrue(rule.getActive());
        assertNotNull(rule.getUpdatedAt());
        assertEquals(1L, response.getId());

        verify(ruleRepository).save(rule);
    }

    @Test
    void shouldTransitionActiveToPaused() {
        rule.setStatus(MaintenancePolicyStatus.ACTIVE);
        rule.setActive(true);

        MaintenanceRuleStatusRequest request =
                MaintenanceRuleStatusRequest.builder()
                        .status(MaintenancePolicyStatus.PAUSED)
                        .build();

        service.updateRuleStatus(1L, request, authentication);

        assertEquals(MaintenancePolicyStatus.PAUSED, rule.getStatus());
        assertFalse(rule.getActive());
    }

    @Test
    void shouldTransitionPausedToActive() {
        rule.setStatus(MaintenancePolicyStatus.PAUSED);
        rule.setActive(false);

        MaintenanceRuleStatusRequest request =
                MaintenanceRuleStatusRequest.builder()
                        .status(MaintenancePolicyStatus.ACTIVE)
                        .build();

        service.updateRuleStatus(1L, request, authentication);

        assertEquals(MaintenancePolicyStatus.ACTIVE, rule.getStatus());
        assertTrue(rule.getActive());
    }

    @Test
    void shouldTransitionActiveToCompleted() {
        rule.setStatus(MaintenancePolicyStatus.ACTIVE);
        rule.setActive(true);

        MaintenanceRuleStatusRequest request =
                MaintenanceRuleStatusRequest.builder()
                        .status(MaintenancePolicyStatus.COMPLETED)
                        .build();

        service.updateRuleStatus(1L, request, authentication);

        assertEquals(MaintenancePolicyStatus.COMPLETED, rule.getStatus());
        assertFalse(rule.getActive());
    }

    @Test
    void shouldTransitionCompletedToArchived() {
        rule.setStatus(MaintenancePolicyStatus.COMPLETED);
        rule.setActive(false);

        MaintenanceRuleStatusRequest request =
                MaintenanceRuleStatusRequest.builder()
                        .status(MaintenancePolicyStatus.ARCHIVED)
                        .build();

        service.updateRuleStatus(1L, request, authentication);

        assertEquals(MaintenancePolicyStatus.ARCHIVED, rule.getStatus());
        assertFalse(rule.getActive());
    }

    @Test
    void shouldTransitionDraftToArchived() {
        MaintenanceRuleStatusRequest request =
                MaintenanceRuleStatusRequest.builder()
                        .status(MaintenancePolicyStatus.ARCHIVED)
                        .build();

        service.updateRuleStatus(1L, request, authentication);

        assertEquals(MaintenancePolicyStatus.ARCHIVED, rule.getStatus());
        assertFalse(rule.getActive());
    }

    @Test
    void shouldRejectArchivedToActive() {
        rule.setStatus(MaintenancePolicyStatus.ARCHIVED);
        rule.setActive(false);

        MaintenanceRuleStatusRequest request =
                MaintenanceRuleStatusRequest.builder()
                        .status(MaintenancePolicyStatus.ACTIVE)
                        .build();

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> service.updateRuleStatus(1L, request, authentication));

        assertTrue(exception.getMessage().contains("Invalid maintenance rule status transition"));
        verify(ruleRepository, never()).save(any());
    }

    @Test
    void shouldRejectCompletedToActive() {
        rule.setStatus(MaintenancePolicyStatus.COMPLETED);
        rule.setActive(false);

        MaintenanceRuleStatusRequest request =
                MaintenanceRuleStatusRequest.builder()
                        .status(MaintenancePolicyStatus.ACTIVE)
                        .build();

        assertThrows(
                IllegalArgumentException.class,
                () -> service.updateRuleStatus(1L, request, authentication));

        verify(ruleRepository, never()).save(any());
    }

    @Test
    void shouldRejectDraftToCompleted() {
        rule.setStatus(MaintenancePolicyStatus.DRAFT);
        rule.setActive(false);

        MaintenanceRuleStatusRequest request =
                MaintenanceRuleStatusRequest.builder()
                        .status(MaintenancePolicyStatus.COMPLETED)
                        .build();

        assertThrows(
                IllegalArgumentException.class,
                () -> service.updateRuleStatus(1L, request, authentication));

        verify(ruleRepository, never()).save(any());
    }

    @Test
    void shouldRejectTransitionToSameStatus() {
        rule.setStatus(MaintenancePolicyStatus.DRAFT);
        rule.setActive(false);

        MaintenanceRuleStatusRequest request =
                MaintenanceRuleStatusRequest.builder()
                        .status(MaintenancePolicyStatus.DRAFT)
                        .build();

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> service.updateRuleStatus(1L, request, authentication));

        assertTrue(exception.getMessage().contains("already in"));
        verify(ruleRepository, never()).save(any());
    }

    @Test
    void shouldRejectTransitionForUnknownRule() {
        when(ruleRepository.findByIdAndHospitalId(1L, 100L))
                .thenReturn(Optional.empty());

        MaintenanceRuleStatusRequest request =
                MaintenanceRuleStatusRequest.builder()
                        .status(MaintenancePolicyStatus.ACTIVE)
                        .build();

        assertThrows(
                ResourceNotFoundException.class,
                () -> service.updateRuleStatus(1L, request, authentication));

        verify(ruleRepository, never()).save(any());
    }
}

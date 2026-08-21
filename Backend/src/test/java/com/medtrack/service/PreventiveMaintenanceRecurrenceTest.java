package com.medtrack.service;

import com.medtrack.auth.model.AccountStatus;
import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.dto.RulePreviewResponse;
import com.medtrack.model.Equipment;
import com.medtrack.model.EquipmentCategory;
import com.medtrack.model.EquipmentStatus;
import com.medtrack.model.Hospital;
import com.medtrack.model.MaintenanceGenerationRun;
import com.medtrack.model.MaintenancePolicyRule;
import com.medtrack.model.MaintenanceRuleScope;
import com.medtrack.model.MaintenanceStatus;
import com.medtrack.model.MaintenanceTask;
import com.medtrack.model.RecurrenceFrequency;
import com.medtrack.model.SlaState;
import com.medtrack.repository.EquipmentRepository;
import com.medtrack.repository.HospitalRepository;
import com.medtrack.repository.MaintenanceGenerationRunRepository;
import com.medtrack.repository.MaintenancePolicyRuleRepository;
import com.medtrack.repository.MaintenanceTaskRepository;
import com.medtrack.repository.MaintenanceTaskRepository.GeneratedOccurrence;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PreventiveMaintenanceRecurrenceTest {

    /**
     * Generation windows must not be entirely in the past, so the fixtures below are anchored on
     * next January rather than on a hard-coded calendar year. Pinned to 2026, every one of these
     * tests started throwing "Generation window cannot be entirely in the past" the moment that
     * year was under way.
     */
    private static final int NEXT_YEAR = java.time.LocalDate.now().getYear() + 1;

    private static final String HOSPITAL_EMAIL = "admin@hospital.com";
    private static final Long HOSPITAL_ID = 100L;
    private static final Long RULE_ID = 50L;
    private static final Long EQUIPMENT_ID = 200L;

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

    private Hospital hospital;
    private Equipment equipment;
    private MaintenancePolicyRule rule;

    @BeforeEach
    void setUp() {
        User hospitalUser = User.builder()
                .id(1L)
                .email(HOSPITAL_EMAIL)
                .role("hospital")
                .accountStatus(AccountStatus.ACTIVE)
                .build();

        hospital = Hospital.builder()
                .id(HOSPITAL_ID)
                .name("St. Jude Medical Center")
                .user(hospitalUser)
                .build();

        equipment = Equipment.builder()
                .id(EQUIPMENT_ID)
                .equipmentCode("EQ-VENT-100")
                .name("Mechanical Ventilator")
                .hospital(hospital)
                .status(EquipmentStatus.ACTIVE)
                .category(EquipmentCategory.RESPIRATORY)
                .build();

        rule = MaintenancePolicyRule.builder()
                .id(RULE_ID)
                .hospitalId(HOSPITAL_ID)
                .name("Ventilator Recurrence Inspection")
                .ruleScope(MaintenanceRuleScope.INDIVIDUAL_EQUIPMENT)
                .equipmentRecordId(EQUIPMENT_ID)
                .maintenanceType("Preventive Maintenance")
                .priority("High")
                .active(true)
                .leadTimeDays(30)
                .slaWarningDays(3)
                .slaBreachDays(1)
                .build();

        lenient().when(authentication.getName()).thenReturn(HOSPITAL_EMAIL);
        lenient().when(userRepository.findByEmail(HOSPITAL_EMAIL)).thenReturn(Optional.of(hospitalUser));
        lenient().when(hospitalRepository.findByUserId(1L)).thenReturn(Optional.of(hospital));
    }

    @Test
    @DisplayName("Should preserve exact day of month for monthly recurrence cadence")
    void shouldPreserveDayOfMonthForMonthlyRecurrence() {
        rule.setFrequency(RecurrenceFrequency.MONTHLY);
        LocalDate start = LocalDate.of(NEXT_YEAR, 3, 15);
        LocalDate end = LocalDate.of(NEXT_YEAR, 6, 20);
        LocalDate priorDeadline = LocalDate.of(NEXT_YEAR, 3, 15);

        when(ruleRepository.findByIdAndHospitalId(RULE_ID, HOSPITAL_ID)).thenReturn(Optional.of(rule));
        when(equipmentRepository.findByIdAndHospitalId(EQUIPMENT_ID, HOSPITAL_ID)).thenReturn(Optional.of(equipment));
        when(taskRepository.findLatestGeneratedDeadlines(HOSPITAL_ID, RULE_ID))
                .thenReturn(List.of(occurrence(EQUIPMENT_ID, priorDeadline)));
        when(taskRepository.findGeneratedOccurrencesInWindow(HOSPITAL_ID, RULE_ID, start, end))
                .thenReturn(List.of());

        RulePreviewResponse preview = service.previewRule(RULE_ID, start, end, authentication);

        List<LocalDate> expectedDates = List.of(
                LocalDate.of(NEXT_YEAR, 4, 15),
                LocalDate.of(NEXT_YEAR, 5, 15),
                LocalDate.of(NEXT_YEAR, 6, 15)
        );
        assertEquals(expectedDates, preview.getDueDates());
        assertEquals(3, preview.getWouldCreate());
    }

    @Test
    @DisplayName("Should calculate exact 3-month quarterly intervals preserving day of month")
    void shouldPreserveDayOfMonthForQuarterlyRecurrence() {
        rule.setFrequency(RecurrenceFrequency.QUARTERLY);
        LocalDate start = LocalDate.of(NEXT_YEAR, 1, 15);
        LocalDate end = LocalDate.of(NEXT_YEAR, 10, 30);
        LocalDate priorDeadline = LocalDate.of(NEXT_YEAR, 1, 15);

        when(ruleRepository.findByIdAndHospitalId(RULE_ID, HOSPITAL_ID)).thenReturn(Optional.of(rule));
        when(equipmentRepository.findByIdAndHospitalId(EQUIPMENT_ID, HOSPITAL_ID)).thenReturn(Optional.of(equipment));
        when(taskRepository.findLatestGeneratedDeadlines(HOSPITAL_ID, RULE_ID))
                .thenReturn(List.of(occurrence(EQUIPMENT_ID, priorDeadline)));
        when(taskRepository.findGeneratedOccurrencesInWindow(HOSPITAL_ID, RULE_ID, start, end))
                .thenReturn(List.of());

        RulePreviewResponse preview = service.previewRule(RULE_ID, start, end, authentication);

        List<LocalDate> expectedDates = List.of(
                LocalDate.of(NEXT_YEAR, 4, 15),
                LocalDate.of(NEXT_YEAR, 7, 15),
                LocalDate.of(NEXT_YEAR, 10, 15)
        );
        assertEquals(expectedDates, preview.getDueDates());
        assertEquals(3, preview.getWouldCreate());
    }

    @Test
    @DisplayName("Should advance exactly 12 months for yearly recurrence frequency")
    void shouldPreserveDayOfMonthForYearlyRecurrence() {
        rule.setFrequency(RecurrenceFrequency.YEARLY);
        LocalDate start = LocalDate.of(NEXT_YEAR, 2, 20);
        LocalDate end = LocalDate.of(NEXT_YEAR + 2, 5, 1);
        LocalDate priorDeadline = LocalDate.of(NEXT_YEAR, 2, 20);

        when(ruleRepository.findByIdAndHospitalId(RULE_ID, HOSPITAL_ID)).thenReturn(Optional.of(rule));
        when(equipmentRepository.findByIdAndHospitalId(EQUIPMENT_ID, HOSPITAL_ID)).thenReturn(Optional.of(equipment));
        when(taskRepository.findLatestGeneratedDeadlines(HOSPITAL_ID, RULE_ID))
                .thenReturn(List.of(occurrence(EQUIPMENT_ID, priorDeadline)));
        when(taskRepository.findGeneratedOccurrencesInWindow(HOSPITAL_ID, RULE_ID, start, end))
                .thenReturn(List.of());

        RulePreviewResponse preview = service.previewRule(RULE_ID, start, end, authentication);

        List<LocalDate> expectedDates = List.of(
                LocalDate.of(NEXT_YEAR + 1, 2, 20),
                LocalDate.of(NEXT_YEAR + 2, 2, 20)
        );
        assertEquals(expectedDates, preview.getDueDates());
        assertEquals(2, preview.getWouldCreate());
    }

    @Test
    @DisplayName("Should handle month-end boundary dates correctly for monthly recurrence")
    void shouldHandleMonthEndBoundaryForMonthlyRecurrence() {
        rule.setFrequency(RecurrenceFrequency.MONTHLY);
        LocalDate start = LocalDate.of(NEXT_YEAR, 1, 31);
        LocalDate end = LocalDate.of(NEXT_YEAR, 4, 5);
        LocalDate priorDeadline = LocalDate.of(NEXT_YEAR, 1, 31);

        when(ruleRepository.findByIdAndHospitalId(RULE_ID, HOSPITAL_ID)).thenReturn(Optional.of(rule));
        when(equipmentRepository.findByIdAndHospitalId(EQUIPMENT_ID, HOSPITAL_ID)).thenReturn(Optional.of(equipment));
        when(taskRepository.findLatestGeneratedDeadlines(HOSPITAL_ID, RULE_ID))
                .thenReturn(List.of(occurrence(EQUIPMENT_ID, priorDeadline)));
        when(taskRepository.findGeneratedOccurrencesInWindow(HOSPITAL_ID, RULE_ID, start, end))
                .thenReturn(List.of());

        RulePreviewResponse preview = service.previewRule(RULE_ID, start, end, authentication);

        List<LocalDate> expectedDates = List.of(
                LocalDate.of(NEXT_YEAR, 2, 28),
                LocalDate.of(NEXT_YEAR, 3, 31)
        );
        assertEquals(expectedDates, preview.getDueDates());
    }

    @Test
    @DisplayName("Should generate maintenance tasks with correct deadlines for quarterly recurrence")
    void shouldGenerateTasksWithQuarterlyRecurrenceDeadlines() {
        rule.setFrequency(RecurrenceFrequency.QUARTERLY);
        LocalDate start = LocalDate.of(NEXT_YEAR, 1, 1);
        LocalDate end = LocalDate.of(NEXT_YEAR, 7, 1);

        when(ruleRepository.findByIdAndHospitalIdForUpdate(RULE_ID, HOSPITAL_ID)).thenReturn(Optional.of(rule));
        when(equipmentRepository.findByIdAndHospitalId(EQUIPMENT_ID, HOSPITAL_ID)).thenReturn(Optional.of(equipment));
        when(runRepository.findByHospitalIdAndPolicyRuleIdAndWindowStartAndWindowEnd(HOSPITAL_ID, RULE_ID, start, end))
                .thenReturn(Optional.empty());
        when(taskRepository.findLatestGeneratedDeadlines(HOSPITAL_ID, RULE_ID)).thenReturn(List.of());
        when(taskRepository.findGeneratedOccurrencesInWindow(HOSPITAL_ID, RULE_ID, start, end)).thenReturn(List.of());

        MaintenanceGenerationRun run = MaintenanceGenerationRun.builder().id(10L).build();
        when(runRepository.save(any(MaintenanceGenerationRun.class))).thenReturn(run);

        service.generateTasks(RULE_ID, start, end, authentication);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<MaintenanceTask>> captor = (ArgumentCaptor) ArgumentCaptor.forClass(List.class);
        verify(taskRepository).saveAll(captor.capture());

        List<MaintenanceTask> created = captor.getValue();
        assertEquals(3, created.size());
        assertEquals(LocalDate.of(NEXT_YEAR, 1, 1), created.get(0).getDeadline());
        assertEquals(LocalDate.of(NEXT_YEAR, 4, 1), created.get(1).getDeadline());
        assertEquals(LocalDate.of(NEXT_YEAR, 7, 1), created.get(2).getDeadline());
    }

    @Test
    @DisplayName("Should advance custom recurrence interval by exact number of days")
    void shouldAdvanceCustomIntervalBySpecifiedDays() {
        rule.setFrequency(RecurrenceFrequency.CUSTOM);
        rule.setCustomIntervalDays(10);
        LocalDate start = LocalDate.of(NEXT_YEAR, 5, 1);
        LocalDate end = LocalDate.of(NEXT_YEAR, 5, 25);
        LocalDate priorDeadline = LocalDate.of(NEXT_YEAR, 5, 1);

        when(ruleRepository.findByIdAndHospitalId(RULE_ID, HOSPITAL_ID)).thenReturn(Optional.of(rule));
        when(equipmentRepository.findByIdAndHospitalId(EQUIPMENT_ID, HOSPITAL_ID)).thenReturn(Optional.of(equipment));
        when(taskRepository.findLatestGeneratedDeadlines(HOSPITAL_ID, RULE_ID))
                .thenReturn(List.of(occurrence(EQUIPMENT_ID, priorDeadline)));
        when(taskRepository.findGeneratedOccurrencesInWindow(HOSPITAL_ID, RULE_ID, start, end))
                .thenReturn(List.of());

        RulePreviewResponse preview = service.previewRule(RULE_ID, start, end, authentication);

        List<LocalDate> expectedDates = List.of(
                LocalDate.of(NEXT_YEAR, 5, 11),
                LocalDate.of(NEXT_YEAR, 5, 21)
        );
        assertEquals(expectedDates, preview.getDueDates());
    }

    private MaintenanceTaskRepository.GeneratedOccurrence occurrence(Long equipmentRecordId, LocalDate deadline) {
        return new MaintenanceTaskRepository.GeneratedOccurrence() {
            @Override
            public Long getEquipmentRecordId() {
                return equipmentRecordId;
            }

            @Override
            public LocalDate getDeadline() {
                return deadline;
            }
        };
    }
}

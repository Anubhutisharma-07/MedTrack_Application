package com.medtrack.service;

import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.dto.MaintenanceCalendarResponse;
import com.medtrack.dto.MaintenanceScheduleRequest;
import com.medtrack.dto.MaintenanceScheduleResponse;
import com.medtrack.dto.OverdueMaintenanceResponse;
import com.medtrack.dto.UpcomingMaintenanceResponse;
import com.medtrack.exception.ResourceNotFoundException;
import com.medtrack.model.Equipment;
import com.medtrack.model.Hospital;
import com.medtrack.model.MaintenanceStatus;
import com.medtrack.model.MaintenanceTask;
import com.medtrack.repository.EquipmentRepository;
import com.medtrack.repository.HospitalRepository;
import com.medtrack.repository.MaintenanceTaskRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Covers {@link MaintenanceCalendarService}.
 *
 * <p>Pins the behaviour of the four calendar endpoints: the status counts partition the schedule,
 * a completed task is neither overdue nor upcoming however old its deadline, overdue tasks come
 * back worst-first, and scheduling against another hospital's equipment is refused.</p>
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Maintenance calendar")
class MaintenanceCalendarServiceTest {

    private static final String USERNAME = "hospital_admin";
    private static final Long HOSPITAL_ID = 10L;

    @Mock
    private EquipmentRepository equipmentRepository;

    @Mock
    private MaintenanceTaskRepository maintenanceTaskRepository;

    @Mock
    private HospitalRepository hospitalRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private MaintenanceCalendarService calendarService;

    private Hospital hospital;

    @BeforeEach
    void setUp() {
        User user = User.builder().id(1L).username(USERNAME).build();
        hospital = Hospital.builder().id(HOSPITAL_ID).name("City General").user(user).build();
        lenient().when(userRepository.findByUsername(USERNAME)).thenReturn(Optional.of(user));
        lenient().when(hospitalRepository.findByUserId(1L)).thenReturn(Optional.of(hospital));
    }

    private Equipment equipment(Long id) {
        return Equipment.builder()
                .id(id)
                .name("Ventilator " + id)
                .equipmentCode("EQ-00" + id)
                .build();
    }

    private MaintenanceTask task(Long id, LocalDate deadline, MaintenanceStatus status) {
        return MaintenanceTask.builder()
                .id(id)
                .taskCode("MNT-" + id)
                .equipmentId("EQ-001")
                .equipment("Ventilator 1")
                .equipmentRecord(equipment(1L))
                .hospital("City General")
                .hospitalId(HOSPITAL_ID)
                .maintenanceType("Preventive")
                .deadline(deadline)
                .status(status)
                .build();
    }

    @Test
    @DisplayName("the calendar counts partition the schedule and flag overdue rows")
    void calendarCountsPartitionTheSchedule() {
        LocalDate today = LocalDate.now();
        when(maintenanceTaskRepository.findByHospitalId(HOSPITAL_ID)).thenReturn(List.of(
                task(1L, today.minusDays(5), MaintenanceStatus.SCHEDULED),
                task(2L, today.plusDays(3), MaintenanceStatus.IN_PROGRESS),
                task(3L, today.minusDays(40), MaintenanceStatus.COMPLETED)));

        MaintenanceCalendarResponse response = calendarService.getCalendar(USERNAME);

        assertEquals(3, response.getTotalSchedules());
        assertEquals(1, response.getScheduled());
        assertEquals(1, response.getInProgress());
        assertEquals(1, response.getCompleted());
        assertEquals(
                response.getTotalSchedules(),
                response.getScheduled() + response.getInProgress() + response.getCompleted(),
                "the status bands must partition the schedule");

        // Only the open task that is past its deadline is overdue.
        assertEquals(1, response.getTotalOverdue());
        assertEquals(1, response.getTotalUpcoming());
        assertEquals(today, response.getDate());
    }

    @Test
    @DisplayName("a completed task is never overdue, however old its deadline")
    void completedWorkIsNotOverdue() {
        LocalDate today = LocalDate.now();
        when(maintenanceTaskRepository.findByHospitalId(HOSPITAL_ID)).thenReturn(List.of(
                task(1L, today.minusYears(2), MaintenanceStatus.COMPLETED)));

        MaintenanceCalendarResponse response = calendarService.getCalendar(USERNAME);

        assertEquals(0, response.getTotalOverdue());
        assertFalse(response.getSchedules().get(0).isOverdue());
        assertFalse(response.getSchedules().get(0).isUpcoming());
    }

    @Test
    @DisplayName("the calendar is ordered by deadline")
    void calendarIsOrderedByDeadline() {
        LocalDate today = LocalDate.now();
        when(maintenanceTaskRepository.findByHospitalId(HOSPITAL_ID)).thenReturn(List.of(
                task(1L, today.plusDays(10), MaintenanceStatus.SCHEDULED),
                task(2L, today.plusDays(2), MaintenanceStatus.SCHEDULED)));

        MaintenanceCalendarResponse response = calendarService.getCalendar(USERNAME);

        assertEquals(2L, response.getSchedules().get(0).getId());
        assertEquals(1L, response.getSchedules().get(1).getId());
    }

    @Test
    @DisplayName("upcoming drops work that is already complete")
    void upcomingExcludesCompletedWork() {
        LocalDate today = LocalDate.now();
        when(maintenanceTaskRepository.findByHospitalIdAndDeadlineBetween(
                any(), any(), any())).thenReturn(List.of(
                task(1L, today.plusDays(4), MaintenanceStatus.SCHEDULED),
                task(2L, today.plusDays(6), MaintenanceStatus.COMPLETED)));

        UpcomingMaintenanceResponse response = calendarService.getUpcoming(USERNAME);

        assertEquals(1, response.getTotalUpcoming());
        assertEquals(1, response.getSchedules().size());
        assertEquals(1L, response.getSchedules().get(0).getId());
        assertEquals(today, response.getWindowStart());
        assertEquals(today.plusDays(30), response.getWindowEnd());
    }

    @Test
    @DisplayName("overdue tasks come back longest overdue first")
    void overdueIsRankedByAge() {
        LocalDate today = LocalDate.now();
        when(maintenanceTaskRepository.findOverdueByHospitalId(HOSPITAL_ID, today)).thenReturn(List.of(
                task(1L, today.minusDays(3), MaintenanceStatus.SCHEDULED),
                task(2L, today.minusDays(21), MaintenanceStatus.IN_PROGRESS)));

        OverdueMaintenanceResponse response = calendarService.getOverdue(USERNAME);

        assertEquals(2, response.getTotalOverdue());
        assertEquals(21, response.getMaxDaysOverdue());
        assertEquals(2L, response.getSchedules().get(0).getTask().getId());
        assertEquals(21, response.getSchedules().get(0).getDaysOverdue());
        assertEquals(3, response.getSchedules().get(1).getDaysOverdue());
    }

    @Test
    @DisplayName("nothing overdue reports zero rather than an empty maximum")
    void emptyOverdueListHasZeroMaximum() {
        when(maintenanceTaskRepository.findOverdueByHospitalId(any(), any()))
                .thenReturn(List.of());

        OverdueMaintenanceResponse response = calendarService.getOverdue(USERNAME);

        assertEquals(0, response.getTotalOverdue());
        assertEquals(0, response.getMaxDaysOverdue());
        assertTrue(response.getSchedules().isEmpty());
    }

    @Test
    @DisplayName("scheduling stores the deadline and derives the next occurrence")
    void scheduleStoresDeadlineAndRecurrence() {
        LocalDate due = LocalDate.now().plusDays(14);
        when(equipmentRepository.findByIdAndHospitalId(1L, HOSPITAL_ID))
                .thenReturn(Optional.of(equipment(1L)));
        when(maintenanceTaskRepository.save(any(MaintenanceTask.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        MaintenanceScheduleRequest request = MaintenanceScheduleRequest.builder()
                .equipmentId(1L)
                .maintenanceType("  Preventive  ")
                .scheduledDate(due)
                .assignedTechnician("tech@medtrack.com")
                .priority("High")
                .recurrencePeriodDays(90)
                .build();

        MaintenanceScheduleResponse response = calendarService.createSchedule(request, USERNAME);

        ArgumentCaptor<MaintenanceTask> saved = ArgumentCaptor.forClass(MaintenanceTask.class);
        verify(maintenanceTaskRepository).save(saved.capture());

        assertEquals(due, saved.getValue().getDeadline());
        assertEquals("Preventive", saved.getValue().getMaintenanceType());
        assertEquals(HOSPITAL_ID, saved.getValue().getHospitalId());
        assertEquals(MaintenanceStatus.SCHEDULED, saved.getValue().getStatus());

        assertEquals(due, response.getScheduledDate());
        assertEquals(due.plusDays(90), response.getNextMaintenanceDate());
        assertTrue(response.isUpcoming());
    }

    @Test
    @DisplayName("a one-off task has no next occurrence")
    void oneOffTaskHasNoNextOccurrence() {
        LocalDate due = LocalDate.now().plusDays(5);
        when(equipmentRepository.findByIdAndHospitalId(1L, HOSPITAL_ID))
                .thenReturn(Optional.of(equipment(1L)));
        when(maintenanceTaskRepository.save(any(MaintenanceTask.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        MaintenanceScheduleResponse response = calendarService.createSchedule(
                MaintenanceScheduleRequest.builder()
                        .equipmentId(1L)
                        .maintenanceType("Calibration")
                        .scheduledDate(due)
                        .build(),
                USERNAME);

        assertNull(response.getNextMaintenanceDate());
    }

    @Test
    @DisplayName("scheduling against another hospital's equipment is refused")
    void cannotScheduleAgainstAnotherHospitalsEquipment() {
        when(equipmentRepository.findByIdAndHospitalId(99L, HOSPITAL_ID))
                .thenReturn(Optional.empty());

        MaintenanceScheduleRequest request = MaintenanceScheduleRequest.builder()
                .equipmentId(99L)
                .maintenanceType("Preventive")
                .scheduledDate(LocalDate.now().plusDays(1))
                .build();

        assertThrows(ResourceNotFoundException.class,
                () -> calendarService.createSchedule(request, USERNAME));
        verify(maintenanceTaskRepository, org.mockito.Mockito.never()).save(any());
    }

    @Test
    @DisplayName("a user with no hospital profile cannot read a calendar")
    void userWithoutHospitalIsRejected() {
        when(hospitalRepository.findByUserId(1L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> calendarService.getCalendar(USERNAME));
    }
}

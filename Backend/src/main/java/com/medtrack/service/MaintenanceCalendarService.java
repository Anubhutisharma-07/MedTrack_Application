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
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

/**
 * Calendar view over the maintenance schedule of one hospital.
 *
 * <p>Every read resolves the hospital from the authenticated user first and every query is scoped
 * to that hospital, so the calendar cannot surface another tenant's schedule.</p>
 *
 * <p>A task's scheduled date is its {@code deadline}: the date the work is due. Overdue and
 * upcoming are decided against a single "today" captured once per request, so the counts and the
 * per-row flags in one response can never disagree with each other.</p>
 */
@Service
@RequiredArgsConstructor
public class MaintenanceCalendarService {

    /** How far ahead {@code /upcoming} looks, in days. */
    private static final int UPCOMING_WINDOW_DAYS = 30;

    private final EquipmentRepository equipmentRepository;
    private final MaintenanceTaskRepository maintenanceTaskRepository;
    private final HospitalRepository hospitalRepository;
    private final UserRepository userRepository;

    /** The whole schedule for the caller's hospital, with the counts across it. */
    @Transactional(readOnly = true)
    public MaintenanceCalendarResponse getCalendar(String username) {

        Hospital hospital = getHospitalForUser(username);
        LocalDate today = LocalDate.now();
        LocalDate windowEnd = today.plusDays(UPCOMING_WINDOW_DAYS);

        List<MaintenanceTask> tasks =
                maintenanceTaskRepository.findByHospitalId(hospital.getId());

        List<MaintenanceScheduleResponse> schedules = tasks.stream()
                .map(task -> toScheduleResponse(task, today, windowEnd))
                .sorted(Comparator.comparing(
                                MaintenanceScheduleResponse::getScheduledDate,
                                Comparator.nullsLast(Comparator.naturalOrder()))
                        .thenComparing(MaintenanceScheduleResponse::getId))
                .toList();

        MaintenanceCalendarResponse response = new MaintenanceCalendarResponse();
        response.setDate(today);
        response.setTotalSchedules(schedules.size());
        response.setScheduled(countByStatus(schedules, MaintenanceStatus.SCHEDULED));
        response.setInProgress(countByStatus(schedules, MaintenanceStatus.IN_PROGRESS));
        response.setCompleted(countByStatus(schedules, MaintenanceStatus.COMPLETED));
        response.setTotalOverdue(schedules.stream().filter(MaintenanceScheduleResponse::isOverdue).count());
        response.setTotalUpcoming(schedules.stream().filter(MaintenanceScheduleResponse::isUpcoming).count());
        response.setSchedules(schedules);

        return response;
    }

    /** Tasks falling due in the next {@value #UPCOMING_WINDOW_DAYS} days, soonest first. */
    @Transactional(readOnly = true)
    public UpcomingMaintenanceResponse getUpcoming(String username) {

        Hospital hospital = getHospitalForUser(username);
        LocalDate today = LocalDate.now();
        LocalDate windowEnd = today.plusDays(UPCOMING_WINDOW_DAYS);

        List<MaintenanceScheduleResponse> schedules =
                maintenanceTaskRepository
                        .findByHospitalIdAndDeadlineBetween(hospital.getId(), today, windowEnd)
                        .stream()
                        // Work that is already finished is not upcoming, however near its deadline.
                        .filter(task -> task.getStatus() != MaintenanceStatus.COMPLETED)
                        .map(task -> toScheduleResponse(task, today, windowEnd))
                        .toList();

        UpcomingMaintenanceResponse response = new UpcomingMaintenanceResponse();
        response.setWindowStart(today);
        response.setWindowEnd(windowEnd);
        response.setTotalUpcoming(schedules.size());
        response.setSchedules(schedules);

        return response;
    }

    /** Tasks past their deadline and not yet completed, longest overdue first. */
    @Transactional(readOnly = true)
    public OverdueMaintenanceResponse getOverdue(String username) {

        Hospital hospital = getHospitalForUser(username);
        LocalDate today = LocalDate.now();
        LocalDate windowEnd = today.plusDays(UPCOMING_WINDOW_DAYS);

        List<OverdueMaintenanceResponse.OverdueMaintenanceItem> items =
                maintenanceTaskRepository.findOverdueByHospitalId(hospital.getId(), today).stream()
                        .map(task -> OverdueMaintenanceResponse.OverdueMaintenanceItem.builder()
                                .task(toScheduleResponse(task, today, windowEnd))
                                .daysOverdue(daysOverdue(task.getDeadline(), today))
                                .build())
                        .sorted(Comparator.comparingLong(
                                OverdueMaintenanceResponse.OverdueMaintenanceItem::getDaysOverdue)
                                .reversed())
                        .toList();

        OverdueMaintenanceResponse response = new OverdueMaintenanceResponse();
        response.setAsOf(today);
        response.setTotalOverdue(items.size());
        response.setMaxDaysOverdue(items.isEmpty() ? 0 : items.get(0).getDaysOverdue());
        response.setSchedules(items);

        return response;
    }

    /**
     * Schedules a task against equipment the caller's hospital owns.
     *
     * <p>The equipment is looked up by id <em>and</em> hospital id rather than by id alone, so a
     * request naming another tenant's equipment is a 404 rather than a cross-tenant write.</p>
     */
    @Transactional
    public MaintenanceScheduleResponse createSchedule(
            MaintenanceScheduleRequest request,
            String username) {

        Hospital hospital = getHospitalForUser(username);

        Equipment equipment = equipmentRepository
                .findByIdAndHospitalId(request.getEquipmentId(), hospital.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Equipment not found"));

        LocalDate today = LocalDate.now();

        MaintenanceTask task = MaintenanceTask.builder()
                .taskCode("MNT-" + UUID.randomUUID())
                .equipmentId(equipment.getEquipmentCode())
                .equipment(equipment.getName())
                .equipmentRecord(equipment)
                .hospital(hospital.getName())
                .hospitalId(hospital.getId())
                .maintenanceType(request.getMaintenanceType().trim())
                .description(request.getDescription())
                .deadline(request.getScheduledDate())
                .assignedTechnician(request.getAssignedTechnician())
                .priority(request.getPriority())
                .notes(request.getNotes())
                .recurrencePeriodDays(request.getRecurrencePeriodDays())
                .status(MaintenanceStatus.SCHEDULED)
                .createdAt(LocalDateTime.now())
                .build();

        MaintenanceTask saved = maintenanceTaskRepository.save(task);

        return toScheduleResponse(saved, today, today.plusDays(UPCOMING_WINDOW_DAYS));
    }

    /**
     * Maps a task onto its calendar row. {@code today} and {@code windowEnd} are passed in rather
     * than read here so that every row in one response is classified against the same instant.
     */
    private MaintenanceScheduleResponse toScheduleResponse(
            MaintenanceTask task,
            LocalDate today,
            LocalDate windowEnd) {

        LocalDate deadline = task.getDeadline();
        boolean completed = task.getStatus() == MaintenanceStatus.COMPLETED;

        MaintenanceScheduleResponse response = new MaintenanceScheduleResponse();

        response.setId(task.getId());
        response.setTaskCode(task.getTaskCode());
        // equipmentRecord is a lazy association and is never null - the column is non-nullable -
        // but the denormalised name is read from the task itself so the calendar does not force
        // one extra select per row just to render a label.
        response.setEquipmentId(task.getEquipmentRecordId());
        response.setEquipmentName(task.getEquipment());
        response.setMaintenanceType(task.getMaintenanceType());
        response.setDescription(task.getDescription());
        response.setAssignedTechnician(task.getAssignedTechnician());
        response.setPriority(task.getPriority());
        response.setStatus(task.getStatus());
        response.setScheduledDate(deadline);
        response.setRecurrencePeriodDays(task.getRecurrencePeriodDays());
        response.setNextMaintenanceDate(nextOccurrence(deadline, task.getRecurrencePeriodDays()));
        response.setNotes(task.getNotes());

        response.setOverdue(!completed && deadline != null && deadline.isBefore(today));
        response.setUpcoming(!completed
                && deadline != null
                && !deadline.isBefore(today)
                && !deadline.isAfter(windowEnd));

        return response;
    }

    private static LocalDate nextOccurrence(LocalDate deadline, Integer recurrencePeriodDays) {
        if (deadline == null || recurrencePeriodDays == null || recurrencePeriodDays <= 0) {
            return null;
        }
        return deadline.plusDays(recurrencePeriodDays);
    }

    private static long daysOverdue(LocalDate deadline, LocalDate today) {
        if (deadline == null || !deadline.isBefore(today)) {
            return 0;
        }
        return ChronoUnit.DAYS.between(deadline, today);
    }

    private static long countByStatus(
            List<MaintenanceScheduleResponse> schedules,
            MaintenanceStatus status) {

        return schedules.stream().filter(item -> item.getStatus() == status).count();
    }

    private Hospital getHospitalForUser(String username) {

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return hospitalRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Hospital profile not found"));
    }
}

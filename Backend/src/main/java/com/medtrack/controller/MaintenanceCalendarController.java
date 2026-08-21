package com.medtrack.controller;

import com.medtrack.dto.MaintenanceCalendarResponse;
import com.medtrack.dto.MaintenanceScheduleRequest;
import com.medtrack.dto.MaintenanceScheduleResponse;
import com.medtrack.dto.OverdueMaintenanceResponse;
import com.medtrack.dto.UpcomingMaintenanceResponse;
import com.medtrack.service.MaintenanceCalendarService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/maintenance")
@RequiredArgsConstructor
public class MaintenanceCalendarController {

    private final MaintenanceCalendarService maintenanceCalendarService;

    @GetMapping("/calendar")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<MaintenanceCalendarResponse> getCalendar(
            Principal principal
    ) {

        return ResponseEntity.ok(
                maintenanceCalendarService.getCalendar(
                        principal.getName()
                )
        );

    }

    @GetMapping("/upcoming")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<UpcomingMaintenanceResponse> getUpcoming(
            Principal principal
    ) {

        return ResponseEntity.ok(
                maintenanceCalendarService.getUpcoming(
                        principal.getName()
                )
        );

    }

    @GetMapping("/overdue")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<OverdueMaintenanceResponse> getOverdue(
            Principal principal
    ) {

        return ResponseEntity.ok(
                maintenanceCalendarService.getOverdue(
                        principal.getName()
                )
        );

    }

    // @Valid was missing, so the constraints declared on MaintenanceScheduleRequest were never
    // enforced: a body with no equipment id or no date reached the service and failed there.
    @PostMapping("/schedule")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<MaintenanceScheduleResponse> createSchedule(
            @Valid @RequestBody MaintenanceScheduleRequest request,
            Principal principal
    ) {

        return ResponseEntity.status(HttpStatus.CREATED).body(
                maintenanceCalendarService.createSchedule(
                        request,
                        principal.getName()
                )
        );

    }

}
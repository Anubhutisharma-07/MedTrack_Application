package com.medtrack.controller;

import com.medtrack.dto.PredictiveRestockItemResponse;
import com.medtrack.dto.PredictiveSupplyForecastResponse;
import com.medtrack.service.PredictiveSupplyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/predictive-supply")
@RequiredArgsConstructor
public class PredictiveSupplyController {
    private final PredictiveSupplyService predictiveSupplyService;

    @GetMapping("/forecasts")
    @PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIAN', 'MANAGER')")
    public ResponseEntity<List<PredictiveSupplyForecastResponse>> getDemandForecasts(Principal principal) {
        return ResponseEntity.ok(predictiveSupplyService.getDemandForecasts(principal.getName()));
    }

    @GetMapping("/restock-alerts")
    @PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIAN', 'MANAGER')")
    public ResponseEntity<List<PredictiveRestockItemResponse>> getRestockAlerts(Principal principal) {
        return ResponseEntity.ok(predictiveSupplyService.getRestockAlerts(principal.getName()));
    }

    @PostMapping("/run-restock-job")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> triggerRestockJob() {
        predictiveSupplyService.automatedRestockingJob();
        return ResponseEntity.noContent().build();
    }
}

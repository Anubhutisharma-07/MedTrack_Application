package com.medtrack.supplier.controller;

import com.medtrack.supplier.dto.*;
import com.medtrack.supplier.security.SupplierAccessGuard;
import com.medtrack.supplier.service.DashboardService;
import com.medtrack.supplier.service.prediction.PredictionService;
import com.medtrack.supplier.service.prediction.RecommendationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/supplier/dashboard")
@RequiredArgsConstructor
@Tag(name = "Supplier Dashboard API", description = "Endpoints for supplier dashboard and operational insights")
public class DashboardController {

    private final DashboardService dashboardService;
    private final PredictionService predictionService;
    private final RecommendationService recommendationService;
    private final SupplierAccessGuard supplierAccessGuard;

    private Long resolveSupplierId(Authentication authentication) {
        return supplierAccessGuard.resolveCallerId(authentication);
    }

    @GetMapping
    @PreAuthorize("hasRole('SUPPLIER')")
    @Operation(summary = "Get Full Dashboard", description = "Aggregates all dashboard metrics for the logged-in supplier")
    public ResponseEntity<DashboardResponse> getDashboard(Authentication authentication) {
        return ResponseEntity.ok(dashboardService.getDashboard(resolveSupplierId(authentication)));
    }

    @GetMapping("/summary")
    @PreAuthorize("hasRole('SUPPLIER')")
    @Operation(summary = "Get Dashboard Summary", description = "Retrieves high-level summary of order statuses")
    public ResponseEntity<DashboardSummary> getSummary(Authentication authentication) {
        return ResponseEntity.ok(dashboardService.getSummary(resolveSupplierId(authentication)));
    }

    @GetMapping("/performance")
    @PreAuthorize("hasRole('SUPPLIER')")
    @Operation(summary = "Get Supplier Performance", description = "Retrieves performance score and rating")
    public ResponseEntity<SupplierPerformance> getPerformance(Authentication authentication) {
        return ResponseEntity.ok(dashboardService.getPerformanceScore(resolveSupplierId(authentication)));
    }

    @GetMapping("/delays")
    @PreAuthorize("hasRole('SUPPLIER')")
    @Operation(summary = "Get Delay Analytics", description = "Retrieves delay metrics and percentage for shipments")
    public ResponseEntity<DelayAnalytics> getDelayAnalytics(Authentication authentication) {
        DashboardResponse response = dashboardService.getDashboard(resolveSupplierId(authentication));
        return ResponseEntity.ok(response.getDelayAnalytics());
    }

    @GetMapping("/shipments")
    @PreAuthorize("hasRole('SUPPLIER')")
    @Operation(summary = "Get Shipment Statistics", description = "Retrieves overarching shipment statistics and success rates")
    public ResponseEntity<ShipmentStatistics> getShipmentStatistics(Authentication authentication) {
        DashboardResponse response = dashboardService.getDashboard(resolveSupplierId(authentication));
        return ResponseEntity.ok(response.getShipmentStatistics());
    }

    @GetMapping("/statistics")
    @PreAuthorize("hasRole('SUPPLIER')")
    @Operation(summary = "Get Order Statistics API compatibility endpoint", description = "Maps to overall dashboard response or stats summary")
    public ResponseEntity<DashboardResponse> getStatistics(Authentication authentication) {
        // As per Step 2: "GET /api/supplier/dashboard/statistics"
        return ResponseEntity.ok(dashboardService.getDashboard(resolveSupplierId(authentication)));
    }

    @GetMapping("/reports/monthly")
    @PreAuthorize("hasRole('SUPPLIER')")
    @Operation(summary = "Get Monthly Order Summary", description = "Generates monthly shipments report")
    public ResponseEntity<java.util.List<MonthlyShipmentReport>> getMonthlyOrderSummary(Authentication authentication) {
        return ResponseEntity.ok(dashboardService.getMonthlyReports(resolveSupplierId(authentication)));
    }

    @GetMapping("/reports/status-distribution")
    @PreAuthorize("hasRole('SUPPLIER')")
    @Operation(summary = "Get Shipment Status Distribution", description = "Generates distribution of shipment statuses")
    public ResponseEntity<java.util.Map<String, Long>> getStatusDistribution(Authentication authentication) {
        return ResponseEntity.ok(dashboardService.getStatusDistribution(resolveSupplierId(authentication)));
    }

    @GetMapping("/reports/delayed")
    @PreAuthorize("hasRole('SUPPLIER')")
    @Operation(summary = "Get Delayed Shipments Report", description = "Generates report of delayed shipments")
    public ResponseEntity<java.util.List<ShipmentTrackingResponse>> getDelayedShipments(Authentication authentication) {
        return ResponseEntity.ok(dashboardService.getDelayedShipmentsReport(resolveSupplierId(authentication)));
    }

    // Phase 15: Predictive Analytics Endpoints

    @GetMapping("/prediction/daily")
    @PreAuthorize("hasRole('SUPPLIER')")
    @Operation(summary = "Get Daily Forecast", description = "Generates daily shipment volume forecast")
    public ResponseEntity<PredictionDTO> getDailyForecast(Authentication authentication) {
        return ResponseEntity.ok(predictionService.getDailyForecast(resolveSupplierId(authentication)));
    }

    @GetMapping("/prediction/weekly")
    @PreAuthorize("hasRole('SUPPLIER')")
    @Operation(summary = "Get Weekly Forecast", description = "Generates weekly shipment volume forecast")
    public ResponseEntity<PredictionDTO> getWeeklyForecast(Authentication authentication) {
        return ResponseEntity.ok(predictionService.getWeeklyForecast(resolveSupplierId(authentication)));
    }

    @GetMapping("/prediction/delay-probability")
    @PreAuthorize("hasRole('SUPPLIER')")
    @Operation(summary = "Get Delay Probability", description = "Calculates overall delay probability for the supplier")
    public ResponseEntity<PredictionDTO> getDelayProbability(Authentication authentication) {
        return ResponseEntity.ok(predictionService.getDelayProbability(resolveSupplierId(authentication)));
    }

    @GetMapping("/risk-analysis/{orderId}")
    @PreAuthorize("hasRole('SUPPLIER')")
    @Operation(summary = "Get Shipment Risk Analysis", description = "Analyzes risk level for a specific shipment")
    public ResponseEntity<ShipmentRiskDTO> getRiskAnalysis(
            @org.springframework.web.bind.annotation.PathVariable Long orderId,
            Authentication authentication) {
        return ResponseEntity.ok(predictionService.calculateShipmentRisk(resolveSupplierId(authentication), orderId));
    }

    @GetMapping("/trends")
    @PreAuthorize("hasRole('SUPPLIER')")
    @Operation(summary = "Get Performance Trends", description = "Yields historical analytic trends")
    public ResponseEntity<TrendAnalysisDTO> getPerformanceTrends(Authentication authentication) {
        return ResponseEntity.ok(predictionService.getTrendAnalysis(resolveSupplierId(authentication)));
    }

    @GetMapping("/recommendations")
    @PreAuthorize("hasRole('SUPPLIER')")
    @Operation(summary = "Get Smart Recommendations", description = "Generates system recommendations for operational improvement")
    public ResponseEntity<java.util.List<RecommendationDTO>> getRecommendations(Authentication authentication) {
        return ResponseEntity.ok(recommendationService.getRecommendations(resolveSupplierId(authentication)));
    }
}

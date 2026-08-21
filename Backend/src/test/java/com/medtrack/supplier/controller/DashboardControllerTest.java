package com.medtrack.supplier.controller;

import com.medtrack.supplier.dto.*;
import com.medtrack.supplier.security.SupplierAccessGuard;
import com.medtrack.supplier.service.DashboardService;
import com.medtrack.supplier.service.prediction.PredictionService;
import com.medtrack.supplier.service.prediction.RecommendationService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DashboardControllerTest {

    private static final Long SUPPLIER_ID = 42L;
    private static final Long ORDER_ID = 9001L;

    @Mock
    private DashboardService dashboardService;

    @Mock
    private PredictionService predictionService;

    @Mock
    private RecommendationService recommendationService;

    @Mock
    private SupplierAccessGuard supplierAccessGuard;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private DashboardController dashboardController;

    @Test
    void coreDashboardEndpointsUseAuthenticatedSupplierId() {
        DashboardResponse dashboard = DashboardResponse.builder().build();
        DashboardSummary summary = DashboardSummary.builder().build();
        SupplierPerformance performance = SupplierPerformance.builder().build();
        resolveAuthenticatedSupplier();
        when(dashboardService.getDashboard(SUPPLIER_ID)).thenReturn(dashboard);
        when(dashboardService.getSummary(SUPPLIER_ID)).thenReturn(summary);
        when(dashboardService.getPerformanceScore(SUPPLIER_ID)).thenReturn(performance);

        assertSame(dashboard, dashboardController.getDashboard(authentication).getBody());
        assertSame(summary, dashboardController.getSummary(authentication).getBody());
        assertSame(performance, dashboardController.getPerformance(authentication).getBody());

        verify(supplierAccessGuard, times(3)).resolveCallerId(authentication);
        verify(dashboardService).getDashboard(SUPPLIER_ID);
        verify(dashboardService).getSummary(SUPPLIER_ID);
        verify(dashboardService).getPerformanceScore(SUPPLIER_ID);
    }

    @Test
    void derivedDashboardEndpointsRemainScopedToAuthenticatedSupplier() {
        DelayAnalytics delays = DelayAnalytics.builder().build();
        ShipmentStatistics shipments = ShipmentStatistics.builder().build();
        DashboardResponse dashboard = DashboardResponse.builder()
                .delayAnalytics(delays)
                .shipmentStatistics(shipments)
                .build();
        resolveAuthenticatedSupplier();
        when(dashboardService.getDashboard(SUPPLIER_ID)).thenReturn(dashboard);

        assertSame(delays, dashboardController.getDelayAnalytics(authentication).getBody());
        assertSame(shipments, dashboardController.getShipmentStatistics(authentication).getBody());
        assertSame(dashboard, dashboardController.getStatistics(authentication).getBody());

        verify(supplierAccessGuard, times(3)).resolveCallerId(authentication);
        verify(dashboardService, times(3)).getDashboard(SUPPLIER_ID);
    }

    @Test
    void reportEndpointsUseAuthenticatedSupplierId() {
        List<MonthlyShipmentReport> monthlyReports = List.of(MonthlyShipmentReport.builder().build());
        Map<String, Long> statusDistribution = Map.of("DELIVERED", 7L);
        List<ShipmentTrackingResponse> delayedShipments =
                List.of(ShipmentTrackingResponse.builder().id(12L).build());
        resolveAuthenticatedSupplier();
        when(dashboardService.getMonthlyReports(SUPPLIER_ID)).thenReturn(monthlyReports);
        when(dashboardService.getStatusDistribution(SUPPLIER_ID)).thenReturn(statusDistribution);
        when(dashboardService.getDelayedShipmentsReport(SUPPLIER_ID)).thenReturn(delayedShipments);

        assertSame(monthlyReports, dashboardController.getMonthlyOrderSummary(authentication).getBody());
        assertSame(statusDistribution, dashboardController.getStatusDistribution(authentication).getBody());
        assertSame(delayedShipments, dashboardController.getDelayedShipments(authentication).getBody());

        verify(supplierAccessGuard, times(3)).resolveCallerId(authentication);
        verify(dashboardService).getMonthlyReports(SUPPLIER_ID);
        verify(dashboardService).getStatusDistribution(SUPPLIER_ID);
        verify(dashboardService).getDelayedShipmentsReport(SUPPLIER_ID);
    }

    @Test
    void predictionEndpointsUseAuthenticatedSupplierId() {
        PredictionDTO daily = PredictionDTO.builder().category("DAILY").build();
        PredictionDTO weekly = PredictionDTO.builder().category("WEEKLY").build();
        PredictionDTO delayProbability = PredictionDTO.builder().category("DELAY").build();
        TrendAnalysisDTO trends = TrendAnalysisDTO.builder().build();
        resolveAuthenticatedSupplier();
        when(predictionService.getDailyForecast(SUPPLIER_ID)).thenReturn(daily);
        when(predictionService.getWeeklyForecast(SUPPLIER_ID)).thenReturn(weekly);
        when(predictionService.getDelayProbability(SUPPLIER_ID)).thenReturn(delayProbability);
        when(predictionService.getTrendAnalysis(SUPPLIER_ID)).thenReturn(trends);

        assertSame(daily, dashboardController.getDailyForecast(authentication).getBody());
        assertSame(weekly, dashboardController.getWeeklyForecast(authentication).getBody());
        assertSame(delayProbability, dashboardController.getDelayProbability(authentication).getBody());
        assertSame(trends, dashboardController.getPerformanceTrends(authentication).getBody());

        verify(supplierAccessGuard, times(4)).resolveCallerId(authentication);
        verify(predictionService).getDailyForecast(SUPPLIER_ID);
        verify(predictionService).getWeeklyForecast(SUPPLIER_ID);
        verify(predictionService).getDelayProbability(SUPPLIER_ID);
        verify(predictionService).getTrendAnalysis(SUPPLIER_ID);
    }

    @Test
    void riskAndRecommendationEndpointsUseAuthenticatedSupplierId() {
        ShipmentRiskDTO risk = ShipmentRiskDTO.builder().orderId(ORDER_ID).build();
        List<RecommendationDTO> recommendations = List.of(RecommendationDTO.builder().build());
        resolveAuthenticatedSupplier();
        when(predictionService.calculateShipmentRisk(SUPPLIER_ID, ORDER_ID)).thenReturn(risk);
        when(recommendationService.getRecommendations(SUPPLIER_ID)).thenReturn(recommendations);

        assertSame(risk, dashboardController.getRiskAnalysis(ORDER_ID, authentication).getBody());
        assertSame(recommendations, dashboardController.getRecommendations(authentication).getBody());

        verify(supplierAccessGuard, times(2)).resolveCallerId(authentication);
        verify(predictionService).calculateShipmentRisk(SUPPLIER_ID, ORDER_ID);
        verify(recommendationService).getRecommendations(SUPPLIER_ID);
    }

    @Test
    void unresolvedAuthenticatedIdentityFailsClosed() {
        AccessDeniedException failure = new AccessDeniedException("Authenticated user could not be resolved");
        when(supplierAccessGuard.resolveCallerId(authentication)).thenThrow(failure);

        AccessDeniedException thrown = assertThrows(
                AccessDeniedException.class,
                () -> dashboardController.getDashboard(authentication));

        assertSame(failure, thrown);
        verifyNoInteractions(dashboardService, predictionService, recommendationService);
    }

    @Test
    void missingAuthenticationNeverFallsBackToAnotherSupplier() {
        AccessDeniedException failure = new AccessDeniedException("Authenticated user could not be resolved");
        when(supplierAccessGuard.resolveCallerId(null)).thenThrow(failure);

        AccessDeniedException thrown = assertThrows(
                AccessDeniedException.class,
                () -> dashboardController.getSummary(null));

        assertSame(failure, thrown);
        verify(supplierAccessGuard).resolveCallerId(null);
        verifyNoInteractions(dashboardService, predictionService, recommendationService);
    }

    private void resolveAuthenticatedSupplier() {
        when(supplierAccessGuard.resolveCallerId(authentication)).thenReturn(SUPPLIER_ID);
    }
}

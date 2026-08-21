package com.medtrack.supplier.metrics;

import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class MetricsServiceTest {

    private SimpleMeterRegistry meterRegistry;
    private MetricsService metricsService;

    @BeforeEach
    void setUp() {
        meterRegistry = new SimpleMeterRegistry();
        metricsService = new MetricsService(meterRegistry);
    }

    @Test
    void testIncrementOrdersProcessed() {
        metricsService.incrementOrdersProcessed();
        metricsService.incrementOrdersProcessed();

        assertEquals(2.0, meterRegistry.counter("supplier.orders.processed.total").count());
    }

    @Test
    void testRecordProcessingLatency() throws Exception {
        Object result = metricsService.recordProcessingLatency("testOperation", () -> {
            Thread.sleep(10);
            return "success";
        });

        assertEquals("success", result);
        assertEquals(1, meterRegistry.timer("supplier.processing.latency", "operation", "testOperation").count());
    }
}

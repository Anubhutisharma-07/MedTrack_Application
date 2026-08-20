package com.medtrack.supplier.metrics;

import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.springframework.stereotype.Service;

import java.util.concurrent.Callable;

@Service
public class MetricsService {

    private final MeterRegistry meterRegistry;

    public MetricsService(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
    }

    public void incrementOrdersProcessed() {
        meterRegistry.counter("supplier.orders.processed.total").increment();
    }

    public void incrementShipmentsCompleted() {
        meterRegistry.counter("supplier.shipments.completed.total").increment();
    }

    public void incrementDelayedShipments() {
        meterRegistry.counter("supplier.shipments.delayed.total").increment();
    }

    public void incrementKafkaPublish() {
        meterRegistry.counter("kafka.publish.total").increment();
    }

    public void incrementKafkaConsume() {
        meterRegistry.counter("kafka.consume.total").increment();
    }

    public void incrementSupplierPerformanceUpdates() {
        meterRegistry.counter("supplier.performance.updates.total").increment();
    }

    public void incrementFailedRequests() {
        meterRegistry.counter("supplier.requests.failed.total").increment();
    }

    public <T> T recordProcessingLatency(String operationName, Callable<T> callable) throws Exception {
        Timer timer = meterRegistry.timer("supplier.processing.latency", "operation", operationName);
        return timer.recordCallable(callable);
    }
}

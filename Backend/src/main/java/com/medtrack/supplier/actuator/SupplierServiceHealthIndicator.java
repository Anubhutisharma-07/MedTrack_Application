package com.medtrack.supplier.actuator;

import org.springframework.boot.health.contributor.Health;
import org.springframework.boot.health.contributor.HealthIndicator;
import org.springframework.stereotype.Component;

@Component
public class SupplierServiceHealthIndicator implements HealthIndicator {

    @Override
    public Health health() {
        // Implement custom health check logic here
        // For instance, we could verify critical dependencies (like internal queues,
        // external integrations that aren't natively supported)
        boolean isRunning = checkSupplierServiceHealth();

        if (isRunning) {
            return Health.up()
                    .withDetail("SupplierService", "Available")
                    .withDetail("Processing", "Active")
                    .build();
        } else {
            return Health.down()
                    .withDetail("SupplierService", "Degraded")
                    .build();
        }
    }

    private boolean checkSupplierServiceHealth() {
        // Simulated health check logic
        return true;
    }
}

package com.medtrack.health;

import org.springframework.boot.health.contributor.Health;
import org.springframework.boot.health.contributor.HealthIndicator;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.SQLException;

/**
 * Custom health indicator that checks database connectivity.
 * Verifies the database is reachable and returns safe status information.
 * Never exposes credentials, connection strings, passwords, or sensitive database details.
 */
@Component
public class DatabaseHealthIndicator implements HealthIndicator {

    private final DataSource dataSource;

    public DatabaseHealthIndicator(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public Health health() {
        try (Connection connection = dataSource.getConnection()) {
            DatabaseMetaData metaData = connection.getMetaData();
            
            String databaseProductName = metaData.getDatabaseProductName();
            
            return Health.up()
                    .withDetail("database", databaseProductName)
                    .build();
        } catch (SQLException e) {
            return Health.down()
                    .withDetail("error", "Database connectivity check failed")
                    .withDetail("reason", e.getClass().getSimpleName())
                    .build();
        }
    }
}
package com.medtrack.health;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.health.contributor.Health;
import org.springframework.boot.health.contributor.Status;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.SQLException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@DisplayName("Database health indicator")
class DatabaseHealthIndicatorTest {

    private DataSource dataSource;
    private Connection connection;
    private DatabaseMetaData databaseMetaData;
    private ApplicationContextRunner contextRunner;

    @BeforeEach
    void setUp() throws SQLException {
        dataSource = mock(DataSource.class);
        connection = mock(Connection.class);
        databaseMetaData = mock(DatabaseMetaData.class);

        when(dataSource.getConnection()).thenReturn(connection);
        when(connection.getMetaData()).thenReturn(databaseMetaData);

        contextRunner = new ApplicationContextRunner()
                .withBean(DataSource.class, () -> dataSource)
                .withBean(DatabaseHealthIndicator.class);
    }

    @Test
    @DisplayName("healthy database returns UP")
    void healthyDatabaseReturnsUp() throws SQLException {
        when(databaseMetaData.getDatabaseProductName()).thenReturn("H2");

        contextRunner.run(context -> {
            DatabaseHealthIndicator indicator = context.getBean(DatabaseHealthIndicator.class);
            Health health = indicator.health();

            assertThat(health.getStatus()).isEqualTo(Status.UP);
            assertThat(health.getDetails()).containsKey("database");
            assertThat(health.getDetails().get("database")).isEqualTo("H2");
        });
    }

    @Test
    @DisplayName("database connectivity failure returns DOWN")
    void databaseConnectivityFailureReturnsDown() throws SQLException {
        when(dataSource.getConnection()).thenThrow(new SQLException("Connection failed"));

        contextRunner.run(context -> {
            DatabaseHealthIndicator indicator = context.getBean(DatabaseHealthIndicator.class);
            Health health = indicator.health();

            assertThat(health.getStatus()).isEqualTo(Status.DOWN);
            assertThat(health.getDetails()).containsKey("error");
            assertThat(health.getDetails().get("error")).isEqualTo("Database connectivity check failed");
            assertThat(health.getDetails()).containsKey("reason");
        });
    }

    @Test
    @DisplayName("health response contains expected safe status information")
    void healthResponseContainsExpectedSafeStatusInformation() throws SQLException {
        when(databaseMetaData.getDatabaseProductName()).thenReturn("MySQL");

        contextRunner.run(context -> {
            DatabaseHealthIndicator indicator = context.getBean(DatabaseHealthIndicator.class);
            Health health = indicator.health();

            assertThat(health.getStatus()).isEqualTo(Status.UP);
            assertThat(health.getDetails()).hasSize(1);
            assertThat(health.getDetails()).containsKey("database");
            assertThat(health.getDetails().get("database")).isEqualTo("MySQL");
        });
    }

    @Test
    @DisplayName("sensitive database information is not exposed")
    void sensitiveDatabaseInformationIsNotExposed() throws SQLException {
        when(databaseMetaData.getDatabaseProductName()).thenReturn("PostgreSQL");

        contextRunner.run(context -> {
            DatabaseHealthIndicator indicator = context.getBean(DatabaseHealthIndicator.class);
            Health health = indicator.health();

            assertThat(health.getStatus()).isEqualTo(Status.UP);
            assertThat(health.getDetails()).hasSize(1);
            assertThat(health.getDetails()).containsKey("database");
            assertThat(health.getDetails()).doesNotContainKey("url");
            assertThat(health.getDetails()).doesNotContainKey("username");
            assertThat(health.getDetails()).doesNotContainKey("password");
            assertThat(health.getDetails()).doesNotContainKey("connectionString");
        });
    }

    @Test
    @DisplayName("metadata access failure returns DOWN")
    void metadataAccessFailureReturnsDown() throws SQLException {
        when(connection.getMetaData()).thenThrow(new SQLException("Metadata unavailable"));

        contextRunner.run(context -> {
            DatabaseHealthIndicator indicator = context.getBean(DatabaseHealthIndicator.class);
            Health health = indicator.health();

            assertThat(health.getStatus()).isEqualTo(Status.DOWN);
            assertThat(health.getDetails()).containsKey("error");
        });
    }
}
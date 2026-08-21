package com.medtrack.migration;

import com.medtrack.model.RecallNotice;
import jakarta.persistence.Column;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.lang.reflect.Field;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Contract tests for the migration that introduces medical-device recall notices.
 *
 * <p>The application normally lets Hibernate update tables that have not yet been adopted by
 * Flyway. Recall notices are different: V20 creates their table before Hibernate starts. These
 * tests therefore exercise V20 as an actual Flyway migration and keep its database contract in
 * step with both the entity mapping and the equivalent MySQL script.</p>
 */
class RecallNoticeMigrationIntegrationTest {

    private static final String TABLE = "RECALL_NOTICE";
    private static final Set<String> REQUIRED_COLUMNS = Set.of(
            "MANUFACTURER",
            "RECALL_REFERENCE",
            "RECALL_DATE",
            "REASON",
            "SEVERITY",
            "CREATED_AT",
            "UPDATED_AT");
    private static final Set<String> OPTIONAL_COLUMNS = Set.of(
            "MODEL_NUMBER",
            "SERIAL_NUMBER",
            "SERIAL_NUMBER_START",
            "SERIAL_NUMBER_END",
            "LOT_NUMBER",
            "MANUFACTURER_INSTRUCTIONS",
            "RESOLUTION_DEADLINE");

    @Test
    void v20RunsFromAProductionLikeVersionNineteenBaseline() throws Exception {
        String url = databaseAtVersionNineteen();

        int migrationsExecuted = migrate(url);

        assertEquals(1, migrationsExecuted);
        try (Connection connection = connect(url)) {
            assertTrue(tableExists(connection, TABLE));
            assertEquals("20", successfulMigrationVersion(connection));
        }
    }

    @Test
    void v20CreatesEveryColumnExpectedByTheRecallEntity() throws Exception {
        String url = migratedDatabase();

        try (Connection connection = connect(url)) {
            Map<String, ColumnMetadata> columns = columns(connection);

            assertEquals(Set.of(
                    "ID",
                    "MANUFACTURER",
                    "MODEL_NUMBER",
                    "SERIAL_NUMBER",
                    "SERIAL_NUMBER_START",
                    "SERIAL_NUMBER_END",
                    "LOT_NUMBER",
                    "RECALL_REFERENCE",
                    "RECALL_DATE",
                    "REASON",
                    "SEVERITY",
                    "MANUFACTURER_INSTRUCTIONS",
                    "RESOLUTION_DEADLINE",
                    "CREATED_AT",
                    "UPDATED_AT"), columns.keySet());

            assertEquals(entityColumnNames(), columns.keySet());
        }
    }

    @Test
    void v20PreservesEntityStringLengthLimits() throws Exception {
        String url = migratedDatabase();

        try (Connection connection = connect(url)) {
            Map<String, ColumnMetadata> columns = columns(connection);

            assertLength(columns, "MANUFACTURER", 255);
            assertLength(columns, "MODEL_NUMBER", 255);
            assertLength(columns, "SERIAL_NUMBER", 255);
            assertLength(columns, "SERIAL_NUMBER_START", 255);
            assertLength(columns, "SERIAL_NUMBER_END", 255);
            assertLength(columns, "LOT_NUMBER", 255);
            assertLength(columns, "RECALL_REFERENCE", 255);
            assertLength(columns, "REASON", 2000);
            assertLength(columns, "SEVERITY", 30);
            assertLength(columns, "MANUFACTURER_INSTRUCTIONS", 4000);
        }
    }

    @Test
    void v20MakesRequiredEntityColumnsNonNullable() throws Exception {
        String url = migratedDatabase();

        try (Connection connection = connect(url)) {
            Map<String, ColumnMetadata> columns = columns(connection);

            for (String name : REQUIRED_COLUMNS) {
                assertFalse(columns.get(name).nullable(), name + " must be NOT NULL");
                assertThrows(SQLException.class, () -> insertWithout(connection, name), name);
            }
        }
    }

    @Test
    void v20AllowsAllOptionalRecallMatchingCriteriaToBeNull() throws Exception {
        String url = migratedDatabase();

        try (Connection connection = connect(url);
             Statement statement = connection.createStatement()) {
            Map<String, ColumnMetadata> columns = columns(connection);
            for (String name : OPTIONAL_COLUMNS) {
                assertTrue(columns.get(name).nullable(), name + " must remain optional");
            }

            statement.executeUpdate(validInsert("REF-MINIMAL"));
            try (ResultSet result = statement.executeQuery("SELECT * FROM recall_notice")) {
                assertTrue(result.next());
                for (String name : OPTIONAL_COLUMNS) {
                    assertNull(result.getObject(name), name);
                }
            }
        }
    }

    @Test
    void v20ConfiguresThePrimaryKeyForDatabaseGeneratedIdentityValues() throws Exception {
        String url = migratedDatabase();

        try (Connection connection = connect(url);
             Statement statement = connection.createStatement()) {
            ColumnMetadata id = columns(connection).get("ID");
            assertTrue(id.autoIncrement());
            assertFalse(id.nullable());

            statement.executeUpdate(validInsert("REF-FIRST"));
            statement.executeUpdate(validInsert("REF-SECOND"));
            try (ResultSet result = statement.executeQuery(
                    "SELECT id FROM recall_notice ORDER BY id")) {
                assertTrue(result.next());
                assertEquals(1L, result.getLong("id"));
                assertTrue(result.next());
                assertEquals(2L, result.getLong("id"));
            }
        }
    }

    @Test
    void h2AndMysqlV20ScriptsStayLogicallyIdentical() {
        String h2 = normalizedMigration("h2");
        String mysql = normalizedMigration("mysql");

        assertEquals(h2, mysql,
                "Recall schema drifted between H2 verification and MySQL production migrations");
        assertTrue(h2.startsWith("create table recall_notice ("));
        assertTrue(h2.endsWith(");"));
    }

    private static String migratedDatabase() throws Exception {
        String url = databaseAtVersionNineteen();
        migrate(url);
        return url;
    }

    private static String databaseAtVersionNineteen() throws SQLException {
        String url = "jdbc:h2:mem:recall-migration-" + UUID.randomUUID()
                + ";MODE=MySQL;DATABASE_TO_UPPER=TRUE;DB_CLOSE_DELAY=-1";
        try (Connection connection = connect(url);
             Statement statement = connection.createStatement()) {
            // A non-empty schema makes Flyway record the configured V19 baseline before applying V20.
            statement.execute("CREATE TABLE deployment_marker (id INT PRIMARY KEY)");
        }
        return url;
    }

    private static int migrate(String url) {
        return Flyway.configure()
                .dataSource(url, "sa", "")
                .locations("classpath:db/migration/h2")
                .baselineOnMigrate(true)
                .baselineVersion("19")
                .target("20")
                .load()
                .migrate()
                .migrationsExecuted;
    }

    private static Connection connect(String url) throws SQLException {
        return DriverManager.getConnection(url, "sa", "");
    }

    private static boolean tableExists(Connection connection, String table) throws SQLException {
        try (ResultSet result = connection.getMetaData().getTables(
                null, null, table, new String[]{"TABLE"})) {
            return result.next();
        }
    }

    private static String successfulMigrationVersion(Connection connection) throws SQLException {
        try (Statement statement = connection.createStatement();
             ResultSet result = statement.executeQuery("""
                     SELECT "version"
                     FROM "flyway_schema_history"
                     WHERE "success" = TRUE AND "type" = 'SQL'
                     ORDER BY "installed_rank" DESC
                     LIMIT 1
                     """)) {
            assertTrue(result.next());
            return result.getString("version");
        }
    }

    private static Map<String, ColumnMetadata> columns(Connection connection) throws SQLException {
        DatabaseMetaData metadata = connection.getMetaData();
        Map<String, ColumnMetadata> columns = new LinkedHashMap<>();
        try (ResultSet result = metadata.getColumns(null, null, TABLE, null)) {
            while (result.next()) {
                columns.put(result.getString("COLUMN_NAME"), new ColumnMetadata(
                        result.getInt("COLUMN_SIZE"),
                        result.getInt("NULLABLE") == DatabaseMetaData.columnNullable,
                        "YES".equals(result.getString("IS_AUTOINCREMENT"))));
            }
        }
        return columns;
    }

    private static Set<String> entityColumnNames() {
        return java.util.Arrays.stream(RecallNotice.class.getDeclaredFields())
                .filter(field -> !field.isSynthetic())
                .map(RecallNoticeMigrationIntegrationTest::entityColumnName)
                .map(name -> name.toUpperCase(Locale.ROOT))
                .collect(Collectors.toSet());
    }

    private static String entityColumnName(Field field) {
        Column column = field.getAnnotation(Column.class);
        if (column != null && !column.name().isBlank()) {
            return column.name();
        }
        return camelToSnake(field.getName());
    }

    private static String camelToSnake(String value) {
        return value.replaceAll("([a-z0-9])([A-Z])", "$1_$2").toLowerCase(Locale.ROOT);
    }

    private static void assertLength(Map<String, ColumnMetadata> columns, String name, int length) {
        assertEquals(length, columns.get(name).length(), name);
    }

    private static void insertWithout(Connection connection, String omittedColumn) throws SQLException {
        List<String> columns = REQUIRED_COLUMNS.stream()
                .filter(column -> !column.equals(omittedColumn))
                .sorted()
                .toList();
        String values = columns.stream()
                .map(RecallNoticeMigrationIntegrationTest::validSqlValue)
                .collect(Collectors.joining(", "));
        try (Statement statement = connection.createStatement()) {
            statement.executeUpdate("INSERT INTO recall_notice (%s) VALUES (%s)".formatted(
                    String.join(", ", columns), values));
        }
    }

    private static String validSqlValue(String column) {
        return switch (column) {
            case "RECALL_DATE" -> "DATE '2026-08-01'";
            case "CREATED_AT", "UPDATED_AT" -> "TIMESTAMP '2026-08-01 10:00:00'";
            default -> "'required-value'";
        };
    }

    private static String validInsert(String reference) {
        return """
                INSERT INTO recall_notice (
                    manufacturer, recall_reference, recall_date, reason, severity, created_at, updated_at
                ) VALUES (
                    'MedTech', '%s', DATE '2026-08-01', 'Safety correction', 'HIGH',
                    TIMESTAMP '2026-08-01 10:00:00', TIMESTAMP '2026-08-01 10:00:00'
                )
                """.formatted(reference);
    }

    private static String normalizedMigration(String vendor) {
        String sql = readMigration(vendor)
                .replaceAll("(?m)^\\s*--.*$", "")
                .replaceAll("(?s)/\\*.*?\\*/", "")
                .replaceAll("\\s+", " ")
                .trim();
        return sql.toLowerCase(Locale.ROOT);
    }

    private static String readMigration(String vendor) {
        Path modulePath = Paths.get("src", "main", "resources", "db", "migration", vendor,
                "V20__add_recall_notices.sql");
        Path path = Files.isRegularFile(modulePath)
                ? modulePath
                : Paths.get("Backend").resolve(modulePath);
        try {
            return Files.readString(path, StandardCharsets.UTF_8);
        } catch (IOException exception) {
            throw new UncheckedIOException("Unable to read recall migration " + path, exception);
        }
    }

    private record ColumnMetadata(int length, boolean nullable, boolean autoIncrement) {
    }
}

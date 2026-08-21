package com.medtrack.config;

import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.model.Equipment;
import com.medtrack.model.EquipmentOrder;
import com.medtrack.model.Hospital;
import com.medtrack.model.MaintenanceTask;
import com.medtrack.repository.EquipmentOrderRepository;
import com.medtrack.repository.EquipmentRepository;
import com.medtrack.repository.HospitalRepository;
import com.medtrack.repository.MaintenanceTaskRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.security.crypto.password.PasswordEncoder;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.SQLException;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * Verifies the two safety boundaries around repository-known demo credentials: initialization is
 * opt-in, and an explicitly enabled initializer still refuses every database except H2.
 */
@DisplayName("Demo data initializer security boundaries")
class DataInitializerTest {

    private UserRepository userRepository;
    private HospitalRepository hospitalRepository;
    private EquipmentRepository equipmentRepository;
    private MaintenanceTaskRepository maintenanceTaskRepository;
    private EquipmentOrderRepository equipmentOrderRepository;
    private PasswordEncoder passwordEncoder;
    private DataSource dataSource;
    private Connection connection;
    private DatabaseMetaData databaseMetaData;

    private ApplicationContextRunner contextRunner;

    @BeforeEach
    void setUp() throws SQLException {
        userRepository = mock(UserRepository.class);
        hospitalRepository = mock(HospitalRepository.class);
        equipmentRepository = mock(EquipmentRepository.class);
        maintenanceTaskRepository = mock(MaintenanceTaskRepository.class);
        equipmentOrderRepository = mock(EquipmentOrderRepository.class);
        passwordEncoder = mock(PasswordEncoder.class);
        dataSource = mock(DataSource.class);
        connection = mock(Connection.class);
        databaseMetaData = mock(DatabaseMetaData.class);

        when(dataSource.getConnection()).thenReturn(connection);
        when(connection.getMetaData()).thenReturn(databaseMetaData);

        contextRunner = new ApplicationContextRunner()
                .withUserConfiguration(DataInitializer.class)
                .withBean(UserRepository.class, () -> userRepository)
                .withBean(HospitalRepository.class, () -> hospitalRepository)
                .withBean(EquipmentRepository.class, () -> equipmentRepository)
                .withBean(MaintenanceTaskRepository.class, () -> maintenanceTaskRepository)
                .withBean(EquipmentOrderRepository.class, () -> equipmentOrderRepository)
                .withBean(PasswordEncoder.class, () -> passwordEncoder)
                .withBean(DataSource.class, () -> dataSource);
    }

    @Test
    @DisplayName("initializer bean is absent when the property is missing")
    void initializerIsDisabledWhenPropertyIsMissing() {
        contextRunner.run(context -> {
            assertThat(context).doesNotHaveBean(DataInitializer.class);
            verifyNoRepositoryInteractions();
        });
    }

    @Test
    @DisplayName("initializer bean is absent when the property is explicitly false")
    void initializerIsDisabledWhenPropertyIsFalse() {
        contextRunner
                .withPropertyValues("app.data-initializer.enabled=false")
                .run(context -> {
                    assertThat(context).doesNotHaveBean(DataInitializer.class);
                    verifyNoRepositoryInteractions();
                });
    }

    @Test
    @DisplayName("initializer bean is created only after an explicit opt-in")
    void initializerIsCreatedWhenPropertyIsTrue() {
        contextRunner
                .withPropertyValues("app.data-initializer.enabled=true")
                .run(context -> assertThat(context).hasSingleBean(DataInitializer.class));
    }

    @Test
    @DisplayName("enabled initializer rejects MySQL before the first repository call")
    void initializerRejectsPersistentDatabaseBeforeWriting() throws SQLException {
        when(databaseMetaData.getURL()).thenReturn("jdbc:mysql://db.example/medtrack");

        withEnabledInitializer(initializer -> {
            assertThatThrownBy(initializer::run)
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("restricted to H2")
                    .hasMessageContaining("jdbc:mysql://db.example/medtrack");

            verifyNoRepositoryInteractions();
        });
    }

    @Test
    @DisplayName("enabled initializer rejects an unavailable JDBC URL")
    void initializerRejectsUnavailableDatabaseIdentity() throws SQLException {
        when(databaseMetaData.getURL()).thenReturn(null);

        withEnabledInitializer(initializer -> {
            assertThatThrownBy(initializer::run)
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("active JDBC URL was unavailable");

            verifyNoRepositoryInteractions();
        });
    }

    @Test
    @DisplayName("database inspection failures stop initialization and preserve the cause")
    void initializerPreservesDatabaseInspectionFailure() throws SQLException {
        SQLException inspectionFailure = new SQLException("metadata unavailable");
        when(dataSource.getConnection()).thenThrow(inspectionFailure);

        withEnabledInitializer(initializer -> {
            assertThatThrownBy(initializer::run)
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessage("Unable to verify the database before demo data initialization")
                    .hasCause(inspectionFailure);

            verifyNoRepositoryInteractions();
        });
    }

    @Test
    @DisplayName("explicitly enabled H2 initialization creates the complete demo dataset")
    void initializerSeedsCompleteDatasetOnH2() throws SQLException {
        when(databaseMetaData.getURL()).thenReturn("JDBC:H2:mem:medtrack-test");

        User hospitalUser = User.builder()
                .id(1L)
                .email("hospital@medtrack.com")
                .name("Admin User")
                .build();
        User technician = User.builder()
                .id(2L)
                .email("tech@medtrack.com")
                .build();
        Hospital hospital = Hospital.builder()
                .id(10L)
                .name("City General Hospital")
                .user(hospitalUser)
                .build();
        Equipment mriScanner = Equipment.builder()
                .id(20L)
                .equipmentCode("EQ-1001")
                .name("MRI Scanner X100")
                .hospital(hospital)
                .build();
        Equipment ventilator = Equipment.builder()
                .id(21L)
                .equipmentCode("EQ-1002")
                .name("Portable Ventilator")
                .hospital(hospital)
                .build();

        when(userRepository.findByEmail("hospital@medtrack.com"))
                .thenReturn(Optional.empty(), Optional.of(hospitalUser));
        when(userRepository.findByEmail("tech@medtrack.com"))
                .thenReturn(Optional.empty(), Optional.of(technician));
        when(userRepository.findByEmail("supplier@medtrack.com"))
                .thenReturn(Optional.empty());
        when(hospitalRepository.findByUserId(1L)).thenReturn(Optional.empty());
        when(hospitalRepository.save(any(Hospital.class))).thenReturn(hospital);
        when(equipmentRepository.findByEquipmentCode("EQ-1001"))
                .thenReturn(Optional.empty(), Optional.of(mriScanner));
        when(equipmentRepository.findByEquipmentCode("EQ-1002"))
                .thenReturn(Optional.empty(), Optional.of(ventilator));
        when(maintenanceTaskRepository.count()).thenReturn(0L);
        when(equipmentOrderRepository.count()).thenReturn(0L);
        when(passwordEncoder.encode(any())).thenReturn("encoded-demo-password");

        withEnabledInitializer(initializer -> {
            initializer.run();

            verify(passwordEncoder, times(3)).encode(any());
            verify(userRepository, times(3)).save(any(User.class));
            verify(hospitalRepository).save(any(Hospital.class));
            verify(equipmentRepository, times(2)).save(any(Equipment.class));
            verify(maintenanceTaskRepository, times(2)).save(any(MaintenanceTask.class));
            verify(equipmentOrderRepository).save(any(EquipmentOrder.class));
        });
    }

    @Test
    @DisplayName("re-running enabled H2 initialization leaves existing demo data unchanged")
    void initializerIsIdempotentWhenDemoDataAlreadyExists() throws SQLException {
        when(databaseMetaData.getURL()).thenReturn("jdbc:h2:file:./medtrack-demo");

        User hospitalUser = User.builder()
                .id(1L)
                .email("hospital@medtrack.com")
                .build();
        User technician = User.builder()
                .id(2L)
                .email("tech@medtrack.com")
                .build();
        Hospital hospital = Hospital.builder()
                .id(10L)
                .name("City General Hospital")
                .user(hospitalUser)
                .build();

        when(userRepository.findByEmail("hospital@medtrack.com"))
                .thenReturn(Optional.of(hospitalUser));
        when(userRepository.findByEmail("tech@medtrack.com"))
                .thenReturn(Optional.of(technician));
        when(userRepository.findByEmail("supplier@medtrack.com"))
                .thenReturn(Optional.of(User.builder().id(3L).build()));
        when(hospitalRepository.findByUserId(1L)).thenReturn(Optional.of(hospital));
        when(equipmentRepository.findByEquipmentCode("EQ-1001"))
                .thenReturn(Optional.of(Equipment.builder().id(20L).build()));
        when(equipmentRepository.findByEquipmentCode("EQ-1002"))
                .thenReturn(Optional.of(Equipment.builder().id(21L).build()));
        when(maintenanceTaskRepository.count()).thenReturn(2L);
        when(equipmentOrderRepository.count()).thenReturn(1L);

        withEnabledInitializer(initializer -> {
            initializer.run();

            verify(userRepository, never()).save(any(User.class));
            verify(hospitalRepository, never()).save(any(Hospital.class));
            verify(equipmentRepository, never()).save(any(Equipment.class));
            verify(maintenanceTaskRepository, never()).save(any(MaintenanceTask.class));
            verify(equipmentOrderRepository, never()).save(any(EquipmentOrder.class));
            verifyNoInteractions(passwordEncoder);
        });
    }

    private void withEnabledInitializer(InitializerAssertion assertion) {
        contextRunner
                .withPropertyValues("app.data-initializer.enabled=true")
                .run(context -> {
                    assertThat(context).hasSingleBean(DataInitializer.class);
                    assertion.accept(context.getBean(DataInitializer.class));
                });
    }

    private void verifyNoRepositoryInteractions() {
        verifyNoInteractions(
                userRepository,
                hospitalRepository,
                equipmentRepository,
                maintenanceTaskRepository,
                equipmentOrderRepository,
                passwordEncoder);
    }

    @FunctionalInterface
    private interface InitializerAssertion {
        void accept(DataInitializer initializer);
    }
}

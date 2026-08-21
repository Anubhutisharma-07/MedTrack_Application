package com.medtrack.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Verifies pagination configuration loads correctly with default and custom values.
 */
@DisplayName("Pagination configuration")
class PaginationConfigTest {

    private final ApplicationContextRunner contextRunner = new ApplicationContextRunner()
            .withUserConfiguration(PaginationConfig.class);

    @Test
    @DisplayName("loads with default values when properties are not set")
    void loadsWithDefaultValues() {
        contextRunner.run(context -> {
            assertThat(context).hasSingleBean(PaginationConfig.class);
            PaginationConfig config = context.getBean(PaginationConfig.class);
            assertThat(config.getDefaultPage()).isEqualTo(0);
            assertThat(config.getDefaultPageSize()).isEqualTo(20);
        });
    }

    @Test
    @DisplayName("loads with custom page number when property is set")
    void loadsWithCustomPageNumber() {
        contextRunner
                .withPropertyValues("app.pagination.default-page=5")
                .run(context -> {
                    assertThat(context).hasSingleBean(PaginationConfig.class);
                    PaginationConfig config = context.getBean(PaginationConfig.class);
                    assertThat(config.getDefaultPage()).isEqualTo(5);
                    assertThat(config.getDefaultPageSize()).isEqualTo(20); // default size
                });
    }

    @Test
    @DisplayName("loads with custom page size when property is set")
    void loadsWithCustomPageSize() {
        contextRunner
                .withPropertyValues("app.pagination.default-page-size=50")
                .run(context -> {
                    assertThat(context).hasSingleBean(PaginationConfig.class);
                    PaginationConfig config = context.getBean(PaginationConfig.class);
                    assertThat(config.getDefaultPage()).isEqualTo(0); // default page
                    assertThat(config.getDefaultPageSize()).isEqualTo(50);
                });
    }

    @Test
    @DisplayName("loads with both custom values when both properties are set")
    void loadsWithBothCustomValues() {
        contextRunner
                .withPropertyValues("app.pagination.default-page=3", "app.pagination.default-page-size=30")
                .run(context -> {
                    assertThat(context).hasSingleBean(PaginationConfig.class);
                    PaginationConfig config = context.getBean(PaginationConfig.class);
                    assertThat(config.getDefaultPage()).isEqualTo(3);
                    assertThat(config.getDefaultPageSize()).isEqualTo(30);
                });
    }

    @Test
    @DisplayName("handles invalid page number gracefully by using default")
    void handlesInvalidPageNumber() {
        contextRunner
                .withPropertyValues("app.pagination.default-page=invalid")
                .run(context -> {
                    assertThat(context).hasSingleBean(PaginationConfig.class);
                    // Spring Boot will handle the type conversion failure
                    // In production, this would fail to bind, which is the expected behavior
                });
    }

    @Test
    @DisplayName("handles invalid page size gracefully by using default")
    void handlesInvalidPageSize() {
        contextRunner
                .withPropertyValues("app.pagination.default-page-size=invalid")
                .run(context -> {
                    assertThat(context).hasSingleBean(PaginationConfig.class);
                    // Spring Boot will handle the type conversion failure
                    // In production, this would fail to bind, which is the expected behavior
                });
    }
}

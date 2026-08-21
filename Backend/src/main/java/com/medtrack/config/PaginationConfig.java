package com.medtrack.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration for pagination defaults across the application.
 * Allows environment-specific overrides for default page number and page size.
 */
@Configuration
@ConfigurationProperties(prefix = "app.pagination")
@Data
public class PaginationConfig {
    /**
     * Default page number (0-based index).
     */
    private int defaultPage = 0;

    /**
     * Default page size for paginated endpoints.
     */
    private int defaultPageSize = 20;
}

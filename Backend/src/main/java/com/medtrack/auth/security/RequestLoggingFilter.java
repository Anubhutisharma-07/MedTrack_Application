package com.medtrack.auth.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

/**
 * Lightweight request logging filter that assigns a correlation ID to every
 * incoming request and logs method, URI, status code, and duration.
 *
 * <p>The correlation ID is placed in both the request attribute and the
 * response header (X-Request-Id) so that frontend clients and log
 * aggregators can trace a single user action across services.</p>
 *
 * <p>Only API requests (paths starting with {@code /api/}) are logged to
 * avoid noise from static resource and SPA fallback requests.</p>
 */
@Component
public class RequestLoggingFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(RequestLoggingFilter.class);
    private static final String CORRELATION_ID_HEADER = "X-Request-Id";
    private static final String CORRELATION_ID_ATTR = "requestCorrelationId";

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String path = request.getRequestURI();

        // Only instrument API routes to avoid noise from static files
        if (!path.startsWith("/api/")) {
            filterChain.doFilter(request, response);
            return;
        }

        // Use client-supplied correlation ID if present, otherwise generate one
        String correlationId = request.getHeader(CORRELATION_ID_HEADER);
        if (correlationId == null || correlationId.isBlank()) {
            correlationId = UUID.randomUUID().toString();
        }
        request.setAttribute(CORRELATION_ID_ATTR, correlationId);
        response.setHeader(CORRELATION_ID_HEADER, correlationId);

        long startTime = System.currentTimeMillis();
        try {
            filterChain.doFilter(request, response);
        } finally {
            long duration = System.currentTimeMillis() - startTime;
            int status = response.getStatus();
            String method = request.getMethod();

            if (status >= 500) {
                log.error("[{}] {} {} -> {} ({}ms)", correlationId, method, path, status, duration);
            } else if (status >= 400) {
                log.warn("[{}] {} {} -> {} ({}ms)", correlationId, method, path, status, duration);
            } else {
                log.debug("[{}] {} {} -> {} ({}ms)", correlationId, method, path, status, duration);
            }
        }
    }
}

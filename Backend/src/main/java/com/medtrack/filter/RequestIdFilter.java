package com.medtrack.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

/**
 * RequestIdFilter generates a unique request ID for each incoming API request
 * and includes it in the response headers and application logs for tracing purposes.
 * 
 * <p>This filter:
 * <ul>
 *   <li>Generates a UUID-based request ID if not provided in the request headers</li>
 *   <li>Stores the request ID in MDC (Mapped Diagnostic Context) for logging</li>
 *   <li>Adds the request ID to the response headers</li>
 *   <li>Cleans up MDC after request processing</li>
 * </ul>
 * 
 * <p>The request ID is available throughout the request lifecycle and can be used
 * to correlate logs across different components for debugging and monitoring.</p>
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RequestIdFilter extends OncePerRequestFilter {

    public static final String REQUEST_ID_HEADER = "X-Request-Id";
    public static final String REQUEST_ID_LOG_VAR = "requestId";

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        String requestId = request.getHeader(REQUEST_ID_HEADER);
        
        if (requestId == null || requestId.isEmpty()) {
            requestId = UUID.randomUUID().toString();
        }

        MDC.put(REQUEST_ID_LOG_VAR, requestId);
        response.setHeader(REQUEST_ID_HEADER, requestId);

        try {
            filterChain.doFilter(request, response);
        } finally {
            MDC.remove(REQUEST_ID_LOG_VAR);
        }
    }
}

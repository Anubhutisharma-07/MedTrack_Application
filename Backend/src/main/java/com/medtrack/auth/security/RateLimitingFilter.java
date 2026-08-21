package com.medtrack.auth.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    @org.springframework.beans.factory.annotation.Autowired
    @org.springframework.context.annotation.Lazy
    private JwtUtil jwtUtil;

    @Value("${security.rate-limit.enabled:true}")
    private boolean enabled;

    @Value("${security.rate-limit.auth.capacity:10}")
    private int authCapacity = 10;

    @Value("${security.rate-limit.auth.refill-tokens:10}")
    private int authRefillTokens = 10;

    @Value("${security.rate-limit.auth.refill-duration:1m}")
    private String authRefillDurationStr = "1m";

    @Value("${security.rate-limit.get.capacity:100}")
    private int getCapacity = 100;

    @Value("${security.rate-limit.get.refill-tokens:100}")
    private int getRefillTokens = 100;

    @Value("${security.rate-limit.get.refill-duration:1m}")
    private String getRefillDurationStr = "1m";

    @Value("${security.rate-limit.write.capacity:30}")
    private int writeCapacity = 30;

    @Value("${security.rate-limit.write.refill-tokens:30}")
    private int writeRefillTokens = 30;

    @Value("${security.rate-limit.write.refill-duration:1m}")
    private String writeRefillDurationStr = "1m";

    /** Rate limiting capacity for AI assistant queries performed by technician accounts. */
    @Value("${security.rate-limit.ai.technician.capacity:10}")
    private int aiTechnicianCapacity = 10;

    /** Refill duration string for AI technician rate limiting bucket. */
    @Value("${security.rate-limit.ai.technician.refill-duration:1h}")
    private String aiTechnicianRefillDurationStr = "1h";

    /** Rate limiting capacity for AI assistant queries performed by admin accounts. */
    @Value("${security.rate-limit.ai.admin.capacity:50}")
    private int aiAdminCapacity = 50;

    /** Refill duration string for AI admin rate limiting bucket. */
    @Value("${security.rate-limit.ai.admin.refill-duration:1h}")
    private String aiAdminRefillDurationStr = "1h";

    /**
     * Peer addresses whose {@code X-Forwarded-For} header is trusted.
     *
     * <p>Empty by default, which means the header is ignored entirely and every request is keyed on
     * {@code getRemoteAddr()}. Defaulting to "trust nothing" is the safe direction: a deployment
     * behind a proxy that has not configured this rate-limits per-proxy, which is over-restrictive
     * and visible, whereas the previous behaviour was silently no rate limiting at all.</p>
     *
     * <p>Set to the proxy addresses, e.g.
     * {@code security.rate-limit.trusted-proxies=127.0.0.1,10.0.0.5}.</p>
     */
    @Value("${security.rate-limit.trusted-proxies:}")
    private String trustedProxiesRaw = "";

    /**
     * Maximum number of buckets held at once.
     *
     * <p>The cache was previously unbounded, so every distinct key created a permanent entry. With
     * the key derived from a client-supplied header, a single loop varying
     * {@code X-Forwarded-For} grew it without limit until the heap was exhausted - the same request
     * pattern that bypassed the limiter also took the process down.</p>
     */
    @Value("${security.rate-limit.max-tracked-clients:10000}")
    private int maxTrackedClients = 10000;

    /** Idle period after which a bucket is discarded. */
    @Value("${security.rate-limit.client-ttl:10m}")
    private String clientTtlStr = "10m";

    private Set<String> trustedProxies = Set.of();
    private Duration clientTtl = Duration.ofMinutes(10);

    private final ConcurrentHashMap<String, TrackedBucket> cache = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private Bandwidth authBandwidth;
    private Bandwidth getBandwidth;
    private Bandwidth writeBandwidth;
    private Bandwidth aiTechnicianBandwidth;
    private Bandwidth aiAdminBandwidth;

    @PostConstruct
    public void init() {
        int safeAuthCap = sanitizePositive(authCapacity, 10);
        int safeAuthRefill = sanitizePositive(authRefillTokens, 10);
        int safeGetCap = sanitizePositive(getCapacity, 100);
        int safeGetRefill = sanitizePositive(getRefillTokens, 100);
        int safeWriteCap = sanitizePositive(writeCapacity, 30);
        int safeWriteRefill = sanitizePositive(writeRefillTokens, 30);
        int safeAiTechCap = sanitizePositive(aiTechnicianCapacity, 10);
        int safeAiAdminCap = sanitizePositive(aiAdminCapacity, 50);

        String safeAuthDurationStr = sanitizeDuration(authRefillDurationStr, "1m");
        String safeGetDurationStr = sanitizeDuration(getRefillDurationStr, "1m");
        String safeWriteDurationStr = sanitizeDuration(writeRefillDurationStr, "1m");
        String safeAiTechDurationStr = sanitizeDuration(aiTechnicianRefillDurationStr, "1h");
        String safeAiAdminDurationStr = sanitizeDuration(aiAdminRefillDurationStr, "1h");

        this.authBandwidth = Bandwidth.classic(safeAuthCap, Refill.intervally(safeAuthRefill, parseDuration(safeAuthDurationStr)));
        this.getBandwidth = Bandwidth.classic(safeGetCap, Refill.intervally(safeGetRefill, parseDuration(safeGetDurationStr)));
        this.writeBandwidth = Bandwidth.classic(safeWriteCap, Refill.intervally(safeWriteRefill, parseDuration(safeWriteDurationStr)));
        this.aiTechnicianBandwidth = Bandwidth.classic(safeAiTechCap, Refill.intervally(safeAiTechCap, parseDuration(safeAiTechDurationStr)));
        this.aiAdminBandwidth = Bandwidth.classic(safeAiAdminCap, Refill.intervally(safeAiAdminCap, parseDuration(safeAiAdminDurationStr)));
        this.clientTtl = parseDuration(sanitizeDuration(clientTtlStr, "10m"));
        this.trustedProxies = parseTrustedProxies(trustedProxiesRaw);
    }

    private static int writeWriteRefillTokens(int tokens) {
        return tokens;
    }

    /**
     * Sanitizes integer capacity or refill token configuration values.
     *
     * <p>Ensures that uninitialized, zero, or negative configuration values fallback to a safe
     * positive integer, preventing {@code IllegalArgumentException} during bucket refill interval calculation.</p>
     *
     * @param value raw configuration value
     * @param fallback default positive integer value
     * @return safe positive integer value
     */
    private static int sanitizePositive(int value, int fallback) {
        return value > 0 ? value : fallback;
    }

    /**
     * Sanitizes raw duration configuration strings.
     *
     * <p>Validates that the provided duration string can be parsed by {@link #parseDuration(String)}.
     * If the raw string is null, blank, or malformed, falls back to a safe default string.</p>
     *
     * @param rawDuration raw duration string from Spring properties
     * @param fallback default valid duration string
     * @return safe valid duration string
     */
    private String sanitizeDuration(String rawDuration, String fallback) {
        if (rawDuration == null || rawDuration.isBlank()) {
            return fallback;
        }
        try {
            parseDuration(rawDuration);
            return rawDuration;
        } catch (Exception ex) {
            return fallback;
        }
    }

    static Set<String> parseTrustedProxies(String raw) {
        if (raw == null || raw.isBlank()) {
            return Set.of();
        }
        return Arrays.stream(raw.split(","))
                .map(String::trim)
                .filter(entry -> !entry.isEmpty())
                .collect(Collectors.toUnmodifiableSet());
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        if (!enabled) {
            filterChain.doFilter(request, response);
            return;
        }

        String path = request.getRequestURI().substring(request.getContextPath().length());
        String method = request.getMethod();

        if (path.startsWith("/api/")) {
            String group = resolveGroup(path, method);
            String key = resolveClientKey(request); // default to IP

            // Try to extract user info from JWT for all API requests
            String authHeader = request.getHeader("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);
                try {
                    String userId = jwtUtil.extractEmail(token);
                    if (userId != null) {
                        key = userId; // Override IP with authenticated user ID
                        
                        // Special handling for AI paths which have role-based limits
                        if (path.startsWith("/api/ai-assistant")) {
                            String role = jwtUtil.extractRole(token);
                            if (role != null) {
                                if (role.equalsIgnoreCase("TECHNICIAN")) {
                                    group = "ai_technician";
                                } else if (role.equalsIgnoreCase("HOSPITAL") || role.equalsIgnoreCase("ADMIN")) {
                                    group = "ai_admin";
                                }
                            }
                        }
                    }
                } catch (Exception e) {
                    // Ignore, let JwtAuthFilter handle invalid tokens later
                }
            }
            
            // Format key with group namespace
            String fullKey = group + ":" + key;

            Bucket bucket = resolveBucket(fullKey, group);
            metricsTracker.incrementEvaluated();
            io.github.bucket4j.ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);

            if (!probe.isConsumed()) {
                metricsTracker.incrementThrottled();
                long waitForRefillNanos = probe.getNanosToWaitForRefill();
                long waitForRefillSeconds = java.util.concurrent.TimeUnit.NANOSECONDS.toSeconds(waitForRefillNanos);
                // Ensure Retry-After is at least 1 second if greater than 0 nanos
                if (waitForRefillSeconds == 0 && waitForRefillNanos > 0) {
                    waitForRefillSeconds = 1;
                }
                response.setHeader("Retry-After", String.valueOf(waitForRefillSeconds));
                
                String message = path.startsWith("/api/ai-assistant") 
                    ? "AI Assistant request rate limit exceeded. Please try again later." 
                    : "API rate limit exceeded.";
                
                sendTooManyRequestsResponse(request, response, message);
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private String resolveGroup(String path, String method) {
        if ("POST".equalsIgnoreCase(method) && (
            "/api/auth/login".equals(path) ||
            "/api/auth/register".equals(path) ||
            "/api/auth/forgot-password".equals(path) ||
            "/api/auth/verify-otp".equals(path) ||
            "/api/auth/reset-password".equals(path) ||
            "/api/auth/refresh-token".equals(path)
        )) {
            return "auth";
        }
        if ("GET".equalsIgnoreCase(method)) {
            return "get";
        }
        return "write";
    }

    private Bandwidth resolveBandwidth(String group) {
        switch (group) {
            case "auth": return authBandwidth;
            case "get":  return getBandwidth;
            case "ai_technician": return aiTechnicianBandwidth;
            case "ai_admin": return aiAdminBandwidth;
            default:     return writeBandwidth;
        }
    }

    /**
     * Resolves the address to rate-limit on.
     *
     * <p>{@code X-Forwarded-For} is a plain request header that any client can set to anything, so
     * it is only consulted when the immediate peer is a configured trusted proxy. Previously it was
     * trusted unconditionally, which meant the rate-limit key was attacker-chosen: varying the header
     * per request produced a fresh full-capacity bucket every time and defeated the limit on
     * {@code /api/auth/login} entirely.</p>
     *
     * <p>When a trusted chain is present, the <strong>rightmost untrusted</strong> hop is taken, not
     * the leftmost. The leftmost entry is whatever the original client supplied and is therefore
     * still forgeable; only the entries appended by trusted infrastructure can be relied on.</p>
     */
    String resolveClientKey(HttpServletRequest request) {
        String peer = request.getRemoteAddr();

        if (trustedProxies.isEmpty() || peer == null || !trustedProxies.contains(peer)) {
            return peer == null ? "unknown" : peer;
        }

        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded == null || forwarded.isBlank() || "unknown".equalsIgnoreCase(forwarded)) {
            return peer;
        }

        String[] hops = forwarded.split(",");
        for (int index = hops.length - 1; index >= 0; index--) {
            String hop = hops[index].trim();
            if (!hop.isEmpty() && !trustedProxies.contains(hop)) {
                return hop;
            }
        }

        // Every hop in the chain is a trusted proxy; the peer is the best available identity.
        return peer;
    }

    /**
     * Returns the bucket for a key, bounding the cache.
     *
     * <p>Entries idle for longer than {@link #clientTtl} are discarded, and when the cache is at
     * {@link #maxTrackedClients} a sweep runs before inserting. If the sweep frees nothing - which
     * means every tracked client is currently active - the request is served from a shared overflow
     * bucket rather than growing the map. That degrades to a global limit under pressure instead of
     * either failing open (no limiting) or failing closed (rejecting everyone).</p>
     */
    private Bucket resolveBucket(String key, String group) {
        TrackedBucket tracked = cache.get(key);
        if (tracked != null) {
            tracked.touch();
            return tracked.bucket();
        }

        if (cache.size() >= maxTrackedClients) {
            evictIdle();
            if (cache.size() >= maxTrackedClients) {
                return overflowBucket(group);
            }
        }

        return cache.computeIfAbsent(key,
                        ignored -> {
                            metricsTracker.incrementBucketsCreated();
                            return new TrackedBucket(Bucket.builder().addLimit(resolveBandwidth(group)).build());
                        })
                .bucket();
    }

    private void evictIdle() {
        long cutoff = System.nanoTime() - clientTtl.toNanos();
        cache.entrySet().removeIf(entry -> {
            boolean evict = entry.getValue().lastSeenNanos() < cutoff;
            if (evict) {
                metricsTracker.incrementEvictions();
            }
            return evict;
        });
    }

    /**
     * Telemetry tracker maintaining runtime statistics for rate-limiting events.
     */
    public static class RateLimitMetricsTracker {
        private final java.util.concurrent.atomic.AtomicLong totalEvaluatedRequests = new java.util.concurrent.atomic.AtomicLong(0);
        private final java.util.concurrent.atomic.AtomicLong totalThrottledRequests = new java.util.concurrent.atomic.AtomicLong(0);
        private final java.util.concurrent.atomic.AtomicLong totalBucketsCreated = new java.util.concurrent.atomic.AtomicLong(0);
        private final java.util.concurrent.atomic.AtomicLong totalEvictions = new java.util.concurrent.atomic.AtomicLong(0);

        public void incrementEvaluated() {
            totalEvaluatedRequests.incrementAndGet();
        }

        public void incrementThrottled() {
            totalThrottledRequests.incrementAndGet();
        }

        public void incrementBucketsCreated() {
            totalBucketsCreated.incrementAndGet();
        }

        public void incrementEvictions() {
            totalEvictions.incrementAndGet();
        }

        public long getEvaluatedCount() {
            return totalEvaluatedRequests.get();
        }

        public long getThrottledCount() {
            return totalThrottledRequests.get();
        }

        public long getBucketsCreatedCount() {
            return totalBucketsCreated.get();
        }

        public long getEvictionsCount() {
            return totalEvictions.get();
        }

        public void reset() {
            totalEvaluatedRequests.set(0);
            totalThrottledRequests.set(0);
            totalBucketsCreated.set(0);
            totalEvictions.set(0);
        }
    }

    private final RateLimitMetricsTracker metricsTracker = new RateLimitMetricsTracker();

    /**
     * Returns the rate-limiting metrics tracker instance for telemetry inspection.
     *
     * @return current {@link RateLimitMetricsTracker}
     */
    public RateLimitMetricsTracker getMetricsTracker() {
        return metricsTracker;
    }

    private Bucket overflowBucket(String group) {
        return overflowBuckets.computeIfAbsent(group,
                ignored -> Bucket.builder().addLimit(resolveBandwidth(group)).build());
    }

    /** Buckets shared by all clients once {@link #maxTrackedClients} is reached. */
    private final ConcurrentHashMap<String, Bucket> overflowBuckets = new ConcurrentHashMap<>();

    /** Visible for tests: how many distinct clients are currently tracked. */
    int trackedClientCount() {
        return cache.size();
    }

    /** A bucket plus the last time it was used, so idle entries can be reclaimed. */
    private static final class TrackedBucket {
        private final Bucket bucket;
        private volatile long lastSeenNanos;

        private TrackedBucket(Bucket bucket) {
            this.bucket = bucket;
            this.lastSeenNanos = System.nanoTime();
        }

        private Bucket bucket() {
            return bucket;
        }

        private void touch() {
            this.lastSeenNanos = System.nanoTime();
        }

        private long lastSeenNanos() {
            return lastSeenNanos;
        }
    }

    private Duration parseDuration(String value) {
        if (value == null || value.trim().isEmpty()) {
            return Duration.ofMinutes(1);
        }
        value = value.trim().toLowerCase();
        if (value.endsWith("s")) {
            return Duration.ofSeconds(Long.parseLong(value.substring(0, value.length() - 1)));
        } else if (value.endsWith("m")) {
            return Duration.ofMinutes(Long.parseLong(value.substring(0, value.length() - 1)));
        } else if (value.endsWith("h")) {
            return Duration.ofHours(Long.parseLong(value.substring(0, value.length() - 1)));
        } else if (value.endsWith("d")) {
            return Duration.ofDays(Long.parseLong(value.substring(0, value.length() - 1)));
        } else {
            return Duration.ofSeconds(Long.parseLong(value));
        }
    }

    private void sendTooManyRequestsResponse(HttpServletRequest request, HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType("application/problem+json");
        response.setCharacterEncoding("UTF-8");

        Map<String, Object> errorDetails = new LinkedHashMap<>();
        errorDetails.put("type", "about:blank");
        errorDetails.put("title", "Too Many Requests");
        errorDetails.put("status", HttpStatus.TOO_MANY_REQUESTS.value());
        errorDetails.put("detail", message);
        errorDetails.put("instance", request.getRequestURI());
        errorDetails.put("timestamp", Instant.now().toString());

        objectMapper.writeValue(response.getWriter(), errorDetails);
        response.getWriter().flush();
    }
}

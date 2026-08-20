package com.medtrack.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.slf4j.MDC;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.io.IOException;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class RequestIdFilterTest {

    private RequestIdFilter filter;

    @BeforeEach
    void setUp() {
        filter = new RequestIdFilter();
        MDC.clear();
    }

    @AfterEach
    void tearDown() {
        MDC.clear();
    }

    @Test
    void testRequestIdGeneratedWhenAbsent() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain filterChain = mock(FilterChain.class);

        doAnswer(invocation -> {
            assertNotNull(MDC.get(RequestIdFilter.REQUEST_ID_LOG_VAR));
            return null;
        }).when(filterChain).doFilter(request, response);

        filter.doFilterInternal(request, response, filterChain);

        assertNotNull(response.getHeader(RequestIdFilter.REQUEST_ID_HEADER));
        assertNull(MDC.get(RequestIdFilter.REQUEST_ID_LOG_VAR), "MDC should be cleared after filter");
    }

    @Test
    void testExistingRequestIdPropagated() throws ServletException, IOException {
        String existingId = "test-request-id-123";
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader(RequestIdFilter.REQUEST_ID_HEADER, existingId);
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain filterChain = mock(FilterChain.class);

        doAnswer(invocation -> {
            assertEquals(existingId, MDC.get(RequestIdFilter.REQUEST_ID_LOG_VAR));
            return null;
        }).when(filterChain).doFilter(request, response);

        filter.doFilterInternal(request, response, filterChain);

        assertEquals(existingId, response.getHeader(RequestIdFilter.REQUEST_ID_HEADER));
    }

    @Test
    void testRequestIdIncludedInResponse() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain filterChain = mock(FilterChain.class);

        filter.doFilterInternal(request, response, filterChain);

        String requestId = response.getHeader(RequestIdFilter.REQUEST_ID_HEADER);
        assertNotNull(requestId);
        assertFalse(requestId.isEmpty());
    }

    @Test
    void testRequestIdAvailableDuringRequestProcessing() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain filterChain = mock(FilterChain.class);

        final String[] capturedRequestId = new String[1];

        doAnswer(invocation -> {
            capturedRequestId[0] = MDC.get(RequestIdFilter.REQUEST_ID_LOG_VAR);
            return null;
        }).when(filterChain).doFilter(request, response);

        filter.doFilterInternal(request, response, filterChain);

        assertNotNull(capturedRequestId[0]);
        assertEquals(capturedRequestId[0], response.getHeader(RequestIdFilter.REQUEST_ID_HEADER));
    }

    @Test
    void testMultipleRequestsReceiveDifferentIds() throws ServletException, IOException {
        Set<String> requestIds = new HashSet<>();
        int requestCount = 10;

        for (int i = 0; i < requestCount; i++) {
            MockHttpServletRequest request = new MockHttpServletRequest();
            MockHttpServletResponse response = new MockHttpServletResponse();
            FilterChain filterChain = mock(FilterChain.class);

            filter.doFilterInternal(request, response, filterChain);

            String requestId = response.getHeader(RequestIdFilter.REQUEST_ID_HEADER);
            assertNotNull(requestId);
            requestIds.add(requestId);
        }

        assertEquals(requestCount, requestIds.size(), "Each request should receive a unique ID");
    }

    @Test
    void testEmptyRequestIdHeaderGeneratesNewId() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader(RequestIdFilter.REQUEST_ID_HEADER, "");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain filterChain = mock(FilterChain.class);

        filter.doFilterInternal(request, response, filterChain);

        String requestId = response.getHeader(RequestIdFilter.REQUEST_ID_HEADER);
        assertNotNull(requestId);
        assertFalse(requestId.isEmpty());
        assertNotEquals("", requestId);
    }

    @Test
    void testGeneratedRequestIdIsValidUUID() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain filterChain = mock(FilterChain.class);

        filter.doFilterInternal(request, response, filterChain);

        String requestId = response.getHeader(RequestIdFilter.REQUEST_ID_HEADER);
        assertNotNull(requestId);
        
        assertDoesNotThrow(() -> UUID.fromString(requestId), 
            "Generated request ID should be a valid UUID");
    }

    @Test
    void testExistingApiBehaviorUnchanged() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/api/test");
        request.setMethod("GET");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain filterChain = mock(FilterChain.class);

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain, times(1)).doFilter(request, response);
        assertEquals(200, response.getStatus()); // Default status for MockHttpServletResponse
    }
}

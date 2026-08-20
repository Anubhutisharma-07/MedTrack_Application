package com.medtrack.supplier.exception;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;

import static org.junit.jupiter.api.Assertions.*;

class SupplierGlobalExceptionHandlerTest {

    private final SupplierGlobalExceptionHandler handler = new SupplierGlobalExceptionHandler();

    @Test
    void testHandleIllegalArgumentException() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/api/test");
        
        IllegalArgumentException ex = new IllegalArgumentException("Invalid argument");
        
        ResponseEntity<ProblemDetail> responseEntity = handler.handleIllegalArgumentException(ex, request);
        ProblemDetail response = responseEntity.getBody();
        
        assertEquals(HttpStatus.BAD_REQUEST.value(), response.getStatus());
        assertEquals("Bad Request", response.getTitle());
        assertEquals("Invalid argument", response.getDetail());
        assertNotNull(response.getProperties());
        assertEquals("/api/test", response.getProperties().get("path"));
    }

    @Test
    void testHandleGenericException() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/api/test-generic");

        Exception ex = new Exception("Unexpected error");
        
        ResponseEntity<ProblemDetail> responseEntity = handler.handleGenericException(ex, request);
        ProblemDetail response = responseEntity.getBody();

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR.value(), response.getStatus());
        assertEquals("Internal Server Error", response.getTitle());
        assertNotNull(response.getProperties());
        assertEquals("/api/test-generic", response.getProperties().get("path"));
    }
}

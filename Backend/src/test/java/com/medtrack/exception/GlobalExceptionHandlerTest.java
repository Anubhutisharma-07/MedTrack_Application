package com.medtrack.exception;

import jakarta.persistence.OptimisticLockException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.slf4j.MDC;
import org.springframework.core.MethodParameter;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpInputMessage;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Verifies that client mistakes keep useful 4xx responses while unexpected backend failures are
 * classified as 500 and never disclose their exception messages.
 */
@ExtendWith(MockitoExtension.class)
class GlobalExceptionHandlerTest {

    private static final String CORRELATION_ID = "error-test-correlation-id";

    private GlobalExceptionHandler handler;
    private MockHttpServletRequest request;

    @BeforeEach
    void setUp() {
        handler = new GlobalExceptionHandler();
        request = new MockHttpServletRequest("POST", "/api/equipment/42");
        MDC.put("correlationId", CORRELATION_ID);
    }

    @AfterEach
    void tearDown() {
        MDC.clear();
    }

    public void dummyMethod(String dummy) {
    }

    @Test
    void validationErrorsRemainFieldAddressableAndKeepFirstMessage() throws NoSuchMethodException {
        BindingResult bindingResult = mock(BindingResult.class);
        when(bindingResult.getFieldErrors()).thenReturn(List.of(
                new FieldError("equipment", "name", "Name is required"),
                new FieldError("equipment", "name", "Name is too short"),
                new FieldError("equipment", "quantity", "Quantity must be positive")));
        MethodParameter parameter = new MethodParameter(
                GlobalExceptionHandlerTest.class.getMethod("dummyMethod", String.class), 0);

        ResponseEntity<ProblemDetail> responseEntity = handler.handleValidationExceptions(
                new MethodArgumentNotValidException(parameter, bindingResult), request);
        ProblemDetail response = responseEntity.getBody();

        assertEquals(HttpStatus.BAD_REQUEST.value(), response.getStatus());
        assertEquals("Validation failed", response.getDetail());
        assertNotNull(response.getProperties());
        Map<String, String> errors = (Map<String, String>) response.getProperties().get("errors");
        assertEquals("Name is required", errors.get("name"));
        assertEquals("Quantity must be positive", errors.get("quantity"));
    }

    @Test
    void badCredentialsRemainUnauthorizedWithCompatibleMessage() {
        ResponseEntity<ProblemDetail> responseEntity = handler.handleBadCredentials(
                new BadCredentialsException("Invalid credentials"), request);
        ProblemDetail response = responseEntity.getBody();

        assertError(response, HttpStatus.UNAUTHORIZED, "Invalid credentials");
    }

    @Test
    void resourceNotFoundRemainsNotFound() {
        ResponseEntity<ProblemDetail> responseEntity = handler.handleResourceNotFound(
                new ResourceNotFoundException("Equipment not found"), request);
        ProblemDetail response = responseEntity.getBody();

        assertError(response, HttpStatus.NOT_FOUND, "Equipment not found");
    }

    @Test
    void accessDeniedDoesNotExposeSecurityExceptionDetail() {
        ResponseEntity<ProblemDetail> responseEntity = handler.handleAccessDenied(
                new AccessDeniedException("Missing privileged authority ROLE_HOSPITAL"), request);
        ProblemDetail response = responseEntity.getBody();

        assertError(response, HttpStatus.FORBIDDEN, "Access denied");
        assertFalse(response.getDetail().contains("ROLE_HOSPITAL"));
    }

    @Test
    void illegalArgumentsRemainBadRequests() {
        ResponseEntity<ProblemDetail> responseEntity = handler.handleIllegalArgument(
                new IllegalArgumentException("Quantity must be positive"), request);
        ProblemDetail response = responseEntity.getBody();

        assertError(response, HttpStatus.BAD_REQUEST, "Quantity must be positive");
    }

    @Test
    void businessStateRejectionsKeepExistingBadRequestContract() {
        ResponseEntity<ProblemDetail> responseEntity = handler.handleIllegalState(
                new IllegalStateException("Completed work order cannot be reopened"), request);
        ProblemDetail response = responseEntity.getBody();

        assertError(response, HttpStatus.BAD_REQUEST, "Completed work order cannot be reopened");
    }

    @Test
    void malformedJsonIsAClientErrorWithoutParserDetails() {
        HttpMessageNotReadableException exception = new HttpMessageNotReadableException(
                "JSON parse error: Cannot deserialize internal.model.Secret", mock(HttpInputMessage.class));

        ResponseEntity<ProblemDetail> responseEntity = handler.handleUnreadableMessage(exception, request);
        ProblemDetail response = responseEntity.getBody();

        assertError(response, HttpStatus.BAD_REQUEST, "Malformed JSON request");
        assertFalse(response.getDetail().contains("internal.model.Secret"));
    }

    @Test
    void missingRequestParameterNamesThePublicParameter() {
        ResponseEntity<ProblemDetail> responseEntity = handler.handleMissingParameter(
                new MissingServletRequestParameterException("keepId", "Long"), request);
        ProblemDetail response = responseEntity.getBody();

        assertError(response, HttpStatus.BAD_REQUEST, "Missing required parameter 'keepId'");
    }

    @Test
    void typeMismatchNamesThePublicParameterWithoutConversionInternals() throws Exception {
        MethodParameter parameter = new MethodParameter(
                GlobalExceptionHandlerTest.class.getMethod("dummyMethod", String.class), 0);
        MethodArgumentTypeMismatchException exception = new MethodArgumentTypeMismatchException(
                "not-a-number", Long.class, "equipmentId", parameter, new NumberFormatException("secret"));

        ResponseEntity<ProblemDetail> responseEntity = handler.handleTypeMismatch(exception, request);
        ProblemDetail response = responseEntity.getBody();

        assertError(response, HttpStatus.BAD_REQUEST, "Invalid value for parameter 'equipmentId'");
    }

    @Test
    void unsupportedMethodRetainsProtocolStatus() {
        ResponseEntity<ProblemDetail> responseEntity = handler.handleMethodNotSupported(
                new HttpRequestMethodNotSupportedException("TRACE"), request);
        ProblemDetail response = responseEntity.getBody();

        assertError(response, HttpStatus.METHOD_NOT_ALLOWED, "Request method is not supported");
    }

    @Test
    void unsupportedMediaTypeRetainsProtocolStatus() {
        ResponseEntity<ProblemDetail> responseEntity = handler.handleMediaTypeNotSupported(
                new HttpMediaTypeNotSupportedException("application/x-java-object"), request);
        ProblemDetail response = responseEntity.getBody();

        assertError(response, HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Content type is not supported");
    }

    @Test
    void dataIntegrityFailuresReturnSanitizedConflict() {
        ResponseEntity<ProblemDetail> responseEntity = handler.handlePersistenceConflict(
                new DataIntegrityViolationException(
                        "Unique index violation on USERS(EMAIL) values ('patient@example.org')"), request);
        ProblemDetail response = responseEntity.getBody();

        assertError(response, HttpStatus.CONFLICT,
                "The request conflicts with the current resource state");
        assertFalse(response.getDetail().contains("patient@example.org"));
    }

    @Test
    void optimisticLockFailuresReturnSanitizedConflict() {
        ResponseEntity<ProblemDetail> responseEntity = handler.handlePersistenceConflict(
                new OptimisticLockException("Version 7 was stale for equipment 42"), request);
        ProblemDetail response = responseEntity.getBody();

        assertError(response, HttpStatus.CONFLICT,
                "The request conflicts with the current resource state");
        assertFalse(response.getDetail().contains("Version 7"));
    }

    @Test
    void unexpectedRuntimeFailureReturnsSanitizedInternalServerError() {
        ResponseEntity<ProblemDetail> responseEntity = handler.handleRuntimeException(
                new NullPointerException("Cannot invoke repository.save because connectionPool is null"), request);
        ProblemDetail response = responseEntity.getBody();

        assertError(response, HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred");
        assertFalse(response.getDetail().contains("connectionPool"));
    }

    @Test
    void checkedFailureReturnsSameSanitizedInternalServerError() {
        ResponseEntity<ProblemDetail> responseEntity = handler.handleGeneralException(
                new Exception("Filesystem path /private/medtrack/export.csv is unavailable"), request);
        ProblemDetail response = responseEntity.getBody();

        assertError(response, HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred");
        assertFalse(response.getDetail().contains("/private/medtrack"));
    }

    @Test
    void correlationIdIsOptionalOutsideAFilteredRequest() {
        MDC.clear();

        ResponseEntity<ProblemDetail> responseEntity = handler.handleRuntimeException(
                new RuntimeException("internal detail"), request);
        ProblemDetail response = responseEntity.getBody();

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR.value(), response.getStatus());
        assertNull(response.getProperties().get("correlationId"));
    }

    private void assertError(
            ProblemDetail response, HttpStatus expectedStatus, String expectedMessage) {
        assertEquals(expectedStatus.value(), response.getStatus());
        assertEquals(expectedStatus.getReasonPhrase(), response.getTitle());
        assertEquals(expectedMessage, response.getDetail());
        assertEquals("/api/equipment/42", response.getProperties().get("path"));
        assertEquals(CORRELATION_ID, response.getProperties().get("correlationId"));
        assertNotNull(response.getProperties().get("timestamp"));
    }
}

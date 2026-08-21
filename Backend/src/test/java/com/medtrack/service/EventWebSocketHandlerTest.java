package com.medtrack.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medtrack.auth.model.AccountStatus;
import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.auth.security.EventStreamAccessGuard;
import com.medtrack.model.Hospital;
import com.medtrack.model.OperationsEvent;
import com.medtrack.repository.HospitalRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.clearInvocations;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EventWebSocketHandlerTest {

    private static final String EMAIL = "hospital@medtrack.com";
    private static final Long HOSPITAL_ID = 77L;

    @Mock
    private UserRepository userRepository;

    @Mock
    private HospitalRepository hospitalRepository;

    @Mock
    private WebSocketSession session;

    private EventWebSocketHandler handler;
    private Map<String, Object> sessionAttributes;

    @BeforeEach
    void setUp() {
        EventStreamAccessGuard accessGuard = new EventStreamAccessGuard(userRepository, hospitalRepository);
        handler = new EventWebSocketHandler(new ObjectMapper(), accessGuard);
        sessionAttributes = new HashMap<>();

        Authentication hospitalAuthentication = authentication("ROLE_HOSPITAL");
        User user = User.builder()
                .id(7L)
                .email(EMAIL)
                .role("hospital")
                .accountStatus(AccountStatus.ACTIVE)
                .build();
        Hospital hospital = Hospital.builder().id(HOSPITAL_ID).user(user).build();

        lenient().when(session.getId()).thenReturn("session-1");
        lenient().when(session.isOpen()).thenReturn(true);
        lenient().when(session.getPrincipal()).thenReturn(hospitalAuthentication);
        lenient().when(session.getAttributes()).thenReturn(sessionAttributes);
        lenient().when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        lenient().when(hospitalRepository.findByUserId(7L)).thenReturn(Optional.of(hospital));
    }

    @Test
    void connectionBindsHospitalResolvedFromAuthenticatedPrincipal() throws Exception {
        handler.afterConnectionEstablished(session);

        assertTrue(sessionAttributes.containsValue(HOSPITAL_ID));
        verify(session, never()).close(any());
    }

    @Test
    void connectionRejectsNonHospitalPrincipal() throws Exception {
        when(session.getPrincipal()).thenReturn(authentication("ROLE_SUPPLIER"));

        handler.afterConnectionEstablished(session);

        verify(session).close(CloseStatus.POLICY_VIOLATION);
        assertTrue(sessionAttributes.isEmpty());
    }

    @Test
    void connectionRejectsUnknownOrDisabledAccount() throws Exception {
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.empty());

        handler.afterConnectionEstablished(session);

        verify(session).close(CloseStatus.POLICY_VIOLATION);
        verify(hospitalRepository, never()).findByUserId(any());
    }

    @Test
    void connectionRejectsAccountWithoutHospitalProfile() throws Exception {
        when(hospitalRepository.findByUserId(7L)).thenReturn(Optional.empty());

        handler.afterConnectionEstablished(session);

        verify(session).close(CloseStatus.POLICY_VIOLATION);
    }

    @Test
    void subscriptionAcceptsOnlyBoundHospital() throws Exception {
        connectAndSubscribe(HOSPITAL_ID);

        assertEquals(1, handler.getSubscriptionCount(HOSPITAL_ID));
        assertSentMessageContains("\"type\":\"subscribed\"");
        verify(session, never()).close(any());
    }

    @Test
    void subscriptionRejectsForeignHospitalAndClosesSession() throws Exception {
        handler.afterConnectionEstablished(session);

        handler.handleTextMessage(session, subscriptionMessage(999L));

        assertEquals(0, handler.getSubscriptionCount(999L));
        assertSentMessageContains("Access denied");
        verify(session).close(CloseStatus.POLICY_VIOLATION);
    }

    @Test
    void subscriptionCannotBypassConnectionBinding() throws Exception {
        handler.handleTextMessage(session, subscriptionMessage(HOSPITAL_ID));

        assertEquals(0, handler.getSubscriptionCount(HOSPITAL_ID));
        verify(session).close(CloseStatus.POLICY_VIOLATION);
    }

    @Test
    void unsubscribeRemovesSessionFromHospital() throws Exception {
        connectAndSubscribe(HOSPITAL_ID);

        handler.handleTextMessage(session, new TextMessage("{\"action\":\"unsubscribe\"}"));

        assertEquals(0, handler.getSubscriptionCount(HOSPITAL_ID));
    }

    @Test
    void closingConnectionRemovesItsSubscription() throws Exception {
        connectAndSubscribe(HOSPITAL_ID);

        handler.afterConnectionClosed(session, CloseStatus.NORMAL);

        assertEquals(0, handler.getSubscriptionCount(HOSPITAL_ID));
    }

    @Test
    void broadcastDeliversOnlyToSubscribedHospital() throws Exception {
        connectAndSubscribe(HOSPITAL_ID);
        clearInvocations(session);
        OperationsEvent event = OperationsEvent.builder()
                .id(10L)
                .hospitalId(HOSPITAL_ID)
                .category(OperationsEvent.EventCategory.EQUIPMENT)
                .type(OperationsEvent.EventType.EQUIPMENT_CREATED)
                .build();

        handler.broadcastToHospital(999L, event);
        verify(session, never()).sendMessage(any());

        handler.broadcastToHospital(HOSPITAL_ID, event);
        assertSentMessageContains("\"type\":\"event\"");
    }

    @Test
    void malformedMessageDoesNotCreateSubscription() throws Exception {
        handler.afterConnectionEstablished(session);

        handler.handleTextMessage(session, new TextMessage("not-json"));

        assertEquals(0, handler.getSubscriptionCount(HOSPITAL_ID));
        assertSentMessageContains("Invalid message format");
    }

    private void connectAndSubscribe(Long hospitalId) throws Exception {
        handler.afterConnectionEstablished(session);
        handler.handleTextMessage(session, subscriptionMessage(hospitalId));
    }

    private TextMessage subscriptionMessage(Long hospitalId) {
        return new TextMessage("{\"action\":\"subscribe\",\"hospitalId\":" + hospitalId + "}");
    }

    private Authentication authentication(String authority) {
        return new UsernamePasswordAuthenticationToken(
                EMAIL, null, List.of(new SimpleGrantedAuthority(authority)));
    }

    private void assertSentMessageContains(String expected) throws Exception {
        ArgumentCaptor<TextMessage> message = ArgumentCaptor.forClass(TextMessage.class);
        verify(session).sendMessage(message.capture());
        assertTrue(message.getValue().getPayload().contains(expected));
    }
}

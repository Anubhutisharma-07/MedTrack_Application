package com.medtrack.auth.security;

import com.medtrack.auth.model.AccountStatus;
import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.model.Hospital;
import com.medtrack.repository.HospitalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketSession;

import java.util.Locale;

/**
 * Binds an operations-event WebSocket session to the authenticated user's hospital.
 */
@Component
@RequiredArgsConstructor
public class EventStreamAccessGuard {

    static final String AUTHORIZED_HOSPITAL_ID =
            EventStreamAccessGuard.class.getName() + ".authorizedHospitalId";

    private final UserRepository userRepository;
    private final HospitalRepository hospitalRepository;

    public Long bindAuthorizedHospital(WebSocketSession session) {
        Authentication authentication = requireHospitalAuthentication(session);
        String identifier = authentication.getName().trim();
        User user = userRepository.findByUsername(identifier)
                .or(() -> userRepository.findByEmail(identifier.toLowerCase(Locale.ROOT)))
                .filter(candidate -> candidate.getAccountStatus() == AccountStatus.ACTIVE)
                .filter(candidate -> "hospital".equalsIgnoreCase(candidate.getRole()))
                .orElseThrow(() -> denied("An active hospital account is required"));
        Hospital hospital = hospitalRepository.findByUserId(user.getId())
                .orElseThrow(() -> denied("A hospital profile is required"));

        session.getAttributes().put(AUTHORIZED_HOSPITAL_ID, hospital.getId());
        return hospital.getId();
    }

    public Long requireAuthorizedHospital(WebSocketSession session, Long requestedHospitalId) {
        Object boundHospitalId = session.getAttributes().get(AUTHORIZED_HOSPITAL_ID);
        if (!(boundHospitalId instanceof Long authorizedHospitalId)
                || requestedHospitalId == null
                || !authorizedHospitalId.equals(requestedHospitalId)) {
            throw denied("Hospital event stream access denied");
        }
        return authorizedHospitalId;
    }

    private Authentication requireHospitalAuthentication(WebSocketSession session) {
        if (!(session.getPrincipal() instanceof Authentication authentication)
                || !authentication.isAuthenticated()
                || authentication.getName() == null
                || authentication.getName().isBlank()
                || authentication.getAuthorities().stream()
                        .noneMatch(authority -> "ROLE_HOSPITAL".equals(authority.getAuthority()))) {
            throw denied("Hospital authentication is required");
        }
        return authentication;
    }

    private AccessDeniedException denied(String message) {
        return new AccessDeniedException(message);
    }
}

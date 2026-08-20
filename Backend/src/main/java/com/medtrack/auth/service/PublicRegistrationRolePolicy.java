package com.medtrack.auth.service;

import org.springframework.stereotype.Component;

import java.util.Locale;
import java.util.Set;

/**
 * Defines the roles that an unauthenticated caller may request while creating
 * an account through the public registration endpoint.
 *
 * <p>Authorization roles are security decisions, not ordinary profile data.
 * Keeping this policy outside {@link UserService} prevents a future role from
 * becoming publicly assignable merely because it is valid elsewhere in the
 * application.</p>
 */
@Component
public class PublicRegistrationRolePolicy {

    public static final String DEFAULT_ROLE = "TECHNICIAN";

    private static final Set<String> PUBLIC_ROLES = Set.of(
            "TECHNICIAN",
            "SUPPLIER"
    );

    private static final Set<String> PRIVILEGED_ROLES = Set.of(
            "HOSPITAL"
    );

    /**
     * Resolves the role to persist for a public registration request.
     *
     * @param requestedRole role supplied by the unauthenticated caller; may be null
     * @return an uppercase role that is safe for public self-registration
     * @throws IllegalArgumentException when the role is blank, unknown, or privileged
     */
    public String resolve(String requestedRole) {
        if (requestedRole == null) {
            return DEFAULT_ROLE;
        }

        String normalizedRole = requestedRole.trim().toUpperCase(Locale.ROOT);
        if (normalizedRole.isEmpty()) {
            throw new IllegalArgumentException(
                    "Registration role must be TECHNICIAN or SUPPLIER");
        }

        if (PRIVILEGED_ROLES.contains(normalizedRole)) {
            throw new IllegalArgumentException(
                    "HOSPITAL accounts cannot be created through public registration");
        }

        if (!PUBLIC_ROLES.contains(normalizedRole)) {
            throw new IllegalArgumentException(
                    "Invalid registration role. Must be TECHNICIAN or SUPPLIER");
        }

        return normalizedRole;
    }
}

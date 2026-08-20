package com.medtrack.auth.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Ensures the CSRF token cookie is set on every response so that
 * browser-based SPA clients can read it for state-mutating requests.
 *
 * <p>Spring Security's default CsrfTokenRepository stores the token in
 * the HTTP session, but a stateless JWT-based API does not use sessions.
 * This filter delegates to the active CsrfToken implementation to write
 * the token into a cookie before the response is committed.</p>
 */
public class CsrfCookieFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        CsrfToken csrfToken = (CsrfToken) request.getAttribute(CsrfToken.class.getName());
        if (csrfToken != null) {
            // Force token generation so it appears in the response cookie
            csrfToken.getToken();
        }
        filterChain.doFilter(request, response);
    }
}

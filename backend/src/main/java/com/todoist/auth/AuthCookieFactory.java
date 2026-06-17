package com.todoist.auth;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

/**
 * Builds the auth cookie. httpOnly so JS can't read the token (XSS-safe),
 * SameSite=Lax to neutralize CSRF. `secure` is false in dev (http://localhost)
 * and must be true in production (https).
 */
@Component
public class AuthCookieFactory {

    private final String cookieName;
    private final boolean secure;

    public AuthCookieFactory(
            @Value("${app.jwt.cookie-name}") String cookieName,
            @Value("${app.cookie.secure:false}") boolean secure) {
        this.cookieName = cookieName;
        this.secure = secure;
    }

    public ResponseCookie create(String token, long maxAgeSeconds) {
        return ResponseCookie.from(cookieName, token)
                .httpOnly(true)
                .secure(secure)
                .path("/")
                .sameSite("Lax")
                .maxAge(maxAgeSeconds)
                .build();
    }

    /** A zero-age cookie that clears the token (logout). */
    public ResponseCookie clear() {
        return ResponseCookie.from(cookieName, "")
                .httpOnly(true)
                .secure(secure)
                .path("/")
                .sameSite("Lax")
                .maxAge(0)
                .build();
    }
}

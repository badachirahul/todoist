package com.todoist.auth;

import com.todoist.user.User;
import com.todoist.user.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Runs after Google verifies the user. We read the Google profile, find/create
 * our own User, mint our own JWT, drop it in an httpOnly cookie, then bounce the
 * browser back to the frontend (now authenticated).
 */
@Component
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    private final UserService userService;
    private final JwtService jwtService;
    private final AuthCookieFactory cookieFactory;
    private final String frontendUrl;

    public OAuth2LoginSuccessHandler(UserService userService,
                                     JwtService jwtService,
                                     AuthCookieFactory cookieFactory,
                                     @Value("${app.frontend-url}") String frontendUrl) {
        this.userService = userService;
        this.jwtService = jwtService;
        this.cookieFactory = cookieFactory;
        this.frontendUrl = frontendUrl;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        OAuth2User oauthUser = (OAuth2User) authentication.getPrincipal();

        // Google's OIDC attributes.
        String googleId = oauthUser.getAttribute("sub");
        String email = oauthUser.getAttribute("email");
        String name = oauthUser.getAttribute("name");
        String avatarUrl = oauthUser.getAttribute("picture");

        User user = userService.findOrCreateFromGoogle(googleId, email, name, avatarUrl);

        String token = jwtService.issueToken(user.getId(), user.getEmail());
        ResponseCookie cookie = cookieFactory.create(token, jwtService.getExpirationSeconds());
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        // Drop the OAuth login session: auth is now carried statelessly by the JWT
        // cookie. Otherwise the session-stored OAuth2 principal would shadow our
        // JwtCookieAuthFilter on later requests (and @AuthenticationPrincipal UUID
        // would be null). The handshake's session is no longer needed.
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        SecurityContextHolder.clearContext();

        response.sendRedirect(frontendUrl);
    }
}

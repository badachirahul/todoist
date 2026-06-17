package com.todoist.auth;

import com.todoist.auth.dto.LoginRequest;
import com.todoist.auth.dto.RegisterRequest;
import com.todoist.auth.dto.UserDto;
import com.todoist.user.User;
import com.todoist.user.UserService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@RestController
@RequestMapping("/api")
public class AuthController {

    private final UserService userService;
    private final JwtService jwtService;
    private final AuthCookieFactory cookieFactory;

    public AuthController(UserService userService, JwtService jwtService, AuthCookieFactory cookieFactory) {
        this.userService = userService;
        this.jwtService = jwtService;
        this.cookieFactory = cookieFactory;
    }

    /** Register with email + password. Name is derived from the email local-part for now. */
    @PostMapping("/auth/register")
    public ResponseEntity<UserDto> register(@Valid @RequestBody RegisterRequest req, HttpServletResponse response) {
        if (userService.emailExists(req.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }
        String name = req.email().split("@")[0];
        User user = userService.registerWithPassword(req.email(), name, req.password());
        setAuthCookie(response, user);
        return ResponseEntity.status(HttpStatus.CREATED).body(UserDto.from(user));
    }

    /** Log in with email + password. */
    @PostMapping("/auth/login")
    public UserDto login(@Valid @RequestBody LoginRequest req, HttpServletResponse response) {
        User user = userService.authenticate(req.email(), req.password())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));
        setAuthCookie(response, user);
        return UserDto.from(user);
    }

    /** The currently-authenticated user (principal = user id, set by JwtCookieAuthFilter). */
    @GetMapping("/me")
    public UserDto me(@AuthenticationPrincipal UUID userId) {
        return UserDto.from(userService.findById(userId));
    }

    /** Clears the auth cookie. */
    @PostMapping("/auth/logout")
    public ResponseEntity<Void> logout(HttpServletResponse response) {
        response.addHeader(HttpHeaders.SET_COOKIE, cookieFactory.clear().toString());
        return ResponseEntity.noContent().build();
    }

    private void setAuthCookie(HttpServletResponse response, User user) {
        String token = jwtService.issueToken(user.getId(), user.getEmail());
        response.addHeader(HttpHeaders.SET_COOKIE,
                cookieFactory.create(token, jwtService.getExpirationSeconds()).toString());
    }
}

package com.todoist.config;

import com.todoist.auth.JwtCookieAuthFilter;
import com.todoist.auth.OAuth2LoginSuccessHandler;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * Auth wiring (Phase 2):
 *  - "Continue with Google" navigates to /oauth2/authorization/google (permitAll),
 *    Spring handles the Google handshake, then OAuth2LoginSuccessHandler mints our
 *    JWT cookie and redirects to the frontend.
 *  - Every subsequent request is authenticated by JwtCookieAuthFilter reading that cookie.
 *  - Protected API calls without a valid cookie get 401 (not a redirect).
 */
@Configuration
public class SecurityConfig {

    @Value("${app.cors.allowed-origins}")
    private List<String> allowedOrigins;

    private final OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler;
    private final JwtCookieAuthFilter jwtCookieAuthFilter;

    public SecurityConfig(OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler,
                          JwtCookieAuthFilter jwtCookieAuthFilter) {
        this.oAuth2LoginSuccessHandler = oAuth2LoginSuccessHandler;
        this.jwtCookieAuthFilter = jwtCookieAuthFilter;
    }

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                // Stateless JWT-cookie API: no CSRF tokens needed (SameSite=Lax guards the cookie).
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/health", "/api/auth/register", "/api/auth/login",
                                "/oauth2/**", "/login/**", "/error").permitAll()
                        .anyRequest().authenticated()
                )
                // OAuth login needs a transient session for the handshake; our API auth is stateless.
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
                .oauth2Login(oauth -> oauth.successHandler(oAuth2LoginSuccessHandler))
                // Unauthenticated API calls -> 401 instead of a redirect to the login flow.
                .exceptionHandling(e -> e.authenticationEntryPoint(
                        new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))
                .addFilterBefore(jwtCookieAuthFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(allowedOrigins);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}

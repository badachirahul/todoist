package com.todoist.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * PasswordEncoder lives in its own config (not SecurityConfig) to avoid a
 * circular dependency: SecurityConfig -> OAuth2LoginSuccessHandler -> UserService
 * -> PasswordEncoder would loop if the bean were declared in SecurityConfig.
 */
@Configuration
public class PasswordConfig {

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}

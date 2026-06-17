package com.todoist.health;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

/**
 * Phase 0 smoke-test endpoint. The frontend fetches this to prove the full
 * stack (React -> CORS -> Spring -> JVM) is wired end to end.
 */
@RestController
@RequestMapping("/api")
public class HealthController {

    @GetMapping("/health")
    public Map<String, Object> health() {
        return Map.of(
                "status", "ok",
                "service", "todoist-backend",
                "time", Instant.now().toString()
        );
    }
}

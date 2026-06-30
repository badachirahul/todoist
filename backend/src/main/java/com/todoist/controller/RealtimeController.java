package com.todoist.controller;

import com.todoist.entity.Project;
import com.todoist.repository.ProjectMemberRepository;
import com.todoist.service.RealtimeService;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

/** SSE stream of changes for a project (members only). */
@RestController
public class RealtimeController {

    private final RealtimeService realtime;
    private final ProjectMemberRepository projectMemberRepository;

    public RealtimeController(RealtimeService realtime, ProjectMemberRepository projectMemberRepository) {
        this.realtime = realtime;
        this.projectMemberRepository = projectMemberRepository;
    }

    @GetMapping(value = "/api/projects/{projectId}/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(@PathVariable UUID projectId, @AuthenticationPrincipal UUID userId) {
        if (!projectMemberRepository.existsByProjectIdAndUserId(projectId, userId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found");
        }
        return realtime.subscribe(projectId);
    }

    /** Personal notification stream for the logged-in user (badge + page live updates). */
    @GetMapping(value = "/api/notifications/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter notificationStream(@AuthenticationPrincipal UUID userId) {
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        return realtime.subscribeUser(userId);
    }
}

package com.todoist.notification;

import com.todoist.notification.dto.NotificationDto;
import com.todoist.project.InvitationService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;
    private final InvitationService invitationService;

    public NotificationController(NotificationService notificationService,
                                  InvitationService invitationService) {
        this.notificationService = notificationService;
        this.invitationService = invitationService;
    }

    @GetMapping
    public List<NotificationDto> list(@AuthenticationPrincipal UUID userId) {
        return notificationService.list(userId);
    }

    @GetMapping("/unread-count")
    public Map<String, Long> unreadCount(@AuthenticationPrincipal UUID userId) {
        return Map.of("count", notificationService.unreadCount(userId));
    }

    @PostMapping("/read-all")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markAllRead(@AuthenticationPrincipal UUID userId) {
        notificationService.markAllRead(userId);
    }

    /** Toggle a single notification's read state ({"read": true|false}). */
    @PatchMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void setRead(@PathVariable UUID id,
                        @AuthenticationPrincipal UUID userId,
                        @RequestBody Map<String, Boolean> body) {
        notificationService.setRead(id, userId, Boolean.TRUE.equals(body.get("read")));
    }

    /** Accept the project invitation behind an INVITED notification; returns its project id. */
    @PostMapping("/{id}/accept")
    public Map<String, UUID> acceptInvite(@PathVariable UUID id, @AuthenticationPrincipal UUID userId) {
        return Map.of("projectId", invitationService.acceptInvite(id, userId));
    }
}

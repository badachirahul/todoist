package com.todoist.controller;

import com.todoist.service.InvitationService;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Accept an invitation (the logged-in user joins the project). */
@RestController
@RequestMapping("/api/invites")
public class InviteController {

    private final InvitationService invitationService;

    public InviteController(InvitationService invitationService) {
        this.invitationService = invitationService;
    }

    public record AcceptResult(UUID projectId) {}

    @PostMapping("/{token}/accept")
    public AcceptResult accept(@PathVariable String token, @AuthenticationPrincipal UUID userId) {
        return new AcceptResult(invitationService.accept(token, userId));
    }
}

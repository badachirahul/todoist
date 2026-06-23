package com.todoist.project.dto;

import com.todoist.project.ProjectInvitation;

import java.util.UUID;

/** A pending project invitation as exposed to the frontend (Share popup). */
public record InvitationDto(UUID id, String email, String status) {
    public static InvitationDto from(ProjectInvitation inv) {
        return new InvitationDto(inv.getId(), inv.getEmail(), inv.getStatus());
    }
}

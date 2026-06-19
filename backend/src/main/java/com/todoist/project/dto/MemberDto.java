package com.todoist.project.dto;

import com.todoist.project.ProjectMember;
import com.todoist.project.ProjectRole;

import java.util.UUID;

/** A project member as exposed to the frontend (Share dialog). */
public record MemberDto(
        UUID userId,
        String name,
        String email,
        String avatarUrl,
        ProjectRole role
) {
    public static MemberDto from(ProjectMember m) {
        return new MemberDto(
                m.getUser().getId(),
                m.getUser().getName(),
                m.getUser().getEmail(),
                m.getUser().getAvatarUrl(),
                m.getRole());
    }
}

package com.todoist.dto;

import com.todoist.entity.ProjectMember;
import com.todoist.entity.ProjectRole;
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

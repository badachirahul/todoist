package com.todoist.project.dto;

import com.todoist.project.Project;

import java.util.UUID;

/** A project as exposed to the frontend (used by the sidebar). */
public record ProjectDto(
        UUID id,
        String name,
        String color,
        boolean inbox,
        boolean favorite,
        boolean archived,
        int position
) {
    public static ProjectDto from(Project p) {
        return new ProjectDto(
                p.getId(), p.getName(), p.getColor(),
                p.isInbox(), p.isFavorite(), p.isArchived(), p.getPosition());
    }
}

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
        int position,
        int taskCount
) {
    public static ProjectDto from(Project p) {
        return from(p, 0);
    }

    /** {@code taskCount} = open tasks in the project (shown in the sidebar). */
    public static ProjectDto from(Project p, int taskCount) {
        return new ProjectDto(
                p.getId(), p.getName(), p.getColor(),
                p.isInbox(), p.isFavorite(), p.isArchived(), p.getPosition(), taskCount);
    }
}

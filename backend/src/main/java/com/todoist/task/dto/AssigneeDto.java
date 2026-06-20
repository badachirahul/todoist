package com.todoist.task.dto;

import com.todoist.user.User;

import java.util.UUID;

/** Lean view of a task's assignee (avatar + name on the task row / detail panel). */
public record AssigneeDto(UUID id, String name, String avatarUrl) {
    public static AssigneeDto from(User u) {
        return new AssigneeDto(u.getId(), u.getName(), u.getAvatarUrl());
    }
}

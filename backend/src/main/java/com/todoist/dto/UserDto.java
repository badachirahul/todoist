package com.todoist.dto;

import com.todoist.entity.User;
import java.util.UUID;

/** The current user, as exposed to the frontend. */
public record UserDto(UUID id, String email, String name, String avatarUrl) {

    public static UserDto from(User user) {
        return new UserDto(user.getId(), user.getEmail(), user.getName(), user.getAvatarUrl());
    }
}

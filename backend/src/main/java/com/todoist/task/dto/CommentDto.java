package com.todoist.task.dto;

import com.todoist.task.Comment;

import java.time.OffsetDateTime;
import java.util.UUID;

public record CommentDto(
        UUID id,
        UUID taskId,
        String authorName,
        String authorAvatarUrl,
        String content,
        OffsetDateTime createdAt
) {
    public static CommentDto from(Comment c) {
        return new CommentDto(
                c.getId(),
                c.getTask().getId(),
                c.getUser().getName(),
                c.getUser().getAvatarUrl(),
                c.getContent(),
                c.getCreatedAt());
    }
}

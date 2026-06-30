package com.todoist.dto;

import com.todoist.entity.Comment;
import java.time.OffsetDateTime;
import java.util.UUID;

public record CommentDto(
        UUID id,
        UUID taskId,
        UUID authorId,
        String authorName,
        String authorAvatarUrl,
        String content,
        OffsetDateTime createdAt,
        AttachmentDto attachment
) {
    public static CommentDto from(Comment c) {
        return from(c, null);
    }

    public static CommentDto from(Comment c, AttachmentDto attachment) {
        return new CommentDto(
                c.getId(),
                c.getTask().getId(),
                c.getUser().getId(),
                c.getUser().getName(),
                c.getUser().getAvatarUrl(),
                c.getContent(),
                c.getCreatedAt(),
                attachment);
    }
}

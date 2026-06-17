package com.todoist.task.dto;

import jakarta.validation.constraints.NotBlank;

public record CommentRequest(@NotBlank String content) {
}

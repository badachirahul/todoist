package com.todoist.task.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;

public record CreateTaskRequest(
        @NotBlank String content,
        String description,
        @Min(1) @Max(4) Integer priority,
        LocalDate dueDate
) {
}

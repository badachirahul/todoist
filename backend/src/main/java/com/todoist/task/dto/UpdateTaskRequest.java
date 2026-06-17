package com.todoist.task.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

import java.time.LocalDate;

/** Partial update (PATCH): every field is optional; null means "leave unchanged". */
public record UpdateTaskRequest(
        String content,
        String description,
        @Min(1) @Max(4) Integer priority,
        LocalDate dueDate,
        Boolean completed
) {
}

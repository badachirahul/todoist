package com.todoist.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.time.LocalDate;

/**
 * Partial update (PATCH): null fields are left unchanged. Because a null
 * dueDate is ambiguous (absent vs "clear it"), set clearDueDate=true to
 * explicitly remove the due date.
 */
public record UpdateTaskRequest(
        String content,
        String description,
        @Min(1) @Max(4) Integer priority,
        LocalDate dueDate,
        Boolean clearDueDate,
        Boolean completed,
        java.util.UUID assigneeId,
        Boolean clearAssignee
) {
}

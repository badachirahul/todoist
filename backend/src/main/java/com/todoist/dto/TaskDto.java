package com.todoist.dto;

import com.todoist.entity.Task;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

/** A task as exposed to the frontend. */
public record TaskDto(
        UUID id,
        UUID projectId,
        UUID sectionId,
        UUID parentTaskId,
        String content,
        String description,
        int priority,
        LocalDate dueDate,
        boolean completed,
        int position,
        int subtaskTotal,
        int subtaskDone,
        int commentCount,
        AssigneeDto assignee,
        List<LabelDto> labels,
        OffsetDateTime createdAt
) {
    public static TaskDto from(Task t) {
        return from(t, 0, 0, 0);
    }

    public static TaskDto from(Task t, int subtaskTotal, int subtaskDone) {
        return from(t, subtaskTotal, subtaskDone, 0);
    }

    public static TaskDto from(Task t, int subtaskTotal, int subtaskDone, int commentCount) {
        return new TaskDto(
                t.getId(),
                t.getProject().getId(),
                t.getSection() != null ? t.getSection().getId() : null,
                t.getParentTask() != null ? t.getParentTask().getId() : null,
                t.getContent(),
                t.getDescription(),
                t.getPriority(),
                t.getDueDate(),
                t.isCompleted(),
                t.getPosition(),
                subtaskTotal,
                subtaskDone,
                commentCount,
                t.getAssignee() != null ? AssigneeDto.from(t.getAssignee()) : null,
                t.getLabels().stream()
                        .sorted((a, b) -> a.getName().compareToIgnoreCase(b.getName()))
                        .map(LabelDto::from)
                        .toList(),
                t.getCreatedAt());
    }
}

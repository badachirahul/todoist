package com.todoist.task.dto;

import com.todoist.label.dto.LabelDto;
import com.todoist.task.Task;

import java.time.LocalDate;
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
        List<LabelDto> labels
) {
    public static TaskDto from(Task t) {
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
                t.getLabels().stream()
                        .sorted((a, b) -> a.getName().compareToIgnoreCase(b.getName()))
                        .map(LabelDto::from)
                        .toList());
    }
}

package com.todoist.task.dto;

import java.util.UUID;

/**
 * Reposition/re-parent a task (drag-and-drop). {@code parentId} null = move to
 * top level; {@code sectionId} null = no section. {@code position} is the
 * 0-based slot among the destination siblings (same parent + section).
 */
public record MoveTaskRequest(
        UUID parentId,
        UUID sectionId,
        int position
) {
}

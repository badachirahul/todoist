package com.todoist.project.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Create a project. {@code position} is optional: when set, the project is
 * inserted at that slot (siblings at or after it shift down) — used by the
 * "Add project above/below" menu actions. When null, the project is appended.
 */
public record CreateProjectRequest(
        @NotBlank String name,
        String color,
        Integer position
) {
}

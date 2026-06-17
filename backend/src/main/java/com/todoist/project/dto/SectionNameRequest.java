package com.todoist.project.dto;

import jakarta.validation.constraints.NotBlank;

/** Create or rename a section. */
public record SectionNameRequest(@NotBlank String name) {
}

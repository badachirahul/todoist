package com.todoist.label.dto;

import jakarta.validation.constraints.NotBlank;

public record LabelRequest(@NotBlank String name, String color) {
}

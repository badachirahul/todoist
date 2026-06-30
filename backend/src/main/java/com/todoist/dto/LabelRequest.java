package com.todoist.dto;

import jakarta.validation.constraints.NotBlank;

public record LabelRequest(@NotBlank String name, String color) {
}

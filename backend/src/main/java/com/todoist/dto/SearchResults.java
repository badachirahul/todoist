package com.todoist.dto;

import java.util.List;

public record SearchResults(List<TaskDto> tasks, List<ProjectDto> projects) {
}

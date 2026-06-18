package com.todoist.search.dto;

import com.todoist.project.dto.ProjectDto;
import com.todoist.task.dto.TaskDto;

import java.util.List;

public record SearchResults(List<TaskDto> tasks, List<ProjectDto> projects) {
}

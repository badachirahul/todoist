package com.todoist.search;

import com.todoist.project.ProjectRepository;
import com.todoist.project.dto.ProjectDto;
import com.todoist.search.dto.SearchResults;
import com.todoist.task.TaskRepository;
import com.todoist.task.dto.TaskDto;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
public class SearchController {

    private static final int LIMIT = 20;

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;

    public SearchController(TaskRepository taskRepository, ProjectRepository projectRepository) {
        this.taskRepository = taskRepository;
        this.projectRepository = projectRepository;
    }

    @GetMapping("/api/search")
    @Transactional(readOnly = true)
    public SearchResults search(@AuthenticationPrincipal UUID userId, @RequestParam("q") String q) {
        String query = q == null ? "" : q.trim();
        if (query.isEmpty()) {
            return new SearchResults(List.of(), List.of());
        }
        List<TaskDto> tasks = taskRepository.searchByMember(userId, query).stream()
                .limit(LIMIT).map(TaskDto::from).toList();
        List<ProjectDto> projects = projectRepository.searchByMember(userId, query).stream()
                .limit(LIMIT).map(ProjectDto::from).toList();
        return new SearchResults(tasks, projects);
    }
}

package com.todoist.project;

import com.todoist.project.dto.ProjectDto;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    /** Projects the current user is a member of (Inbox first). */
    @GetMapping
    public List<ProjectDto> list(@AuthenticationPrincipal UUID userId) {
        return projectService.listForUser(userId);
    }
}

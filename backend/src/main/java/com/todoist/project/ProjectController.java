package com.todoist.project;

import com.todoist.project.dto.AddMemberRequest;
import com.todoist.project.dto.CreateProjectRequest;
import com.todoist.project.dto.MemberDto;
import com.todoist.project.dto.ProjectDto;
import com.todoist.project.dto.UpdateProjectRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
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

    /** Projects the current user is a member of (Inbox first). Pass ?archived=true for archived only. */
    @GetMapping
    public List<ProjectDto> list(@AuthenticationPrincipal UUID userId,
                                 @RequestParam(defaultValue = "false") boolean archived) {
        return projectService.listForUser(userId, archived);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProjectDto create(@AuthenticationPrincipal UUID userId,
                             @Valid @RequestBody CreateProjectRequest req) {
        return projectService.create(userId, req);
    }

    @PatchMapping("/{projectId}")
    public ProjectDto update(@PathVariable UUID projectId,
                             @AuthenticationPrincipal UUID userId,
                             @RequestBody UpdateProjectRequest req) {
        return projectService.update(projectId, userId, req);
    }

    @DeleteMapping("/{projectId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID projectId, @AuthenticationPrincipal UUID userId) {
        projectService.delete(projectId, userId);
    }

    // ---- Sharing / members ------------------------------------------------

    @GetMapping("/{projectId}/members")
    public List<MemberDto> members(@PathVariable UUID projectId, @AuthenticationPrincipal UUID userId) {
        return projectService.listMembers(projectId, userId);
    }

    @PostMapping("/{projectId}/members")
    @ResponseStatus(HttpStatus.CREATED)
    public MemberDto addMember(@PathVariable UUID projectId,
                               @AuthenticationPrincipal UUID userId,
                               @Valid @RequestBody AddMemberRequest req) {
        return projectService.addMember(projectId, userId, req.email());
    }

    @DeleteMapping("/{projectId}/members/{memberUserId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeMember(@PathVariable UUID projectId,
                             @PathVariable UUID memberUserId,
                             @AuthenticationPrincipal UUID userId) {
        projectService.removeMember(projectId, userId, memberUserId);
    }
}

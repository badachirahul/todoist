package com.todoist.project;

import com.todoist.project.dto.CreateProjectRequest;
import com.todoist.project.dto.ProjectDto;
import com.todoist.project.dto.UpdateProjectRequest;
import com.todoist.user.User;
import com.todoist.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final UserRepository userRepository;

    public ProjectService(ProjectRepository projectRepository,
                          ProjectMemberRepository projectMemberRepository,
                          UserRepository userRepository) {
        this.projectRepository = projectRepository;
        this.projectMemberRepository = projectMemberRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<ProjectDto> listForUser(UUID userId) {
        return projectRepository.findActiveByMember(userId).stream()
                .map(ProjectDto::from)
                .toList();
    }

    @Transactional
    public ProjectDto create(UUID userId, CreateProjectRequest req) {
        User owner = userRepository.getReferenceById(userId);

        Project project = new Project();
        project.setName(req.name());
        project.setColor(req.color());
        project.setOwner(owner);
        project.setPosition(projectRepository.findActiveByMember(userId).size());
        project = projectRepository.save(project);

        ProjectMember member = new ProjectMember();
        member.setProject(project);
        member.setUser(owner);
        member.setRole(ProjectRole.OWNER);
        projectMemberRepository.save(member);

        return ProjectDto.from(project);
    }

    @Transactional
    public ProjectDto update(UUID projectId, UUID userId, UpdateProjectRequest req) {
        Project project = loadMemberProject(projectId, userId);
        if (project.isInbox() && req.name() != null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The Inbox cannot be renamed");
        }
        if (req.name() != null) project.setName(req.name());
        if (req.color() != null) project.setColor(req.color());
        if (req.favorite() != null) project.setFavorite(req.favorite());
        if (req.archived() != null) project.setArchived(req.archived());
        return ProjectDto.from(project);
    }

    @Transactional
    public void delete(UUID projectId, UUID userId) {
        Project project = loadMemberProject(projectId, userId);
        if (project.isInbox()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The Inbox cannot be deleted");
        }
        projectRepository.delete(project);
    }

    private Project loadMemberProject(UUID projectId, UUID userId) {
        if (!projectMemberRepository.existsByProjectIdAndUserId(projectId, userId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found");
        }
        return projectRepository.findById(projectId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found"));
    }
}

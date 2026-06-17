package com.todoist.project;

import com.todoist.project.dto.ProjectDto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;

    public ProjectService(ProjectRepository projectRepository) {
        this.projectRepository = projectRepository;
    }

    @Transactional(readOnly = true)
    public List<ProjectDto> listForUser(UUID userId) {
        return projectRepository.findActiveByMember(userId).stream()
                .map(ProjectDto::from)
                .toList();
    }
}

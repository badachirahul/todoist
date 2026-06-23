package com.todoist.project;

import com.todoist.notification.NotificationService;
import com.todoist.notification.NotificationType;
import com.todoist.project.dto.CreateProjectRequest;
import com.todoist.project.dto.MemberDto;
import com.todoist.project.dto.ProjectDto;
import com.todoist.project.dto.UpdateProjectRequest;
import com.todoist.realtime.RealtimeService;
import com.todoist.task.TaskRepository;
import com.todoist.user.User;
import com.todoist.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final RealtimeService realtime;
    private final EmailService emailService;
    private final NotificationService notificationService;

    public ProjectService(ProjectRepository projectRepository,
                          ProjectMemberRepository projectMemberRepository,
                          UserRepository userRepository,
                          TaskRepository taskRepository,
                          RealtimeService realtime,
                          EmailService emailService,
                          NotificationService notificationService) {
        this.projectRepository = projectRepository;
        this.projectMemberRepository = projectMemberRepository;
        this.userRepository = userRepository;
        this.taskRepository = taskRepository;
        this.realtime = realtime;
        this.emailService = emailService;
        this.notificationService = notificationService;
    }

    @Transactional(readOnly = true)
    public List<ProjectDto> listForUser(UUID userId, boolean archived) {
        List<Project> projects = archived
                ? projectRepository.findArchivedByMember(userId)
                : projectRepository.findActiveByMember(userId);
        if (projects.isEmpty()) return List.of();

        // One grouped query for the sidebar open-task badges (avoids N+1).
        Map<UUID, Integer> counts = new HashMap<>();
        for (TaskRepository.ProjectOpenCount c :
                taskRepository.openTaskCounts(projects.stream().map(Project::getId).toList())) {
            counts.put(c.getProjectId(), (int) c.getCnt());
        }
        return projects.stream()
                .map(p -> ProjectDto.from(p, counts.getOrDefault(p.getId(), 0)))
                .toList();
    }

    @Transactional
    public ProjectDto create(UUID userId, CreateProjectRequest req) {
        User owner = userRepository.getReferenceById(userId);

        // Sibling projects (excludes Inbox, which is pinned to the top).
        List<Project> siblings = projectRepository.findActiveByMember(userId).stream()
                .filter(p -> !p.isInbox())
                .toList();

        int position;
        if (req.position() != null) {
            position = Math.max(0, Math.min(req.position(), siblings.size()));
            // Shift everything at or after the insert slot down by one.
            for (Project p : siblings) {
                if (p.getPosition() >= position) p.setPosition(p.getPosition() + 1);
            }
        } else {
            position = siblings.size();
        }

        Project project = new Project();
        project.setName(req.name());
        project.setColor(req.color());
        project.setOwner(owner);
        project.setPosition(position);
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
        realtime.publish(projectId);
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

    // ---- Sharing / members (collaboration) --------------------------------

    @Transactional(readOnly = true)
    public List<MemberDto> listMembers(UUID projectId, UUID userId) {
        loadMemberProject(projectId, userId); // authz: caller must be a member
        return projectMemberRepository.findByProjectId(projectId).stream()
                // Owner first, then by name, for a stable Share-dialog order.
                .sorted(java.util.Comparator
                        .comparing((ProjectMember m) -> m.getRole() != ProjectRole.OWNER)
                        .thenComparing(m -> m.getUser().getName(), String.CASE_INSENSITIVE_ORDER))
                .map(MemberDto::from)
                .toList();
    }

    @Transactional
    public MemberDto addMember(UUID projectId, UUID userId, String email) {
        Project project = loadMemberProject(projectId, userId);
        if (project.isInbox()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The Inbox cannot be shared");
        }
        User invitee = userRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "No Todoist user with that email"));
        if (projectMemberRepository.existsByProjectIdAndUserId(projectId, invitee.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Already a member of this project");
        }
        ProjectMember member = new ProjectMember();
        member.setProject(project);
        member.setUser(invitee);
        member.setRole(ProjectRole.MEMBER);
        MemberDto dto = MemberDto.from(projectMemberRepository.save(member));
        realtime.publish(projectId);
        return dto;
    }

    @Transactional
    public void removeMember(UUID projectId, UUID userId, UUID targetUserId) {
        // Caller must be a member. Any member can remove any other member, and
        // anyone (including the project owner) can leave — there is no owner-only
        // restriction. This mirrors Todoist: collaborators can remove each other.
        projectMemberRepository.findByProjectIdAndUserId(projectId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found"));
        ProjectMember target = projectMemberRepository.findByProjectIdAndUserId(projectId, targetUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Member not found"));

        boolean selfLeave = userId.equals(targetUserId);
        String removedName = displayName(target.getUser());
        String removedEmail = target.getUser().getEmail();
        String projectName = target.getProject().getName();
        projectMemberRepository.delete(target);

        if (selfLeave) {
            // Voluntary "Leave": no email; notify the members who remain that this
            // person left ("{leaver} left {project}").
            for (ProjectMember remaining : projectMemberRepository.findByProjectId(projectId)) {
                notificationService.create(remaining.getUser().getId(), NotificationType.LEFT_PROJECT,
                        removedName, projectName, null, projectId, null, null);
            }
        } else {
            // "Remove from project": email + notify the person who lost access.
            emailService.sendRemoval(removedEmail, removedName, projectName);
            String removerName = displayName(userRepository.getReferenceById(userId));
            notificationService.create(targetUserId, NotificationType.REMOVED_FROM_PROJECT,
                    removerName, projectName, null, projectId, null, null);
        }
        realtime.publish(projectId);
    }

    private static String displayName(User u) {
        return (u.getName() != null && !u.getName().isBlank()) ? u.getName() : u.getEmail();
    }

    private Project loadMemberProject(UUID projectId, UUID userId) {
        if (!projectMemberRepository.existsByProjectIdAndUserId(projectId, userId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found");
        }
        return projectRepository.findById(projectId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found"));
    }
}

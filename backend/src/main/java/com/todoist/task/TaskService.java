package com.todoist.task;

import com.todoist.project.Project;
import com.todoist.project.ProjectMemberRepository;
import com.todoist.project.ProjectRepository;
import com.todoist.project.Section;
import com.todoist.project.SectionRepository;
import com.todoist.attachment.AttachmentRepository;
import com.todoist.attachment.dto.AttachmentDto;
import com.todoist.label.Label;
import com.todoist.label.LabelRepository;
import com.todoist.notification.NotificationService;
import com.todoist.notification.NotificationType;
import com.todoist.project.ProjectMember;
import com.todoist.realtime.RealtimeService;
import com.todoist.task.dto.CreateTaskRequest;
import com.todoist.task.dto.MoveTaskRequest;
import com.todoist.task.dto.TaskDto;
import com.todoist.task.dto.UpdateTaskRequest;
import com.todoist.user.User;
import com.todoist.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final SectionRepository sectionRepository;
    private final LabelRepository labelRepository;
    private final CommentRepository commentRepository;
    private final AttachmentRepository attachmentRepository;
    private final RealtimeService realtime;
    private final NotificationService notificationService;

    public TaskService(TaskRepository taskRepository,
                       ProjectRepository projectRepository,
                       UserRepository userRepository,
                       ProjectMemberRepository projectMemberRepository,
                       SectionRepository sectionRepository,
                       LabelRepository labelRepository,
                       CommentRepository commentRepository,
                       AttachmentRepository attachmentRepository,
                       RealtimeService realtime,
                       NotificationService notificationService) {
        this.taskRepository = taskRepository;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.projectMemberRepository = projectMemberRepository;
        this.sectionRepository = sectionRepository;
        this.labelRepository = labelRepository;
        this.commentRepository = commentRepository;
        this.attachmentRepository = attachmentRepository;
        this.realtime = realtime;
        this.notificationService = notificationService;
    }

    @Transactional(readOnly = true)
    public List<TaskDto> listProjectTasks(UUID projectId, UUID userId) {
        assertMember(projectId, userId);
        // One grouped query for the per-parent done/total tallies (avoids N+1).
        Map<UUID, int[]> counts = new HashMap<>();
        for (TaskRepository.SubtaskCount c : taskRepository.subtaskCounts(projectId)) {
            counts.put(c.getParentId(), new int[]{(int) c.getTotal(), (int) c.getDone()});
        }
        // One grouped query for the per-task comment-count badge.
        Map<UUID, Integer> commentCounts = new HashMap<>();
        for (CommentRepository.TaskCommentCount c : commentRepository.commentCountsByProject(projectId)) {
            commentCounts.put(c.getTaskId(), (int) c.getCnt());
        }
        // Flat list of every open task (incl. sub-tasks); the frontend nests them.
        return taskRepository.findByProjectIdAndCompletedFalseOrderByPosition(projectId)
                .stream()
                .map(t -> {
                    int[] c = counts.getOrDefault(t.getId(), ZERO_COUNT);
                    return TaskDto.from(t, c[0], c[1], commentCounts.getOrDefault(t.getId(), 0));
                })
                .toList();
    }

    private static final int[] ZERO_COUNT = {0, 0};

    @Transactional
    public TaskDto create(UUID projectId, UUID userId, CreateTaskRequest req) {
        assertMember(projectId, userId);
        Project project = projectRepository.getReferenceById(projectId);
        User creator = userRepository.getReferenceById(userId);

        Task task = new Task();
        task.setProject(project);
        task.setCreatedBy(creator);
        task.setContent(req.content());
        task.setDescription(req.description());
        task.setPriority(req.priority() != null ? req.priority() : 4);
        task.setDueDate(req.dueDate());
        task.setPosition(taskRepository.countByProjectIdAndParentTaskIsNull(projectId));

        if (req.sectionId() != null) {
            Section section = sectionRepository.findById(req.sectionId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Section not found"));
            if (!section.getProject().getId().equals(projectId)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Section is not in this project");
            }
            task.setSection(section);
        }

        if (req.assigneeId() != null) applyAssignee(task, req.assigneeId());

        Task saved = taskRepository.save(task);
        // Notify the assignee if a task was created already assigned to someone else.
        if (req.assigneeId() != null && !req.assigneeId().equals(userId)) {
            notificationService.create(req.assigneeId(), NotificationType.TASK_ASSIGNED,
                    actorName(userId), saved.getContent(), null, projectId, saved.getId(), null);
        }
        realtime.publish(projectId);
        return TaskDto.from(saved);
    }

    @Transactional(readOnly = true)
    public TaskDto get(UUID taskId, UUID userId) {
        Task task = loadOwnedTask(taskId, userId);
        AttachmentDto att = attachmentRepository.findByTaskId(taskId).map(AttachmentDto::from).orElse(null);
        return TaskDto.from(task, 0, 0, 0, att);
    }

    @Transactional(readOnly = true)
    public List<TaskDto> listSubtasks(UUID parentTaskId, UUID userId) {
        loadOwnedTask(parentTaskId, userId); // authz on the parent
        return taskRepository.findByParentTaskIdOrderByPosition(parentTaskId)
                .stream().map(TaskDto::from).toList();
    }

    @Transactional
    public TaskDto createSubtask(UUID parentTaskId, UUID userId, CreateTaskRequest req) {
        Task parent = loadOwnedTask(parentTaskId, userId);

        Task task = new Task();
        task.setProject(parent.getProject());
        task.setParentTask(parent);
        task.setSection(parent.getSection());
        task.setCreatedBy(userRepository.getReferenceById(userId));
        task.setContent(req.content());
        task.setDescription(req.description());
        task.setPriority(req.priority() != null ? req.priority() : 4);
        task.setDueDate(req.dueDate());
        task.setPosition(taskRepository.findByParentTaskIdOrderByPosition(parentTaskId).size());

        TaskDto dto = TaskDto.from(taskRepository.save(task));
        realtime.publish(parent.getProject().getId());
        return dto;
    }

    @Transactional
    public TaskDto update(UUID taskId, UUID userId, UpdateTaskRequest req) {
        Task task = loadOwnedTask(taskId, userId);
        UUID projectId = task.getProject().getId();
        boolean wasCompleted = task.isCompleted();
        UUID prevAssigneeId = task.getAssignee() != null ? task.getAssignee().getId() : null;

        if (req.content() != null) task.setContent(req.content());
        if (req.description() != null) task.setDescription(req.description());
        if (req.priority() != null) task.setPriority(req.priority());
        if (Boolean.TRUE.equals(req.clearDueDate())) task.setDueDate(null);
        else if (req.dueDate() != null) task.setDueDate(req.dueDate());
        if (req.completed() != null) {
            task.setCompleted(req.completed());
            task.setCompletedAt(req.completed() ? OffsetDateTime.now() : null);
        }
        if (Boolean.TRUE.equals(req.clearAssignee())) task.setAssignee(null);
        else if (req.assigneeId() != null) applyAssignee(task, req.assigneeId());

        // ---- Notifications (shared projects) -------------------------------
        // Completed / reopened -> tell the other project members.
        if (req.completed() != null && req.completed() != wasCompleted) {
            notifyOtherMembers(projectId, userId,
                    req.completed() ? NotificationType.TASK_COMPLETED : NotificationType.TASK_UNCOMPLETED,
                    task);
        }
        // Newly assigned to someone else -> tell that assignee.
        UUID newAssigneeId = task.getAssignee() != null ? task.getAssignee().getId() : null;
        if (newAssigneeId != null && !newAssigneeId.equals(prevAssigneeId) && !newAssigneeId.equals(userId)) {
            notificationService.create(newAssigneeId, NotificationType.TASK_ASSIGNED,
                    actorName(userId), task.getContent(), null, projectId, task.getId(), null);
        }

        realtime.publish(projectId);
        return TaskDto.from(task); // managed entity; flushed on commit
    }

    /** Notify every member of the project except the actor (e.g. task completed). */
    private void notifyOtherMembers(UUID projectId, UUID actorId, NotificationType type, Task task) {
        String actor = actorName(actorId);
        for (ProjectMember m : projectMemberRepository.findByProjectId(projectId)) {
            UUID memberId = m.getUser().getId();
            if (!memberId.equals(actorId)) {
                notificationService.create(memberId, type, actor, task.getContent(),
                        null, projectId, task.getId(), null);
            }
        }
    }

    private String actorName(UUID userId) {
        return userRepository.findById(userId).map(User::getName).orElse("Someone");
    }

    /** Set a task's assignee, requiring that user to be a member of the task's project. */
    private void applyAssignee(Task task, UUID assigneeId) {
        if (!projectMemberRepository.existsByProjectIdAndUserId(task.getProject().getId(), assigneeId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Assignee must be a member of the project");
        }
        task.setAssignee(userRepository.getReferenceById(assigneeId));
    }

    @Transactional
    public void delete(UUID taskId, UUID userId) {
        Task task = loadOwnedTask(taskId, userId);
        UUID projectId = task.getProject().getId();
        taskRepository.delete(task);
        realtime.publish(projectId);
    }

    /** Replace a task's labels with the given set (only the user's own labels). */
    @Transactional
    public TaskDto setLabels(UUID taskId, UUID userId, List<UUID> labelIds) {
        Task task = loadOwnedTask(taskId, userId);
        List<Label> labels = (labelIds == null || labelIds.isEmpty())
                ? List.of()
                : labelRepository.findByUserIdAndIdIn(userId, labelIds);
        task.getLabels().clear();
        task.getLabels().addAll(labels);
        realtime.publish(task.getProject().getId());
        return TaskDto.from(task);
    }

    /** Drag-and-drop reposition/re-parent: set parent + section + slot, then reindex siblings. */
    @Transactional
    public TaskDto move(UUID taskId, UUID userId, MoveTaskRequest req) {
        Task task = loadOwnedTask(taskId, userId);
        UUID projectId = task.getProject().getId();

        Task newParent = null;
        if (req.parentId() != null) {
            newParent = taskRepository.findById(req.parentId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Parent task not found"));
            if (!newParent.getProject().getId().equals(projectId)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Parent is in another project");
            }
            // Cycle guard: walking up from the new parent must never reach the moved task.
            for (Task a = newParent; a != null; a = a.getParentTask()) {
                if (a.getId().equals(taskId)) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot move a task under its own sub-task");
                }
            }
        }

        Section newSection = null;
        if (req.sectionId() != null) {
            newSection = sectionRepository.findById(req.sectionId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Section not found"));
            if (!newSection.getProject().getId().equals(projectId)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Section is in another project");
            }
        }

        task.setParentTask(newParent);
        task.setSection(newSection);

        // Reindex the destination sibling group (same parent + section) to 0..n.
        UUID destParentId = newParent != null ? newParent.getId() : null;
        UUID destSectionId = newSection != null ? newSection.getId() : null;
        List<Task> siblings = new java.util.ArrayList<>(taskRepository.findByProjectId(projectId).stream()
                .filter(t -> !t.getId().equals(taskId))
                .filter(t -> java.util.Objects.equals(parentIdOf(t), destParentId))
                .filter(t -> java.util.Objects.equals(sectionIdOf(t), destSectionId))
                .sorted(java.util.Comparator.comparingInt(Task::getPosition))
                .toList());

        int idx = Math.max(0, Math.min(req.position(), siblings.size()));
        siblings.add(idx, task);
        for (int i = 0; i < siblings.size(); i++) siblings.get(i).setPosition(i);

        realtime.publish(projectId);
        return TaskDto.from(task);
    }

    private static UUID parentIdOf(Task t) {
        return t.getParentTask() != null ? t.getParentTask().getId() : null;
    }

    private static UUID sectionIdOf(Task t) {
        return t.getSection() != null ? t.getSection().getId() : null;
    }

    private Task loadOwnedTask(UUID taskId, UUID userId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found"));
        assertMember(task.getProject().getId(), userId);
        return task;
    }

    /** 404 (not 403) so we don't reveal the existence of projects the user can't see. */
    private void assertMember(UUID projectId, UUID userId) {
        if (!projectMemberRepository.existsByProjectIdAndUserId(projectId, userId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found");
        }
    }
}

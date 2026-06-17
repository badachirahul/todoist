package com.todoist.task;

import com.todoist.project.Project;
import com.todoist.project.ProjectMemberRepository;
import com.todoist.project.ProjectRepository;
import com.todoist.task.dto.CreateTaskRequest;
import com.todoist.task.dto.TaskDto;
import com.todoist.task.dto.UpdateTaskRequest;
import com.todoist.user.User;
import com.todoist.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final ProjectMemberRepository projectMemberRepository;

    public TaskService(TaskRepository taskRepository,
                       ProjectRepository projectRepository,
                       UserRepository userRepository,
                       ProjectMemberRepository projectMemberRepository) {
        this.taskRepository = taskRepository;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.projectMemberRepository = projectMemberRepository;
    }

    @Transactional(readOnly = true)
    public List<TaskDto> listProjectTasks(UUID projectId, UUID userId) {
        assertMember(projectId, userId);
        return taskRepository
                .findByProjectIdAndParentTaskIsNullAndCompletedFalseOrderByPosition(projectId)
                .stream().map(TaskDto::from).toList();
    }

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

        return TaskDto.from(taskRepository.save(task));
    }

    @Transactional
    public TaskDto update(UUID taskId, UUID userId, UpdateTaskRequest req) {
        Task task = loadOwnedTask(taskId, userId);

        if (req.content() != null) task.setContent(req.content());
        if (req.description() != null) task.setDescription(req.description());
        if (req.priority() != null) task.setPriority(req.priority());
        if (req.dueDate() != null) task.setDueDate(req.dueDate());
        if (req.completed() != null) {
            task.setCompleted(req.completed());
            task.setCompletedAt(req.completed() ? OffsetDateTime.now() : null);
        }
        return TaskDto.from(task); // managed entity; flushed on commit
    }

    @Transactional
    public void delete(UUID taskId, UUID userId) {
        Task task = loadOwnedTask(taskId, userId);
        taskRepository.delete(task);
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

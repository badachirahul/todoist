package com.todoist.task;

import com.todoist.task.dto.CreateTaskRequest;
import com.todoist.task.dto.TaskDto;
import com.todoist.task.dto.UpdateTaskRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @GetMapping("/api/projects/{projectId}/tasks")
    public List<TaskDto> list(@PathVariable UUID projectId, @AuthenticationPrincipal UUID userId) {
        return taskService.listProjectTasks(projectId, userId);
    }

    @PostMapping("/api/projects/{projectId}/tasks")
    @ResponseStatus(HttpStatus.CREATED)
    public TaskDto create(@PathVariable UUID projectId,
                          @AuthenticationPrincipal UUID userId,
                          @Valid @RequestBody CreateTaskRequest req) {
        return taskService.create(projectId, userId, req);
    }

    @GetMapping("/api/tasks/{taskId}")
    public TaskDto get(@PathVariable UUID taskId, @AuthenticationPrincipal UUID userId) {
        return taskService.get(taskId, userId);
    }

    @GetMapping("/api/tasks/{taskId}/subtasks")
    public List<TaskDto> subtasks(@PathVariable UUID taskId, @AuthenticationPrincipal UUID userId) {
        return taskService.listSubtasks(taskId, userId);
    }

    @PostMapping("/api/tasks/{taskId}/subtasks")
    @ResponseStatus(HttpStatus.CREATED)
    public TaskDto createSubtask(@PathVariable UUID taskId,
                                 @AuthenticationPrincipal UUID userId,
                                 @Valid @RequestBody CreateTaskRequest req) {
        return taskService.createSubtask(taskId, userId, req);
    }

    @PatchMapping("/api/tasks/{taskId}")
    public TaskDto update(@PathVariable UUID taskId,
                          @AuthenticationPrincipal UUID userId,
                          @Valid @RequestBody UpdateTaskRequest req) {
        return taskService.update(taskId, userId, req);
    }

    @DeleteMapping("/api/tasks/{taskId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID taskId, @AuthenticationPrincipal UUID userId) {
        taskService.delete(taskId, userId);
    }
}

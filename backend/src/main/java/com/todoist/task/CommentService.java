package com.todoist.task;

import com.todoist.notification.NotificationService;
import com.todoist.notification.NotificationType;
import com.todoist.project.ProjectMember;
import com.todoist.project.ProjectMemberRepository;
import com.todoist.realtime.RealtimeService;
import com.todoist.task.dto.CommentDto;
import com.todoist.user.User;
import com.todoist.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class CommentService {

    private final CommentRepository commentRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final RealtimeService realtime;
    private final NotificationService notificationService;

    public CommentService(CommentRepository commentRepository,
                          TaskRepository taskRepository,
                          UserRepository userRepository,
                          ProjectMemberRepository projectMemberRepository,
                          RealtimeService realtime,
                          NotificationService notificationService) {
        this.commentRepository = commentRepository;
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.projectMemberRepository = projectMemberRepository;
        this.realtime = realtime;
        this.notificationService = notificationService;
    }

    @Transactional(readOnly = true)
    public List<CommentDto> list(UUID taskId, UUID userId) {
        assertTaskMember(taskId, userId);
        return commentRepository.findByTaskIdOrderByCreatedAt(taskId)
                .stream().map(CommentDto::from).toList();
    }

    @Transactional
    public CommentDto create(UUID taskId, UUID userId, String content) {
        Task task = assertTaskMember(taskId, userId);
        User author = userRepository.getReferenceById(userId);
        Comment comment = new Comment();
        comment.setTask(task);
        comment.setUser(author);
        comment.setContent(content);
        // Flush so @CreationTimestamp is populated in the returned DTO.
        CommentDto dto = CommentDto.from(commentRepository.saveAndFlush(comment));

        UUID projectId = task.getProject().getId();
        // Notify every other member of the project that a comment was added.
        for (ProjectMember m : projectMemberRepository.findByProjectId(projectId)) {
            UUID memberId = m.getUser().getId();
            if (!memberId.equals(userId)) {
                notificationService.create(memberId, NotificationType.COMMENT_ADDED,
                        author.getName(), task.getContent(), content, projectId, task.getId(), null);
            }
        }
        // Push so other members with this task's modal open see the comment live.
        realtime.publish(projectId);
        return dto;
    }

    @Transactional
    public void delete(UUID commentId, UUID userId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found"));
        // Only the author can delete their comment.
        if (!comment.getUser().getId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your comment");
        }
        UUID projectId = comment.getTask().getProject().getId();
        commentRepository.delete(comment);
        realtime.publish(projectId); // live-remove for other open modals
    }

    private Task assertTaskMember(UUID taskId, UUID userId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found"));
        if (!projectMemberRepository.existsByProjectIdAndUserId(task.getProject().getId(), userId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found");
        }
        return task;
    }
}

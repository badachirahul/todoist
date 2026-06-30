package com.todoist.service;

import com.todoist.dto.AttachmentDto;
import com.todoist.dto.CommentDto;
import com.todoist.entity.Attachment;
import com.todoist.entity.Comment;
import com.todoist.entity.NotificationType;
import com.todoist.entity.ProjectMember;
import com.todoist.entity.Task;
import com.todoist.entity.User;
import com.todoist.repository.AttachmentRepository;
import com.todoist.repository.CommentRepository;
import com.todoist.repository.ProjectMemberRepository;
import com.todoist.repository.TaskRepository;
import com.todoist.repository.UserRepository;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class CommentService {

    private final CommentRepository commentRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final AttachmentRepository attachmentRepository;
    private final RealtimeService realtime;
    private final NotificationService notificationService;

    public CommentService(CommentRepository commentRepository,
                          TaskRepository taskRepository,
                          UserRepository userRepository,
                          ProjectMemberRepository projectMemberRepository,
                          AttachmentRepository attachmentRepository,
                          RealtimeService realtime,
                          NotificationService notificationService) {
        this.commentRepository = commentRepository;
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.projectMemberRepository = projectMemberRepository;
        this.attachmentRepository = attachmentRepository;
        this.realtime = realtime;
        this.notificationService = notificationService;
    }

    @Transactional(readOnly = true)
    public List<CommentDto> list(UUID taskId, UUID userId) {
        assertTaskMember(taskId, userId);
        List<Comment> comments = commentRepository.findByTaskIdOrderByCreatedAt(taskId);
        // Batch-load any comment attachments (avoids N+1).
        Map<UUID, AttachmentDto> attachments = new HashMap<>();
        if (!comments.isEmpty()) {
            for (Attachment a : attachmentRepository.findByCommentIdIn(comments.stream().map(Comment::getId).toList())) {
                attachments.put(a.getComment().getId(), AttachmentDto.from(a));
            }
        }
        return comments.stream()
                .map(c -> CommentDto.from(c, attachments.get(c.getId())))
                .toList();
    }

    @Transactional
    public CommentDto create(UUID taskId, UUID userId, String content) {
        Task task = assertTaskMember(taskId, userId);
        User author = userRepository.getReferenceById(userId);
        String body = content != null ? content : ""; // attachment-only comments have no text
        Comment comment = new Comment();
        comment.setTask(task);
        comment.setUser(author);
        comment.setContent(body);
        // Flush so @CreationTimestamp is populated in the returned DTO.
        CommentDto dto = CommentDto.from(commentRepository.saveAndFlush(comment));

        UUID projectId = task.getProject().getId();
        // Notify every other member of the project that a comment was added.
        for (ProjectMember m : projectMemberRepository.findByProjectId(projectId)) {
            UUID memberId = m.getUser().getId();
            if (!memberId.equals(userId)) {
                notificationService.create(memberId, NotificationType.COMMENT_ADDED,
                        author.getName(), task.getContent(), body, projectId, task.getId(), null);
            }
        }
        // Push so other members with this task's modal open see the comment live.
        realtime.publish(projectId);
        return dto;
    }

    /** Edit a comment's text (author only). */
    @Transactional
    public CommentDto update(UUID commentId, UUID userId, String content) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found"));
        if (!comment.getUser().getId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your comment");
        }
        comment.setContent(content != null ? content : "");
        AttachmentDto att = attachmentRepository.findByCommentId(commentId).map(AttachmentDto::from).orElse(null);
        realtime.publish(comment.getTask().getProject().getId());
        return CommentDto.from(comment, att);
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

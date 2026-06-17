package com.todoist.task;

import com.todoist.project.ProjectMemberRepository;
import com.todoist.task.dto.CommentDto;
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

    public CommentService(CommentRepository commentRepository,
                          TaskRepository taskRepository,
                          UserRepository userRepository,
                          ProjectMemberRepository projectMemberRepository) {
        this.commentRepository = commentRepository;
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.projectMemberRepository = projectMemberRepository;
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
        Comment comment = new Comment();
        comment.setTask(task);
        comment.setUser(userRepository.getReferenceById(userId));
        comment.setContent(content);
        // Flush so @CreationTimestamp is populated in the returned DTO.
        return CommentDto.from(commentRepository.saveAndFlush(comment));
    }

    @Transactional
    public void delete(UUID commentId, UUID userId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found"));
        // Only the author can delete their comment.
        if (!comment.getUser().getId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your comment");
        }
        commentRepository.delete(comment);
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

package com.todoist.task;

import com.todoist.task.dto.CommentDto;
import com.todoist.task.dto.CommentRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
public class CommentController {

    private final CommentService commentService;

    public CommentController(CommentService commentService) {
        this.commentService = commentService;
    }

    @GetMapping("/api/tasks/{taskId}/comments")
    public List<CommentDto> list(@PathVariable UUID taskId, @AuthenticationPrincipal UUID userId) {
        return commentService.list(taskId, userId);
    }

    @PostMapping("/api/tasks/{taskId}/comments")
    @ResponseStatus(HttpStatus.CREATED)
    public CommentDto create(@PathVariable UUID taskId,
                             @AuthenticationPrincipal UUID userId,
                             @Valid @RequestBody CommentRequest req) {
        return commentService.create(taskId, userId, req.content());
    }

    @DeleteMapping("/api/comments/{commentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID commentId, @AuthenticationPrincipal UUID userId) {
        commentService.delete(commentId, userId);
    }
}

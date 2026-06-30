package com.todoist.dto;

// content may be blank for an attachment-only comment (e.g. the task composer's
// "Attachment" button creates a comment that carries just the file).
public record CommentRequest(String content) {
}

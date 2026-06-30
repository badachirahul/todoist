package com.todoist.controller;

import com.todoist.dto.AttachmentDto;
import com.todoist.service.AttachmentService;
import java.util.UUID;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
public class AttachmentController {

    private final AttachmentService attachmentService;

    public AttachmentController(AttachmentService attachmentService) {
        this.attachmentService = attachmentService;
    }

    @PostMapping("/api/comments/{commentId}/attachment")
    @ResponseStatus(HttpStatus.CREATED)
    public AttachmentDto attachToComment(@PathVariable UUID commentId,
                                         @AuthenticationPrincipal UUID userId,
                                         @RequestParam("file") MultipartFile file) {
        return attachmentService.attachToComment(commentId, userId, file);
    }

    @DeleteMapping("/api/attachments/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id, @AuthenticationPrincipal UUID userId) {
        attachmentService.delete(id, userId);
    }

    @GetMapping("/api/attachments/{id}/download")
    public ResponseEntity<Resource> download(@PathVariable UUID id, @AuthenticationPrincipal UUID userId) {
        AttachmentService.Download d = attachmentService.download(id, userId);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(d.contentType()))
                // inline so a preview opens in the browser tab where possible
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + d.filename() + "\"")
                .body(d.resource());
    }
}

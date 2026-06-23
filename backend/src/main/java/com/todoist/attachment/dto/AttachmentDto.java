package com.todoist.attachment.dto;

import com.todoist.attachment.Attachment;

import java.util.UUID;

/** Attachment metadata for the frontend; `url` is the download endpoint. */
public record AttachmentDto(
        UUID id,
        String filename,
        String contentType,
        long sizeBytes,
        String url
) {
    public static AttachmentDto from(Attachment a) {
        return new AttachmentDto(
                a.getId(),
                a.getFilename(),
                a.getContentType(),
                a.getSizeBytes(),
                "/api/attachments/" + a.getId() + "/download");
    }
}

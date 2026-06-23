package com.todoist.notification.dto;

import com.todoist.notification.Notification;
import com.todoist.notification.NotificationType;

import java.time.OffsetDateTime;
import java.util.UUID;

/** A notification as shown on the Notifications page. The frontend builds the
 *  sentence from {@code type} + {@code actorName} + {@code subjectName}. */
public record NotificationDto(
        UUID id,
        NotificationType type,
        String actorName,
        String subjectName,
        String body,
        UUID projectId,
        UUID taskId,
        boolean read,
        OffsetDateTime createdAt
) {
    public static NotificationDto from(Notification n) {
        return new NotificationDto(
                n.getId(),
                n.getType(),
                n.getActorName(),
                n.getSubjectName(),
                n.getBody(),
                n.getProjectId(),
                n.getTaskId(),
                n.isRead(),
                n.getCreatedAt());
    }
}

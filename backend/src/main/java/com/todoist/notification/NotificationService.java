package com.todoist.notification;

import com.todoist.notification.dto.NotificationDto;
import com.todoist.realtime.RealtimeService;
import com.todoist.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

/**
 * Creates and serves personal notifications. {@link #create} is called from the
 * project/comment services (joining their transaction); after the row is saved
 * it pushes a per-user SSE event so the recipient's badge/page update live.
 */
@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final RealtimeService realtime;

    public NotificationService(NotificationRepository notificationRepository,
                               UserRepository userRepository,
                               RealtimeService realtime) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.realtime = realtime;
    }

    /** Convenience: a notification with no navigation target. */
    @Transactional
    public void create(UUID recipientId, NotificationType type,
                       String actorName, String subjectName, String body) {
        create(recipientId, type, actorName, subjectName, body, null, null, null);
    }

    @Transactional
    public void create(UUID recipientId, NotificationType type,
                       String actorName, String subjectName, String body,
                       UUID projectId, UUID taskId, String invitationToken) {
        Notification n = new Notification();
        n.setRecipient(userRepository.getReferenceById(recipientId));
        n.setType(type);
        n.setActorName(actorName);
        n.setSubjectName(subjectName);
        n.setBody(body);
        n.setProjectId(projectId);
        n.setTaskId(taskId);
        n.setInvitationToken(invitationToken);
        notificationRepository.save(n);
        realtime.publishUser(recipientId); // fires after the surrounding tx commits
    }

    @Transactional(readOnly = true)
    public List<NotificationDto> list(UUID userId) {
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId)
                .stream().map(NotificationDto::from).toList();
    }

    @Transactional(readOnly = true)
    public long unreadCount(UUID userId) {
        return notificationRepository.countByRecipientIdAndReadFalse(userId);
    }

    @Transactional
    public void markAllRead(UUID userId) {
        notificationRepository.markAllRead(userId);
        realtime.publishUser(userId); // clear the badge on every open tab
    }

    /** Toggle a single notification's read state (the row's right-side circle). */
    @Transactional
    public void setRead(UUID notificationId, UUID userId, boolean read) {
        Notification n = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found"));
        if (!n.getRecipient().getId().equals(userId)) {
            // Don't reveal another user's notification exists.
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found");
        }
        n.setRead(read);
        realtime.publishUser(userId); // keep badge/count in sync across tabs
    }
}

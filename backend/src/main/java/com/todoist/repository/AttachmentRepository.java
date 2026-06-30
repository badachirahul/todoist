package com.todoist.repository;

import com.todoist.entity.Attachment;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AttachmentRepository extends JpaRepository<Attachment, UUID> {

    Optional<Attachment> findByTaskId(UUID taskId);

    boolean existsByTaskId(UUID taskId);

    Optional<Attachment> findByCommentId(UUID commentId);

    boolean existsByCommentId(UUID commentId);

    /** Batch-load comment attachments for a task's comment list (avoids N+1). */
    List<Attachment> findByCommentIdIn(Collection<UUID> commentIds);
}

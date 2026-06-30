package com.todoist.repository;

import com.todoist.entity.Comment;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CommentRepository extends JpaRepository<Comment, UUID> {

    List<Comment> findByTaskIdOrderByCreatedAt(UUID taskId);

    /** Per-task comment counts for one project (one query, for the task-row badge). */
    @Query("select c.task.id as taskId, count(c) as cnt from Comment c " +
            "where c.task.project.id = :projectId group by c.task.id")
    List<TaskCommentCount> commentCountsByProject(@Param("projectId") UUID projectId);

    interface TaskCommentCount {
        UUID getTaskId();
        long getCnt();
    }
}

package com.todoist.task;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface TaskRepository extends JpaRepository<Task, UUID> {

    // Top-level, not-completed tasks of a project, ordered for display.
    List<Task> findByProjectIdAndParentTaskIsNullAndCompletedFalseOrderByPosition(UUID projectId);

    List<Task> findByParentTaskIdOrderByPosition(UUID parentTaskId);

    int countByProjectIdAndParentTaskIsNull(UUID projectId);

    /** Search the user's (member-visible) open tasks by content. */
    @Query("""
            select t from Task t
            where t.completed = false
              and lower(t.content) like lower(concat('%', :q, '%'))
              and exists (select 1 from ProjectMember pm
                          where pm.project = t.project and pm.user.id = :userId)
            order by t.createdAt desc
            """)
    List<Task> searchByMember(@Param("userId") UUID userId, @Param("q") String q);
}

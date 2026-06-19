package com.todoist.task;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface TaskRepository extends JpaRepository<Task, UUID> {

    // Top-level, not-completed tasks of a project, ordered for display.
    List<Task> findByProjectIdAndParentTaskIsNullAndCompletedFalseOrderByPosition(UUID projectId);

    // All not-completed tasks of a project (incl. sub-tasks) — the frontend
    // builds the nesting tree from this flat list via parentTaskId/position.
    List<Task> findByProjectIdAndCompletedFalseOrderByPosition(UUID projectId);

    List<Task> findByParentTaskIdOrderByPosition(UUID parentTaskId);

    List<Task> findByProjectId(UUID projectId);

    int countByProjectIdAndParentTaskIsNull(UUID projectId);

    /** Per-parent sub-task tallies for the "done/total" indicator (incl. completed children). */
    @Query("""
            select t.parentTask.id as parentId,
                   count(t) as total,
                   sum(case when t.completed then 1 else 0 end) as done
            from Task t
            where t.project.id = :projectId and t.parentTask is not null
            group by t.parentTask.id
            """)
    List<SubtaskCount> subtaskCounts(@Param("projectId") UUID projectId);

    /** Projection for {@link #subtaskCounts}. */
    interface SubtaskCount {
        UUID getParentId();
        long getTotal();
        long getDone();
    }

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

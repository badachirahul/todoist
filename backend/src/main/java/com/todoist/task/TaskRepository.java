package com.todoist.task;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TaskRepository extends JpaRepository<Task, UUID> {

    // Top-level, not-completed tasks of a project, ordered for display.
    List<Task> findByProjectIdAndParentTaskIsNullAndCompletedFalseOrderByPosition(UUID projectId);

    List<Task> findByParentTaskIdOrderByPosition(UUID parentTaskId);

    int countByProjectIdAndParentTaskIsNull(UUID projectId);
}

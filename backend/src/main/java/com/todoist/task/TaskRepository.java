package com.todoist.task;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TaskRepository extends JpaRepository<Task, UUID> {

    // Top-level tasks of a project (sub-tasks excluded), ordered for display.
    List<Task> findByProjectIdAndParentTaskIsNullOrderByPosition(UUID projectId);

    List<Task> findByParentTaskIdOrderByPosition(UUID parentTaskId);
}

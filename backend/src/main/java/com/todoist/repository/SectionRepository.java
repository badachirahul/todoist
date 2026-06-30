package com.todoist.repository;

import com.todoist.entity.Section;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SectionRepository extends JpaRepository<Section, UUID> {

    List<Section> findByProjectIdOrderByPosition(UUID projectId);
}

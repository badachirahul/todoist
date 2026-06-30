package com.todoist.repository;

import com.todoist.entity.Label;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LabelRepository extends JpaRepository<Label, UUID> {

    List<Label> findByUserIdOrderByName(UUID userId);

    boolean existsByUserIdAndName(UUID userId, String name);

    /** Load the given labels that belong to the user (ignores any that don't). */
    List<Label> findByUserIdAndIdIn(UUID userId, Collection<UUID> ids);
}

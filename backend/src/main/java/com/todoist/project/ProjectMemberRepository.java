package com.todoist.project;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ProjectMemberRepository extends JpaRepository<ProjectMember, UUID> {

    List<ProjectMember> findByUserId(UUID userId);

    boolean existsByProjectIdAndUserId(UUID projectId, UUID userId);
}

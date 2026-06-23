package com.todoist.project;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProjectInvitationRepository extends JpaRepository<ProjectInvitation, UUID> {

    Optional<ProjectInvitation> findByToken(String token);

    List<ProjectInvitation> findByProjectIdAndStatus(UUID projectId, String status);

    Optional<ProjectInvitation> findByProjectIdAndEmail(UUID projectId, String email);
}

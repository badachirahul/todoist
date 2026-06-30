package com.todoist.repository;

import com.todoist.entity.ProjectInvitation;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProjectInvitationRepository extends JpaRepository<ProjectInvitation, UUID> {

    Optional<ProjectInvitation> findByToken(String token);

    List<ProjectInvitation> findByProjectIdAndStatus(UUID projectId, String status);

    Optional<ProjectInvitation> findByProjectIdAndEmail(UUID projectId, String email);
}

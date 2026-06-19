package com.todoist.project;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProjectRepository extends JpaRepository<Project, UUID> {

    Optional<Project> findByOwnerIdAndInboxTrue(UUID ownerId);

    /** All non-archived projects the user is a member of, ordered for the sidebar (Inbox first). */
    @Query("""
            select pm.project from ProjectMember pm
            where pm.user.id = :userId and pm.project.archived = false
            order by pm.project.inbox desc, pm.project.position asc
            """)
    List<Project> findActiveByMember(@Param("userId") UUID userId);

    /** Archived projects the user is a member of (for the "Archived projects only" view). */
    @Query("""
            select pm.project from ProjectMember pm
            where pm.user.id = :userId and pm.project.archived = true
            order by pm.project.position asc
            """)
    List<Project> findArchivedByMember(@Param("userId") UUID userId);

    /** Search the user's (member-visible) projects by name. */
    @Query("""
            select pm.project from ProjectMember pm
            where pm.user.id = :userId and pm.project.archived = false
              and lower(pm.project.name) like lower(concat('%', :q, '%'))
            order by pm.project.inbox desc, pm.project.position asc
            """)
    List<Project> searchByMember(@Param("userId") UUID userId, @Param("q") String q);
}

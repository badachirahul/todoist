package com.todoist.project;

import com.todoist.notification.Notification;
import com.todoist.notification.NotificationRepository;
import com.todoist.notification.NotificationService;
import com.todoist.notification.NotificationType;
import com.todoist.project.dto.InvitationDto;
import com.todoist.realtime.RealtimeService;
import com.todoist.user.User;
import com.todoist.user.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

/** Project invitations by email: create + email, list/cancel pending, accept. */
@Service
public class InvitationService {

    private final ProjectInvitationRepository invitationRepository;
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final RealtimeService realtime;
    private final NotificationService notificationService;
    private final NotificationRepository notificationRepository;
    private final String frontendUrl;

    public InvitationService(ProjectInvitationRepository invitationRepository,
                             ProjectRepository projectRepository,
                             ProjectMemberRepository projectMemberRepository,
                             UserRepository userRepository,
                             EmailService emailService,
                             RealtimeService realtime,
                             NotificationService notificationService,
                             NotificationRepository notificationRepository,
                             @Value("${app.frontend-url}") String frontendUrl) {
        this.invitationRepository = invitationRepository;
        this.projectRepository = projectRepository;
        this.projectMemberRepository = projectMemberRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
        this.realtime = realtime;
        this.notificationService = notificationService;
        this.notificationRepository = notificationRepository;
        this.frontendUrl = frontendUrl;
    }

    @Transactional
    public InvitationDto invite(UUID projectId, UUID inviterId, String rawEmail) {
        assertMember(projectId, inviterId);
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found"));
        if (project.isInbox()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The Inbox cannot be shared");
        }
        String email = rawEmail.trim().toLowerCase();

        // Case 1: already an active member of this project.
        boolean activeMember = userRepository.findByEmail(email)
                .map(u -> projectMemberRepository.existsByProjectIdAndUserId(projectId, u.getId()))
                .orElse(false);
        if (activeMember) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This person is already in this project");
        }

        User inviter = userRepository.getReferenceById(inviterId);
        ProjectInvitation inv = invitationRepository.findByProjectIdAndEmail(projectId, email).orElse(null);

        // Case 3: a still-active pending invitation — keep it, don't resend or re-token.
        if (inv != null && "PENDING".equals(inv.getStatus())) {
            return InvitationDto.from(inv);
        }

        // Case 2: brand-new invite, or re-invite of someone who left / was removed /
        // previously accepted. A fresh token invalidates any older link for this email.
        if (inv == null) {
            inv = new ProjectInvitation();
            inv.setProject(project);
            inv.setEmail(email);
        }
        inv.setToken(UUID.randomUUID().toString());
        inv.setInvitedBy(inviter);
        inv.setStatus("PENDING");
        inv = invitationRepository.save(inv);

        emailService.sendInvite(email, inviter.getName(), project.getName(),
                frontendUrl + "/invite/" + inv.getToken());

        // If the invitee is already a registered user, drop them an in-app invite
        // notification ("{inviter} invited you to {project}") carrying this token so
        // its Accept button can join them. Unknown emails get only the email link.
        final String token = inv.getToken();
        final UUID pid = project.getId();
        userRepository.findByEmail(email).ifPresent(invitee ->
                notificationService.create(invitee.getId(), NotificationType.INVITED_TO_PROJECT,
                        inviter.getName(), project.getName(), null, pid, null, token));

        realtime.publish(projectId);
        return InvitationDto.from(inv);
    }

    @Transactional(readOnly = true)
    public List<InvitationDto> listPending(UUID projectId, UUID userId) {
        assertMember(projectId, userId);
        return invitationRepository.findByProjectIdAndStatus(projectId, "PENDING")
                .stream().map(InvitationDto::from).toList();
    }

    @Transactional
    public void cancel(UUID projectId, UUID userId, UUID invitationId) {
        assertMember(projectId, userId);
        ProjectInvitation inv = invitationRepository.findById(invitationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Invitation not found"));
        if (!inv.getProject().getId().equals(projectId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Invitation not found");
        }
        invitationRepository.delete(inv);
        realtime.publish(projectId);
    }

    /** Accept an invitation: add the logged-in user to the project. Returns the project id. */
    @Transactional
    public UUID accept(String token, UUID userId) {
        ProjectInvitation inv = invitationRepository.findByToken(token)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Invitation not found or expired"));
        // Single-use: once accepted (or superseded/revoked), the link is no longer valid.
        // A re-invite mints a new token, so old links land here as non-PENDING.
        if (!"PENDING".equals(inv.getStatus())) {
            throw new ResponseStatusException(HttpStatus.GONE, "This invitation is no longer valid");
        }
        UUID projectId = inv.getProject().getId();
        if (!projectMemberRepository.existsByProjectIdAndUserId(projectId, userId)) {
            ProjectMember member = new ProjectMember();
            member.setProject(inv.getProject());
            member.setUser(userRepository.getReferenceById(userId));
            member.setRole(ProjectRole.MEMBER);
            projectMemberRepository.save(member);

            // Tell the existing members someone joined ("{joiner} joined {project}").
            User joiner = userRepository.findById(userId).orElse(null);
            String joinerName = joiner != null ? joiner.getName() : "Someone";
            String projectName = inv.getProject().getName();
            for (ProjectMember existing : projectMemberRepository.findByProjectId(projectId)) {
                UUID memberId = existing.getUser().getId();
                if (!memberId.equals(userId)) {
                    notificationService.create(memberId, NotificationType.JOINED_PROJECT,
                            joinerName, projectName, null, projectId, null, null);
                }
            }
        }
        inv.setStatus("ACCEPTED");
        realtime.publish(projectId);
        return projectId;
    }

    /**
     * Accept the invitation behind an INVITED_TO_PROJECT notification (its Accept
     * button). Joins the project (unless already a member) and transforms the
     * notification into "added you to …" — deliberately kept unread so it still
     * shows the grey/strip/unread treatment until the user opens it. Returns the
     * project id for client-side navigation/invalidation.
     */
    @Transactional
    public UUID acceptInvite(UUID notificationId, UUID userId) {
        Notification n = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found"));
        if (n.getRecipient() == null || !n.getRecipient().getId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found");
        }
        if (n.getType() != NotificationType.INVITED_TO_PROJECT) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Not a pending invitation");
        }
        UUID projectId = n.getProjectId();
        // Join via the token, unless the email link was already used to accept it.
        if (projectId == null || !projectMemberRepository.existsByProjectIdAndUserId(projectId, userId)) {
            projectId = accept(n.getInvitationToken(), userId);
        }
        n.setType(NotificationType.ADDED_TO_PROJECT);
        n.setProjectId(projectId);
        // Leave n.read = false on purpose.
        realtime.publishUser(userId);
        return projectId;
    }

    /** 404 (not 403) so we don't reveal projects the user can't see. */
    private void assertMember(UUID projectId, UUID userId) {
        if (!projectMemberRepository.existsByProjectIdAndUserId(projectId, userId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found");
        }
    }
}

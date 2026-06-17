package com.todoist.user;

import com.todoist.project.Project;
import com.todoist.project.ProjectMember;
import com.todoist.project.ProjectMemberRepository;
import com.todoist.project.ProjectRepository;
import com.todoist.project.ProjectRole;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository,
                       ProjectRepository projectRepository,
                       ProjectMemberRepository projectMemberRepository,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.projectRepository = projectRepository;
        this.projectMemberRepository = projectMemberRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Look up the user by Google id; create them (plus their personal Inbox)
     * on first login. Existing users get their profile refreshed from Google.
     */
    @Transactional
    public User findOrCreateFromGoogle(String googleId, String email, String name, String avatarUrl) {
        // 1) Returning Google user.
        Optional<User> byGoogle = userRepository.findByGoogleId(googleId);
        if (byGoogle.isPresent()) {
            return refreshProfile(byGoogle.get(), name, avatarUrl);
        }

        // 2) Existing email/password account with the same (Google-verified) email:
        //    link the Google identity to it instead of creating a duplicate.
        Optional<User> byEmail = userRepository.findByEmail(email);
        if (byEmail.isPresent()) {
            User user = byEmail.get();
            user.setGoogleId(googleId);
            return refreshProfile(user, name, avatarUrl);
        }

        // 3) Brand-new user.
        User user = newUserWithInbox(email, name, avatarUrl);
        user.setGoogleId(googleId);
        return user;
    }

    public boolean emailExists(String email) {
        return userRepository.findByEmail(email).isPresent();
    }

    /** Registers an email/password user (caller must check {@link #emailExists} first). */
    @Transactional
    public User registerWithPassword(String email, String name, String rawPassword) {
        User user = newUserWithInbox(email, name, null);
        user.setPasswordHash(passwordEncoder.encode(rawPassword));
        return user;
    }

    /** Returns the user if the email/password match, else empty. */
    @Transactional(readOnly = true)
    public Optional<User> authenticate(String email, String rawPassword) {
        return userRepository.findByEmail(email)
                .filter(u -> u.getPasswordHash() != null)
                .filter(u -> passwordEncoder.matches(rawPassword, u.getPasswordHash()));
    }

    public User findById(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + id));
    }

    private User refreshProfile(User user, String name, String avatarUrl) {
        user.setName(name);
        user.setAvatarUrl(avatarUrl);
        return user; // managed entity; flushed on tx commit
    }

    /** Creates+saves a user and their personal Inbox (Project + OWNER membership). */
    private User newUserWithInbox(String email, String name, String avatarUrl) {
        User user = new User();
        user.setEmail(email);
        user.setName(name);
        user.setAvatarUrl(avatarUrl);
        user = userRepository.save(user);

        // Every user gets exactly one Inbox: a Project with isInbox = true.
        Project inbox = new Project();
        inbox.setName("Inbox");
        inbox.setOwner(user);
        inbox.setInbox(true);
        inbox.setPosition(0);
        inbox = projectRepository.save(inbox);

        // The owner is also a member (role OWNER) — collaboration model from day one.
        ProjectMember member = new ProjectMember();
        member.setProject(inbox);
        member.setUser(user);
        member.setRole(ProjectRole.OWNER);
        projectMemberRepository.save(member);

        return user;
    }
}

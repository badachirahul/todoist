package com.todoist.attachment;

import com.todoist.attachment.dto.AttachmentDto;
import com.todoist.project.ProjectMemberRepository;
import com.todoist.realtime.RealtimeService;
import com.todoist.task.Comment;
import com.todoist.task.CommentRepository;
import com.todoist.task.Task;
import com.todoist.task.TaskRepository;
import com.todoist.user.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

/** Stores attachment bytes on the local filesystem; metadata in the DB. */
@Service
public class AttachmentService {

    private final AttachmentRepository attachmentRepository;
    private final TaskRepository taskRepository;
    private final CommentRepository commentRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final UserRepository userRepository;
    private final RealtimeService realtime;
    private final Path root;

    public AttachmentService(AttachmentRepository attachmentRepository,
                             TaskRepository taskRepository,
                             CommentRepository commentRepository,
                             ProjectMemberRepository projectMemberRepository,
                             UserRepository userRepository,
                             RealtimeService realtime,
                             @Value("${app.upload-dir:uploads}") String uploadDir) {
        this.attachmentRepository = attachmentRepository;
        this.taskRepository = taskRepository;
        this.commentRepository = commentRepository;
        this.projectMemberRepository = projectMemberRepository;
        this.userRepository = userRepository;
        this.realtime = realtime;
        this.root = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(root);
        } catch (IOException e) {
            throw new IllegalStateException("Could not create upload directory " + root, e);
        }
    }

    @Transactional
    public AttachmentDto attachToTask(UUID taskId, UUID userId, MultipartFile file) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found"));
        assertMember(task.getProject().getId(), userId);
        if (attachmentRepository.existsByTaskId(taskId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only one file can be attached per task.");
        }
        Attachment a = new Attachment();
        a.setTask(task);
        populateAndSave(a, file, userId);
        realtime.publish(task.getProject().getId());
        return AttachmentDto.from(a);
    }

    @Transactional
    public AttachmentDto attachToComment(UUID commentId, UUID userId, MultipartFile file) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found"));
        assertMember(comment.getTask().getProject().getId(), userId);
        if (attachmentRepository.existsByCommentId(commentId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only one file can be attached per comment.");
        }
        Attachment a = new Attachment();
        a.setComment(comment);
        populateAndSave(a, file, userId);
        realtime.publish(comment.getTask().getProject().getId());
        return AttachmentDto.from(a);
    }

    @Transactional
    public void delete(UUID attachmentId, UUID userId) {
        Attachment a = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Attachment not found"));
        assertMember(projectIdOf(a), userId);
        try {
            Files.deleteIfExists(root.resolve(a.getStoragePath()));
        } catch (IOException ignored) {
            // best-effort: still drop the DB row
        }
        UUID projectId = projectIdOf(a);
        attachmentRepository.delete(a);
        realtime.publish(projectId);
    }

    /** Resolve an attachment to a streamable resource (members only). */
    @Transactional(readOnly = true)
    public Download download(UUID attachmentId, UUID userId) {
        Attachment a = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Attachment not found"));
        assertMember(projectIdOf(a), userId);
        Resource resource = new FileSystemResource(root.resolve(a.getStoragePath()));
        if (!resource.exists()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "File missing");
        }
        return new Download(resource, a.getFilename(),
                a.getContentType() != null ? a.getContentType() : "application/octet-stream");
    }

    public record Download(Resource resource, String filename, String contentType) {}

    // ---- helpers ----------------------------------------------------------

    private void populateAndSave(Attachment a, MultipartFile file, UUID userId) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No file provided");
        }
        String original = file.getOriginalFilename() != null ? file.getOriginalFilename() : "file";
        String storedName = UUID.randomUUID() + "_" + original.replaceAll("[^A-Za-z0-9._-]", "_");
        try {
            Files.copy(file.getInputStream(), root.resolve(storedName));
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not store file");
        }
        a.setFilename(original);
        a.setContentType(file.getContentType());
        a.setSizeBytes(file.getSize());
        a.setStoragePath(storedName);
        a.setUploadedBy(userRepository.getReferenceById(userId));
        attachmentRepository.save(a);
    }

    private UUID projectIdOf(Attachment a) {
        if (a.getTask() != null) return a.getTask().getProject().getId();
        return a.getComment().getTask().getProject().getId();
    }

    private void assertMember(UUID projectId, UUID userId) {
        if (!projectMemberRepository.existsByProjectIdAndUserId(projectId, userId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Not found");
        }
    }
}

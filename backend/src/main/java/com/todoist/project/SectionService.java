package com.todoist.project;

import com.todoist.project.dto.SectionDto;
import com.todoist.realtime.RealtimeService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class SectionService {

    private final SectionRepository sectionRepository;
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final RealtimeService realtime;

    public SectionService(SectionRepository sectionRepository,
                          ProjectRepository projectRepository,
                          ProjectMemberRepository projectMemberRepository,
                          RealtimeService realtime) {
        this.sectionRepository = sectionRepository;
        this.projectRepository = projectRepository;
        this.projectMemberRepository = projectMemberRepository;
        this.realtime = realtime;
    }

    @Transactional(readOnly = true)
    public List<SectionDto> list(UUID projectId, UUID userId) {
        assertMember(projectId, userId);
        return sectionRepository.findByProjectIdOrderByPosition(projectId).stream()
                .map(SectionDto::from).toList();
    }

    @Transactional
    public SectionDto create(UUID projectId, UUID userId, String name) {
        assertMember(projectId, userId);
        Section section = new Section();
        section.setProject(projectRepository.getReferenceById(projectId));
        section.setName(name);
        section.setPosition(sectionRepository.findByProjectIdOrderByPosition(projectId).size());
        SectionDto dto = SectionDto.from(sectionRepository.save(section));
        realtime.publish(projectId);
        return dto;
    }

    @Transactional
    public SectionDto rename(UUID sectionId, UUID userId, String name) {
        Section section = loadOwned(sectionId, userId);
        section.setName(name);
        realtime.publish(section.getProject().getId());
        return SectionDto.from(section);
    }

    @Transactional
    public void delete(UUID sectionId, UUID userId) {
        // Deleting a section deletes its tasks too (section_id ON DELETE CASCADE, V3).
        Section section = loadOwned(sectionId, userId);
        UUID projectId = section.getProject().getId();
        sectionRepository.delete(section);
        realtime.publish(projectId);
    }

    private Section loadOwned(UUID sectionId, UUID userId) {
        Section section = sectionRepository.findById(sectionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Section not found"));
        assertMember(section.getProject().getId(), userId);
        return section;
    }

    private void assertMember(UUID projectId, UUID userId) {
        if (!projectMemberRepository.existsByProjectIdAndUserId(projectId, userId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found");
        }
    }
}

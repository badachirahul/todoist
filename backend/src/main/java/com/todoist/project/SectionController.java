package com.todoist.project;

import com.todoist.project.dto.SectionDto;
import com.todoist.project.dto.SectionNameRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
public class SectionController {

    private final SectionService sectionService;

    public SectionController(SectionService sectionService) {
        this.sectionService = sectionService;
    }

    @GetMapping("/api/projects/{projectId}/sections")
    public List<SectionDto> list(@PathVariable UUID projectId, @AuthenticationPrincipal UUID userId) {
        return sectionService.list(projectId, userId);
    }

    @PostMapping("/api/projects/{projectId}/sections")
    @ResponseStatus(HttpStatus.CREATED)
    public SectionDto create(@PathVariable UUID projectId,
                             @AuthenticationPrincipal UUID userId,
                             @Valid @RequestBody SectionNameRequest req) {
        return sectionService.create(projectId, userId, req.name());
    }

    @PatchMapping("/api/sections/{sectionId}")
    public SectionDto rename(@PathVariable UUID sectionId,
                             @AuthenticationPrincipal UUID userId,
                             @Valid @RequestBody SectionNameRequest req) {
        return sectionService.rename(sectionId, userId, req.name());
    }

    @DeleteMapping("/api/sections/{sectionId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID sectionId, @AuthenticationPrincipal UUID userId) {
        sectionService.delete(sectionId, userId);
    }
}

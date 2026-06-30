package com.todoist.controller;

import com.todoist.dto.SectionDto;
import com.todoist.dto.SectionNameRequest;
import com.todoist.service.SectionService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
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

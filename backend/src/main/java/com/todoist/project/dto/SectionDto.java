package com.todoist.project.dto;

import com.todoist.project.Section;

import java.util.UUID;

public record SectionDto(UUID id, UUID projectId, String name, int position) {
    public static SectionDto from(Section s) {
        return new SectionDto(s.getId(), s.getProject().getId(), s.getName(), s.getPosition());
    }
}

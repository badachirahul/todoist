package com.todoist.dto;

import com.todoist.entity.Label;
import java.util.UUID;

public record LabelDto(UUID id, String name, String color) {
    public static LabelDto from(Label l) {
        return new LabelDto(l.getId(), l.getName(), l.getColor());
    }
}

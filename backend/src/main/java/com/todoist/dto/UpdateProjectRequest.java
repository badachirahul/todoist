package com.todoist.dto;

/** Partial update (PATCH): null fields are left unchanged. */
public record UpdateProjectRequest(
        String name,
        String color,
        Boolean favorite,
        Boolean archived
) {
}

package com.todoist.project.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/** Invite a user to a project by their email address. */
public record AddMemberRequest(
        @NotBlank @Email String email
) {
}

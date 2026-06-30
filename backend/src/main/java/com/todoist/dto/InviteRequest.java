package com.todoist.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/** Invite a person to a project by email (may not be a registered user yet). */
public record InviteRequest(
        @NotBlank @Email String email
) {
}

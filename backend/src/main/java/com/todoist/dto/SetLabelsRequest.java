package com.todoist.dto;

import java.util.List;
import java.util.UUID;

public record SetLabelsRequest(List<UUID> labelIds) {
}

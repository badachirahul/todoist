package com.todoist.task.dto;

import java.util.List;
import java.util.UUID;

public record SetLabelsRequest(List<UUID> labelIds) {
}

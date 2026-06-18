package com.todoist.label;

import com.todoist.label.dto.LabelDto;
import com.todoist.label.dto.LabelRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/labels")
public class LabelController {

    private final LabelService labelService;

    public LabelController(LabelService labelService) {
        this.labelService = labelService;
    }

    @GetMapping
    public List<LabelDto> list(@AuthenticationPrincipal UUID userId) {
        return labelService.list(userId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public LabelDto create(@AuthenticationPrincipal UUID userId, @Valid @RequestBody LabelRequest req) {
        return labelService.create(userId, req.name(), req.color());
    }

    @PatchMapping("/{labelId}")
    public LabelDto update(@PathVariable UUID labelId,
                           @AuthenticationPrincipal UUID userId,
                           @RequestBody LabelRequest req) {
        return labelService.update(labelId, userId, req.name(), req.color());
    }

    @DeleteMapping("/{labelId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID labelId, @AuthenticationPrincipal UUID userId) {
        labelService.delete(labelId, userId);
    }
}

package com.todoist.label;

import com.todoist.label.dto.LabelDto;
import com.todoist.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class LabelService {

    private final LabelRepository labelRepository;
    private final UserRepository userRepository;

    public LabelService(LabelRepository labelRepository, UserRepository userRepository) {
        this.labelRepository = labelRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<LabelDto> list(UUID userId) {
        return labelRepository.findByUserIdOrderByName(userId).stream().map(LabelDto::from).toList();
    }

    @Transactional
    public LabelDto create(UUID userId, String name, String color) {
        if (labelRepository.existsByUserIdAndName(userId, name)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Label already exists");
        }
        Label label = new Label();
        label.setUser(userRepository.getReferenceById(userId));
        label.setName(name);
        label.setColor(color);
        return LabelDto.from(labelRepository.save(label));
    }

    @Transactional
    public LabelDto update(UUID labelId, UUID userId, String name, String color) {
        Label label = loadOwned(labelId, userId);
        if (name != null) label.setName(name);
        if (color != null) label.setColor(color);
        return LabelDto.from(label);
    }

    @Transactional
    public void delete(UUID labelId, UUID userId) {
        labelRepository.delete(loadOwned(labelId, userId));
    }

    private Label loadOwned(UUID labelId, UUID userId) {
        Label label = labelRepository.findById(labelId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Label not found"));
        if (!label.getUser().getId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Label not found");
        }
        return label;
    }
}

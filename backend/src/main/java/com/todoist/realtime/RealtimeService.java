package com.todoist.realtime;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Tiny in-memory pub/sub for Server-Sent Events, keyed by project. Each open
 * project view holds one {@link SseEmitter}; any mutation in that project calls
 * {@link #publish} so every collaborator's client refetches the affected data.
 * No polling, no external broker — fine for a single-instance dev/MVP backend.
 */
@Service
public class RealtimeService {

    private static final Logger log = LoggerFactory.getLogger(RealtimeService.class);
    private static final long TIMEOUT_MS = 30 * 60 * 1000L; // 30 min

    private final Map<UUID, List<SseEmitter>> emitters = new ConcurrentHashMap<>();
    // Per-user streams (one per open tab) for personal notifications.
    private final Map<UUID, List<SseEmitter>> userEmitters = new ConcurrentHashMap<>();

    /** Register a new subscriber for a project's change stream. */
    public SseEmitter subscribe(UUID projectId) {
        return register(emitters, projectId);
    }

    /** Register a new subscriber for a user's personal notification stream. */
    public SseEmitter subscribeUser(UUID userId) {
        return register(userEmitters, userId);
    }

    private SseEmitter register(Map<UUID, List<SseEmitter>> registry, UUID key) {
        SseEmitter emitter = new SseEmitter(TIMEOUT_MS);
        registry.computeIfAbsent(key, k -> new CopyOnWriteArrayList<>()).add(emitter);

        Runnable remove = () -> {
            List<SseEmitter> list = registry.get(key);
            if (list != null) list.remove(emitter);
        };
        emitter.onCompletion(remove);
        emitter.onTimeout(remove);
        emitter.onError(e -> remove.run());

        try {
            emitter.send(SseEmitter.event().name("connected").data("ok"));
        } catch (IOException e) {
            remove.run();
        }
        return emitter;
    }

    /**
     * Notify every subscriber that the project changed. If called inside a
     * transaction, defer until after commit so clients refetch fresh data.
     */
    public void publish(UUID projectId) {
        afterCommit(() -> doPublish(emitters, projectId, "change"));
    }

    /**
     * Notify a single user that they have a new/changed notification. Pushed to
     * every tab that user has open (sidebar badge + Notifications page refetch).
     */
    public void publishUser(UUID userId) {
        afterCommit(() -> doPublish(userEmitters, userId, "notification"));
    }

    /** Run now, or defer until after the current transaction commits. */
    private void afterCommit(Runnable action) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override public void afterCommit() { action.run(); }
            });
        } else {
            action.run();
        }
    }

    private void doPublish(Map<UUID, List<SseEmitter>> registry, UUID key, String event) {
        List<SseEmitter> list = registry.get(key);
        if (list == null || list.isEmpty()) return;
        for (SseEmitter emitter : list) {
            try {
                emitter.send(SseEmitter.event().name(event).data("1"));
            } catch (Exception e) {
                list.remove(emitter);
                log.debug("Dropped dead SSE emitter for key {}", key);
            }
        }
    }
}

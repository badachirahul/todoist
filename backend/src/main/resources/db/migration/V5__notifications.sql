-- Personal notifications (Phase 7 collaboration): one row per recipient per event.
-- Actor/subject are stored as snapshots so a notification survives the source
-- project/task/comment being deleted. `body` holds optional secondary text
-- (e.g. the comment that was added).
CREATE TABLE notifications (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    type         VARCHAR     NOT NULL,  -- ADDED_TO_PROJECT | REMOVED_FROM_PROJECT | JOINED_PROJECT | LEFT_PROJECT | COMMENT_ADDED
    actor_name   VARCHAR,
    subject_name VARCHAR,
    body         VARCHAR,
    is_read      BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_recipient ON notifications (recipient_id, created_at DESC);

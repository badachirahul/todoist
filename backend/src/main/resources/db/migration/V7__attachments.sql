-- File attachments. Each row belongs to EITHER a task or a comment (never both).
-- Files live on the local filesystem; this table holds the metadata + path.
CREATE TABLE attachments (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id       UUID        REFERENCES tasks (id)    ON DELETE CASCADE,
    comment_id    UUID        REFERENCES comments (id) ON DELETE CASCADE,
    filename      VARCHAR     NOT NULL,
    content_type  VARCHAR,
    size_bytes    BIGINT      NOT NULL,
    storage_path  VARCHAR     NOT NULL,
    uploaded_by   UUID        REFERENCES users (id),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Exactly one owner.
    CONSTRAINT attachment_one_owner CHECK ((task_id IS NOT NULL) <> (comment_id IS NOT NULL))
);

-- One attachment per task (Todoist rule); one per comment too.
CREATE UNIQUE INDEX uq_attachment_task ON attachments (task_id) WHERE task_id IS NOT NULL;
CREATE UNIQUE INDEX uq_attachment_comment ON attachments (comment_id) WHERE comment_id IS NOT NULL;

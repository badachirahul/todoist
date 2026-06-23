-- Pending project invitations (Phase 7 collaboration: invite by email).
-- A row is created when someone is invited; on accept it becomes ACCEPTED and
-- a project_members row is added. Invitee need not be a registered user yet.
CREATE TABLE project_invitations (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id  UUID        NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
    email       VARCHAR     NOT NULL,
    token       VARCHAR     NOT NULL UNIQUE,
    invited_by  UUID        NOT NULL REFERENCES users (id),
    status      VARCHAR     NOT NULL DEFAULT 'PENDING',  -- PENDING | ACCEPTED
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (project_id, email)
);
CREATE INDEX idx_project_invitations_project ON project_invitations (project_id);

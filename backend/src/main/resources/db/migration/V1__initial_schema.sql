-- Todoist clone — initial schema (Phase 1).
-- Collaboration-ready: tasks belong to projects, projects have members.
-- UUID primary keys (opaque, non-enumerable) via built-in gen_random_uuid() (PG13+).

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------
CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       VARCHAR     NOT NULL UNIQUE,
    name        VARCHAR     NOT NULL,
    avatar_url  VARCHAR,
    google_id   VARCHAR     NOT NULL UNIQUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- projects (Inbox = a project with is_inbox = true)
-- ---------------------------------------------------------------------------
CREATE TABLE projects (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name              VARCHAR     NOT NULL,
    color             VARCHAR,
    owner_id          UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    parent_project_id UUID        REFERENCES projects (id) ON DELETE CASCADE,
    position          INTEGER     NOT NULL DEFAULT 0,
    is_inbox          BOOLEAN     NOT NULL DEFAULT false,
    is_favorite       BOOLEAN     NOT NULL DEFAULT false,
    is_archived       BOOLEAN     NOT NULL DEFAULT false,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_projects_owner ON projects (owner_id);
CREATE INDEX idx_projects_parent ON projects (parent_project_id);

-- ---------------------------------------------------------------------------
-- project_members (join table enabling collaboration + authorization)
-- ---------------------------------------------------------------------------
CREATE TABLE project_members (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID    NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
    user_id    UUID    NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    role       VARCHAR NOT NULL,  -- OWNER | MEMBER
    UNIQUE (project_id, user_id)
);
CREATE INDEX idx_project_members_user ON project_members (user_id);

-- ---------------------------------------------------------------------------
-- sections (named groupings of tasks within a project)
-- ---------------------------------------------------------------------------
CREATE TABLE sections (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID    NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
    name       VARCHAR NOT NULL,
    position   INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_sections_project ON sections (project_id);

-- ---------------------------------------------------------------------------
-- tasks (self-referencing parent_task_id = sub-tasks)
-- ---------------------------------------------------------------------------
CREATE TABLE tasks (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id     UUID        NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
    section_id     UUID        REFERENCES sections (id) ON DELETE SET NULL,
    parent_task_id UUID        REFERENCES tasks (id) ON DELETE CASCADE,
    content        VARCHAR     NOT NULL,
    description    VARCHAR,
    priority       INTEGER     NOT NULL DEFAULT 4 CHECK (priority BETWEEN 1 AND 4),
    due_date       DATE,
    due_time       TIME,
    is_completed   BOOLEAN     NOT NULL DEFAULT false,
    completed_at   TIMESTAMPTZ,
    position       INTEGER     NOT NULL DEFAULT 0,
    assignee_id    UUID        REFERENCES users (id) ON DELETE SET NULL,
    created_by_id  UUID        NOT NULL REFERENCES users (id),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_tasks_project ON tasks (project_id);
CREATE INDEX idx_tasks_section ON tasks (section_id);
CREATE INDEX idx_tasks_parent ON tasks (parent_task_id);
CREATE INDEX idx_tasks_assignee ON tasks (assignee_id);

-- ---------------------------------------------------------------------------
-- labels (per-user, span all projects, written with @)
-- ---------------------------------------------------------------------------
CREATE TABLE labels (
    id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID    NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    name    VARCHAR NOT NULL,
    color   VARCHAR,
    UNIQUE (user_id, name)
);
CREATE INDEX idx_labels_user ON labels (user_id);

-- ---------------------------------------------------------------------------
-- task_labels (many-to-many join: a task has many labels)
-- ---------------------------------------------------------------------------
CREATE TABLE task_labels (
    task_id  UUID NOT NULL REFERENCES tasks (id) ON DELETE CASCADE,
    label_id UUID NOT NULL REFERENCES labels (id) ON DELETE CASCADE,
    PRIMARY KEY (task_id, label_id)
);

-- ---------------------------------------------------------------------------
-- comments (discussion on a task — collaboration)
-- ---------------------------------------------------------------------------
CREATE TABLE comments (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id    UUID        NOT NULL REFERENCES tasks (id) ON DELETE CASCADE,
    user_id    UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    content    VARCHAR     NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_comments_task ON comments (task_id);

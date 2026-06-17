-- Deleting a section should delete its tasks too (matches Todoist).
-- Was ON DELETE SET NULL (tasks survived, became section-less) — now CASCADE.

ALTER TABLE tasks DROP CONSTRAINT tasks_section_id_fkey;

ALTER TABLE tasks
    ADD CONSTRAINT tasks_section_id_fkey
        FOREIGN KEY (section_id) REFERENCES sections (id) ON DELETE CASCADE;

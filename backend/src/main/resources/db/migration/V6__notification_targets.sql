-- Give notifications a navigation target + invitation handle, so a row can deep
-- link to its project/task and the project-invite row can carry an Accept action.
ALTER TABLE notifications
    ADD COLUMN project_id       UUID,
    ADD COLUMN task_id          UUID,
    ADD COLUMN invitation_token VARCHAR;

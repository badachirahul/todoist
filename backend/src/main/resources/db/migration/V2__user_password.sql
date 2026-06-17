-- Add email/password auth alongside Google.
-- Email/password users have no Google id, so google_id becomes nullable.

ALTER TABLE users
    ADD COLUMN password_hash VARCHAR;

ALTER TABLE users
    ALTER COLUMN google_id DROP NOT NULL;

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS auth_subject VARCHAR(100);

CREATE UNIQUE INDEX IF NOT EXISTS uq_users_auth_subject
    ON users (auth_subject)
    WHERE auth_subject IS NOT NULL;

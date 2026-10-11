ALTER TABLE users
    DROP CONSTRAINT IF EXISTS ck_users_account_type;

ALTER TABLE users
    ADD CONSTRAINT ck_users_account_type
        CHECK (account_type IN ('ADMIN', 'PERSONAL_TRAINER', 'INDIVIDUAL'));

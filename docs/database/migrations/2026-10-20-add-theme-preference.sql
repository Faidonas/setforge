ALTER TABLE users
    ADD COLUMN IF NOT EXISTS theme_preference VARCHAR(10) NOT NULL DEFAULT 'DARK';

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_users_theme_preference') THEN
        ALTER TABLE users ADD CONSTRAINT ck_users_theme_preference
            CHECK (theme_preference IN ('DARK', 'LIGHT'));
    END IF;
END $$;

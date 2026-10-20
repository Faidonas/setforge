DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'users'
          AND column_name = 'onboarding_completed'
    ) THEN
        ALTER TABLE users ADD COLUMN onboarding_completed BOOLEAN;
        UPDATE users SET onboarding_completed = TRUE;
        ALTER TABLE users ALTER COLUMN onboarding_completed SET DEFAULT FALSE;
        ALTER TABLE users ALTER COLUMN onboarding_completed SET NOT NULL;
    END IF;

END $$;
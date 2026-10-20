ALTER TABLE users
    ADD COLUMN IF NOT EXISTS unit_system VARCHAR(20) NOT NULL DEFAULT 'METRIC',
    ADD COLUMN IF NOT EXISTS primary_objective VARCHAR(30) NOT NULL DEFAULT 'STRENGTH',
    ADD COLUMN IF NOT EXISTS lifting_experience VARCHAR(20) NOT NULL DEFAULT 'INTERMEDIATE';

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_users_unit_system') THEN
        ALTER TABLE users ADD CONSTRAINT ck_users_unit_system
            CHECK (unit_system IN ('METRIC', 'IMPERIAL'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_users_primary_objective') THEN
        ALTER TABLE users ADD CONSTRAINT ck_users_primary_objective
            CHECK (primary_objective IN ('STRENGTH', 'HYPERTROPHY', 'GENERAL_FITNESS'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_users_lifting_experience') THEN
        ALTER TABLE users ADD CONSTRAINT ck_users_lifting_experience
            CHECK (lifting_experience IN ('BEGINNER', 'INTERMEDIATE', 'ADVANCED'));
    END IF;
END $$;

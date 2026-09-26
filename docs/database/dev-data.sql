-- Development-only sample data for SetForge.
-- Run schema.sql first, then run this file in the setforge_db database.

BEGIN;

-- Development users
INSERT INTO users (email, display_name, account_type)
VALUES
    ('alex.trainer@setforge.dev', 'Alex Trainer', 'PERSONAL_TRAINER'),
    ('maria@setforge.dev', 'Maria Individual', 'INDIVIDUAL'),
    ('nikos@setforge.dev', 'Nikos Individual', 'INDIVIDUAL')
ON CONFLICT (email) DO UPDATE
SET display_name = EXCLUDED.display_name,
    account_type = EXCLUDED.account_type,
    updated_at = CURRENT_TIMESTAMP;

-- Alex trains both Maria and Nikos
INSERT INTO coaching_relationships (
    trainer_id,
    client_id,
    status,
    started_at
)
SELECT
    trainer.id,
    client.id,
    'ACTIVE',
    CURRENT_TIMESTAMP
FROM users trainer
CROSS JOIN users client
WHERE trainer.email = 'alex.trainer@setforge.dev'
  AND client.email IN (
      'maria@setforge.dev',
      'nikos@setforge.dev'
  )
  AND NOT EXISTS (
      SELECT 1
      FROM coaching_relationships relationship
      WHERE relationship.trainer_id = trainer.id
        AND relationship.client_id = client.id
        AND relationship.status IN ('PENDING', 'ACTIVE')
  );

-- Exercises used by the development template
INSERT INTO exercises (
    name,
    primary_muscle,
    equipment,
    instructions
)
SELECT
    'Bench Press',
    'Chest',
    'Barbell',
    'Lower the bar under control and press it upward.'
WHERE NOT EXISTS (
    SELECT 1
    FROM exercises
    WHERE name = 'Bench Press'
);

INSERT INTO exercises (
    name,
    primary_muscle,
    equipment,
    instructions
)
SELECT
    'Back Squat',
    'Quadriceps',
    'Barbell',
    'Brace your torso, squat to a comfortable depth, and stand up.'
WHERE NOT EXISTS (
    SELECT 1
    FROM exercises
    WHERE name = 'Back Squat'
);

INSERT INTO exercises (
    name,
    primary_muscle,
    equipment,
    instructions
)
SELECT
    'Lat Pulldown',
    'Back',
    'Cable',
    'Pull the bar toward your upper chest while keeping your torso stable.'
WHERE NOT EXISTS (
    SELECT 1
    FROM exercises
    WHERE name = 'Lat Pulldown'
);

-- Template owned by the personal trainer
INSERT INTO workout_templates (
    owner_id,
    name,
    description
)
SELECT
    trainer.id,
    'Beginner Full Body',
    'Simple full-body workout for new clients.'
FROM users trainer
WHERE trainer.email = 'alex.trainer@setforge.dev'
  AND NOT EXISTS (
      SELECT 1
      FROM workout_templates template
      WHERE template.owner_id = trainer.id
        AND template.name = 'Beginner Full Body'
  );

-- Exercises in their display order within the template
INSERT INTO workout_template_exercises (
    workout_template_id,
    exercise_id,
    position,
    notes
)
SELECT
    template.id,
    exercise.id,
    exercise_data.position,
    exercise_data.notes
FROM workout_templates template
JOIN users trainer
    ON trainer.id = template.owner_id
JOIN (
    VALUES
        ('Back Squat', 0, 'Warm up carefully before the working sets.'),
        ('Bench Press', 1, 'Keep the shoulder blades retracted.'),
        ('Lat Pulldown', 2, 'Avoid using momentum.')
) AS exercise_data(exercise_name, position, notes)
    ON TRUE
JOIN exercises exercise
    ON exercise.name = exercise_data.exercise_name
WHERE trainer.email = 'alex.trainer@setforge.dev'
  AND template.name = 'Beginner Full Body'
  AND NOT EXISTS (
      SELECT 1
      FROM workout_template_exercises template_exercise
      WHERE template_exercise.workout_template_id = template.id
        AND template_exercise.position = exercise_data.position
  );

-- Three planned sets for every exercise in the template
INSERT INTO workout_template_sets (
    template_exercise_id,
    position,
    set_type,
    target_reps,
    target_weight
)
SELECT
    template_exercise.id,
    set_data.position,
    set_data.set_type,
    set_data.target_reps,
    set_data.target_weight
FROM workout_template_exercises template_exercise
JOIN workout_templates template
    ON template.id = template_exercise.workout_template_id
JOIN users trainer
    ON trainer.id = template.owner_id
CROSS JOIN (
    VALUES
        (0, 'WARM_UP', 10, 20.00::NUMERIC),
        (1, 'NORMAL', 8, 40.00::NUMERIC),
        (2, 'NORMAL', 8, 40.00::NUMERIC)
) AS set_data(position, set_type, target_reps, target_weight)
WHERE trainer.email = 'alex.trainer@setforge.dev'
  AND template.name = 'Beginner Full Body'
  AND NOT EXISTS (
      SELECT 1
      FROM workout_template_sets template_set
      WHERE template_set.template_exercise_id = template_exercise.id
        AND template_set.position = set_data.position
  );

-- One completed workout created from the development template
INSERT INTO workout_sessions (
    user_id,
    source_template_id,
    name,
    notes,
    status,
    started_at,
    completed_at
)
SELECT
    trainee.id,
    template.id,
    'Beginner Full Body - Sample Session',
    'Development workout used to test session history.',
    'COMPLETED',
    '2026-09-14 18:00:00+03'::TIMESTAMPTZ,
    '2026-09-14 19:00:00+03'::TIMESTAMPTZ
FROM users trainee
CROSS JOIN workout_templates template
JOIN users trainer
    ON trainer.id = template.owner_id
WHERE trainee.email = 'maria@setforge.dev'
  AND trainer.email = 'alex.trainer@setforge.dev'
  AND template.name = 'Beginner Full Body'
  AND NOT EXISTS (
      SELECT 1
      FROM workout_sessions session
      WHERE session.user_id = trainee.id
        AND session.name = 'Beginner Full Body - Sample Session'
        AND session.started_at = '2026-09-14 18:00:00+03'::TIMESTAMPTZ
  );

-- Copy the template exercises into the completed workout
INSERT INTO workout_session_exercises (
    workout_session_id,
    exercise_id,
    source_template_exercise_id,
    position,
    notes
)
SELECT
    session.id,
    template_exercise.exercise_id,
    template_exercise.id,
    template_exercise.position,
    template_exercise.notes
FROM workout_sessions session
JOIN users trainee
    ON trainee.id = session.user_id
JOIN workout_template_exercises template_exercise
    ON template_exercise.workout_template_id = session.source_template_id
WHERE trainee.email = 'maria@setforge.dev'
  AND session.name = 'Beginner Full Body - Sample Session'
  AND session.started_at = '2026-09-14 18:00:00+03'::TIMESTAMPTZ
  AND NOT EXISTS (
      SELECT 1
      FROM workout_session_exercises session_exercise
      WHERE session_exercise.workout_session_id = session.id
        AND session_exercise.position = template_exercise.position
  );

-- Copy planned targets and record Maria's actual completed sets
INSERT INTO workout_sets (
    session_exercise_id,
    source_template_set_id,
    position,
    set_type,
    target_reps,
    target_weight,
    target_duration_seconds,
    reps,
    weight,
    duration_seconds,
    completed,
    completed_at
)
SELECT
    session_exercise.id,
    template_set.id,
    template_set.position,
    template_set.set_type,
    template_set.target_reps,
    template_set.target_weight,
    template_set.target_duration_seconds,
    template_set.target_reps,
    template_set.target_weight,
    template_set.target_duration_seconds,
    TRUE,
    '2026-09-14 19:00:00+03'::TIMESTAMPTZ
FROM workout_session_exercises session_exercise
JOIN workout_sessions session
    ON session.id = session_exercise.workout_session_id
JOIN users trainee
    ON trainee.id = session.user_id
JOIN workout_template_sets template_set
    ON template_set.template_exercise_id = session_exercise.source_template_exercise_id
WHERE trainee.email = 'maria@setforge.dev'
  AND session.name = 'Beginner Full Body - Sample Session'
  AND session.started_at = '2026-09-14 18:00:00+03'::TIMESTAMPTZ
  AND NOT EXISTS (
      SELECT 1
      FROM workout_sets workout_set
      WHERE workout_set.session_exercise_id = session_exercise.id
        AND workout_set.position = template_set.position
  );

COMMIT;

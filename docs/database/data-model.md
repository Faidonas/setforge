# SetForge Data Model

This document describes the current SetForge database model, the purpose of each entity, and the
rules that connect them. Update it whenever an entity, relationship, or database constraint
changes.

The executable database files are:

- [`schema.sql`](./schema.sql) creates the tables, constraints, and indexes.
- [`dev-data.sql`](./dev-data.sql) inserts local development data and must never be used as
  production user data.

## Current relationship diagram

```mermaid
erDiagram
    USERS ||--o{ COACHING_RELATIONSHIPS : "acts as trainer"
    USERS ||--o{ COACHING_RELATIONSHIPS : "acts as client"
    USERS ||--o{ WORKOUT_TEMPLATES : owns
    WORKOUT_TEMPLATES ||--o{ WORKOUT_TEMPLATE_EXERCISES : contains
    EXERCISES ||--o{ WORKOUT_TEMPLATE_EXERCISES : references
    WORKOUT_TEMPLATE_EXERCISES ||--o{ WORKOUT_TEMPLATE_SETS : plans
    USERS ||--o{ WORKOUT_SESSIONS : performs
    WORKOUT_TEMPLATES o|--o{ WORKOUT_SESSIONS : "source for"
    WORKOUT_SESSIONS ||--o{ WORKOUT_SESSION_EXERCISES : records
    EXERCISES ||--o{ WORKOUT_SESSION_EXERCISES : performed_as
    WORKOUT_TEMPLATE_EXERCISES o|--o{ WORKOUT_SESSION_EXERCISES : "source for"
    WORKOUT_SESSION_EXERCISES ||--o{ WORKOUT_SETS : contains
    WORKOUT_TEMPLATE_SETS o|--o{ WORKOUT_SETS : "source for"

    USERS {
        bigint id PK
        varchar email UK
        varchar display_name
        varchar account_type
        timestamptz created_at
        timestamptz updated_at
    }

    COACHING_RELATIONSHIPS {
        bigint id PK
        bigint trainer_id FK
        bigint client_id FK
        varchar status
        timestamptz started_at
        timestamptz ended_at
        timestamptz created_at
    }

    EXERCISES {
        bigint id PK
        varchar name
        varchar primary_muscle
        varchar equipment
        text instructions
    }

    WORKOUT_TEMPLATES {
        bigint id PK
        bigint owner_id FK
        varchar name
        text description
        timestamptz created_at
        timestamptz updated_at
    }

    WORKOUT_TEMPLATE_EXERCISES {
        bigint id PK
        bigint workout_template_id FK
        bigint exercise_id FK
        integer position
        text notes
    }

    WORKOUT_TEMPLATE_SETS {
        bigint id PK
        bigint template_exercise_id FK
        integer position
        varchar set_type
        integer target_reps
        numeric target_weight
        integer target_duration_seconds
    }

    WORKOUT_SESSIONS {
        bigint id PK
        bigint user_id FK
        bigint source_template_id FK
        varchar name
        text notes
        varchar status
        timestamptz started_at
        timestamptz completed_at
        timestamptz created_at
        timestamptz updated_at
    }

    WORKOUT_SESSION_EXERCISES {
        bigint id PK
        bigint workout_session_id FK
        bigint exercise_id FK
        bigint source_template_exercise_id FK
        integer position
        text notes
    }

    WORKOUT_SETS {
        bigint id PK
        bigint session_exercise_id FK
        bigint source_template_set_id FK
        integer position
        varchar set_type
        integer target_reps
        numeric target_weight
        integer target_duration_seconds
        integer reps
        numeric weight
        integer duration_seconds
        numeric distance_meters
        boolean completed
        timestamptz completed_at
    }
```

## Entity catalogue

### User

Database table: `users`

A user is an account that can use SetForge. Both account types use the same table so shared
features, such as owning a workout template or logging a workout, do not require duplicate models.

`account_type` currently supports:

- `PERSONAL_TRAINER`
- `INDIVIDUAL`

The email address uniquely identifies an account. Authentication fields are intentionally absent
until the authentication design is implemented.

Relationships:

- A user can be the trainer in many coaching relationships.
- A user can be the client in many coaching relationships.
- A user can own many workout templates, regardless of account type.
- A user can record many workout sessions, regardless of account type.

### CoachingRelationship

Database table: `coaching_relationships`

A coaching relationship connects one personal trainer to one individual. It is a separate entity
instead of a `trainer_id` column on `users` so an individual can have multiple trainers and the
application can preserve ended relationships.

`status` supports:

- `PENDING`: the relationship has been requested but is not active yet.
- `ACTIVE`: the trainer currently coaches the client.
- `ENDED`: the relationship is historical.

Rules:

- `trainer_id` and `client_id` must reference different users.
- The same trainer-client pair can have only one `PENDING` or `ACTIVE` relationship at a time.
- Different trainers can have active relationships with the same client.
- When both dates exist, `ended_at` cannot be earlier than `started_at`.
- Role validation, such as requiring the trainer to have account type `PERSONAL_TRAINER`, belongs
  in the service layer because a row-level check cannot inspect another table safely.

### Exercise

Database table: `exercises`

An exercise is a reusable movement in the exercise catalogue. It describes the movement itself,
not its placement in a routine and not a user's performance.

It contains a name, primary muscle, required equipment, and optional instructions. A single
exercise can be referenced by many workout templates.

### WorkoutTemplate

Database table: `workout_templates`

A workout template is a reusable workout plan. It is not a completed workout. Its owner may be an
individual planning their own training or a personal trainer preparing a routine for later
assignment.

Relationships:

- `owner_id` references the user who controls the template.
- A template contains ordered `WorkoutTemplateExercise` rows.
- Completed and in-progress sessions may reference the template as their source.

### WorkoutTemplateExercise

Database table: `workout_template_exercises`

This entity places an exercise inside a workout template. A join entity is required because the
placement has its own data: display order and optional template-specific notes.

Rules:

- `position` is zero-based and must be nonnegative.
- A position can occur only once within the same template.
- The same catalogue exercise may appear more than once if it uses a different position.
- Its planned sets belong to this placement, not directly to the catalogue exercise.

### WorkoutTemplateSet

Database table: `workout_template_sets`

A template set describes a planned target. It does not contain actual workout results. Targets are
nullable so the same model can represent repetition, weight, and duration exercises.

`set_type` supports:

- `WARM_UP`
- `NORMAL`
- `DROP_SET`
- `FAILURE`

Rules:

- `position` is zero-based, nonnegative, and unique within its template exercise.
- Repetitions, weight, and duration must be nonnegative when present.
- Weight uses `NUMERIC(8, 2)` in PostgreSQL and `BigDecimal` in Java to avoid floating-point
  rounding errors.

### WorkoutSession

Database table: `workout_sessions`

A workout session is one actual workout performed by a user. Any account type can perform a
workout. A session may start from a template or may be created as an empty workout.

`status` supports:

- `IN_PROGRESS`
- `COMPLETED`
- `CANCELLED`

Rules:

- `user_id` identifies the person performing the workout.
- `source_template_id` is optional and records where the workout began.
- The session name is stored independently so later template edits do not rename workout history.
- Completed and cancelled sessions require `completed_at`; in-progress sessions do not have it.
- `completed_at` cannot be earlier than `started_at`.
- Deleting the source template sets `source_template_id` to null instead of deleting the session.

### WorkoutSessionExercise

Database table: `workout_session_exercises`

This entity records one exercise occurrence in an actual workout. It remains separate from
`WorkoutTemplateExercise` because users can reorder, add, remove, or substitute exercises while
training.

Rules:

- `position` is zero-based, nonnegative, and unique within the workout session.
- `exercise_id` identifies the catalogue movement that was performed.
- `source_template_exercise_id` is optional provenance and becomes null if that template placement
  is deleted.
- Notes are copied into the session and can then change independently from template notes.

### WorkoutSet

Database table: `workout_sets`

A workout set stores both the planned target snapshot and the actual performance for one set. This
separation preserves the target shown during the workout while allowing progress and adherence to
be calculated later.

Target fields copied from a template are `target_reps`, `target_weight`, and
`target_duration_seconds`. Actual fields are `reps`, `weight`, `duration_seconds`, and
`distance_meters`.

Rules:

- `position` is zero-based, nonnegative, and unique within the session exercise.
- `source_template_set_id` is optional and is used only as provenance.
- All target and actual numeric values must be nonnegative when present.
- A completed set requires `completed_at`; an incomplete set must not have it.
- Deleting or editing the template does not change the copied target or actual values.

## Ownership and deletion

The current foreign-key behavior is:

| Parent deleted | Result |
| --- | --- |
| User | Their coaching relationships, workout templates, and workout sessions are deleted. |
| Workout template | Its template exercises and their template sets are deleted. |
| Workout template exercise | Its template sets are deleted. |
| Workout session | Its session exercises and workout sets are deleted. |
| Workout session exercise | Its workout sets are deleted. |
| Source template used by a session | The session remains and its source link becomes null. |
| Exercise referenced by a template or session | Deletion is rejected to avoid breaking history. |

Application services should still require an explicit ownership check before modifying or deleting
records. Database cascades protect consistency; they are not an authorization system.

## Persistence conventions

- Primary keys are PostgreSQL `BIGINT` identity values and Java `Long` values.
- Enum values are stored as readable strings. Renaming a Java enum value therefore requires a
  coordinated database update.
- Timestamps use PostgreSQL `TIMESTAMPTZ` and Java `Instant`.
- Ordered child records use a zero-based `position` column rather than relying on database return
  order.
- JPA relationships are lazy and currently unidirectional. Child repositories load ordered rows
  when needed.
- API controllers return DTOs and must not expose JPA entities directly.
- Lombok relationship fields must be excluded from generated `toString` and relationship-based
  equality to avoid recursion and accidental lazy loading.

## Planned entities

This entity is likely next but is not implemented yet:

| Entity | Intended purpose |
| --- | --- |
| `WorkoutAssignment` | A trainer assigning a template to a client for a date or period. |

Actual workout entities must copy the relevant planned values instead of depending on a template
remaining unchanged. This preserves historical accuracy when a template is edited later.

## Updating the model safely

For each model change:

1. Update this document with the new purpose, relationships, and business rules.
2. Update or add the JPA entities and repositories.
3. Update `schema.sql` so a fresh database has the complete current structure.
4. Add explicit `ALTER TABLE` statements for an existing development database when required.
5. Update `dev-data.sql` only when useful sample data is needed.
6. Run structural SQL as `postgres`, then grant data access to `setforge_app`.
7. Start the backend with `ddl-auto: validate` to confirm that JPA and PostgreSQL agree.

`CREATE TABLE IF NOT EXISTS` does not modify an already existing table. Editing a `CREATE TABLE`
section in `schema.sql` is therefore sufficient for new databases but does not migrate an existing
database. Until a migration tool is introduced, existing databases must receive the corresponding
manual `ALTER TABLE` command.

CREATE TABLE workouts
(
    id           UUID PRIMARY KEY         DEFAULT gen_random_uuid(),
    athlete_id   UUID    NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,

    plan_name    VARCHAR NOT NULL,
    workout_data JSONB   NOT NULL,

    created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
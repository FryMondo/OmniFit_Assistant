CREATE TABLE exercise_logs
(
    id              UUID PRIMARY KEY         DEFAULT gen_random_uuid(),

    athlete_id      UUID    NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,

    workout_plan_id UUID    REFERENCES workouts (id) ON DELETE SET NULL,

    exercise_name   VARCHAR NOT NULL,
    weight_kg       FLOAT,
    reps            INTEGER,

    performed_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
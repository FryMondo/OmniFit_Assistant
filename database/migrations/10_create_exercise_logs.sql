CREATE TABLE exercise_logs
(
    id              UUID PRIMARY KEY         DEFAULT gen_random_uuid(),
    athlete_id      UUID    NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,

    exercise_name   VARCHAR NOT NULL,
    weight_kg       FLOAT,
    reps            INTEGER,

    performed_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
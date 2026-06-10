CREATE TYPE user_gender AS ENUM ('male', 'female');

CREATE TABLE athlete_metrics
(
    id               UUID PRIMARY KEY         DEFAULT gen_random_uuid(),
    athlete_id       UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,

    gender           user_gender,
    date_of_birth    DATE,
    weight_kg        FLOAT,
    height_cm        FLOAT,
    experience_level VARCHAR,
    injuries         VARCHAR[],
    goal             VARCHAR,
    target_calories  FLOAT,
    target_protein   FLOAT,
    target_fat       FLOAT,
    target_carbs     FLOAT,

    updated_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
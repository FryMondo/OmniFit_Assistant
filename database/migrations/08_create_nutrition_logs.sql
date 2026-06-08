CREATE TYPE user_meal_type AS ENUM ('breakfast', 'lunch', 'dinner', 'snack');

CREATE TABLE nutrition_logs
(
    id             UUID PRIMARY KEY         DEFAULT gen_random_uuid(),
    athlete_id     UUID  NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
    meal_data      JSONB NOT NULL,
    total_calories FLOAT NOT NULL,

    logged_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
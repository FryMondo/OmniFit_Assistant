CREATE TABLE custom_meals
(
    id             UUID PRIMARY KEY         DEFAULT gen_random_uuid(),
    athlete_id     UUID    NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,

    name           VARCHAR NOT NULL,
    ingredients    JSONB   NOT NULL,

    total_calories FLOAT   NOT NULL,
    total_protein  FLOAT   NOT NULL,
    total_fat      FLOAT   NOT NULL,
    total_carbs    FLOAT   NOT NULL,

    created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
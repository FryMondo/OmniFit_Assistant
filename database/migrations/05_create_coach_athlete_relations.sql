CREATE TYPE relation_status AS ENUM ('pending', 'active', 'rejected');

CREATE TABLE coach_athlete_relations
(
    id         UUID PRIMARY KEY         DEFAULT gen_random_uuid(),
    coach_id   UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
    athlete_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
    status     relation_status          DEFAULT 'pending'
        CHECK (status IN ('pending', 'active', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (coach_id, athlete_id)
);
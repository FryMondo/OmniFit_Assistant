CREATE TYPE gym_user_type AS ENUM ('staff', 'client');

CREATE TABLE gym_memberships
(
    id        UUID PRIMARY KEY         DEFAULT gen_random_uuid(),
    gym_id    UUID          NOT NULL REFERENCES gyms (id) ON DELETE CASCADE,
    user_id   UUID          NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
    user_type gym_user_type NOT NULL,
    status    VARCHAR                  DEFAULT 'pending'
        CHECK (status IN ('pending', 'active', 'rejected')),
    joined_at
              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (gym_id, user_id)
);
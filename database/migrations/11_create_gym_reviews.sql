CREATE TABLE gym_reviews
(
    id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id  UUID     NOT NULL REFERENCES gyms (id) ON DELETE CASCADE,
    user_id UUID     NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
    score   SMALLINT NOT NULL CHECK (score >= 1 AND score <= 5),

    CONSTRAINT unique_gym_user_review UNIQUE (gym_id, user_id)
);
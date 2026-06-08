CREATE TABLE gyms
(
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    manager_id  UUID    NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
    name        VARCHAR NOT NULL,
    address     VARCHAR,
    description TEXT,
    total_score INT              DEFAULT 0,
    total_votes INT              DEFAULT 0,
    schedule    JSONB            DEFAULT '{}'::jsonb;

created_at
TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE TABLE gym_equipment
(
    id             UUID PRIMARY KEY         DEFAULT gen_random_uuid(),
    gym_id         UUID    NOT NULL REFERENCES gyms (id) ON DELETE CASCADE,

    equipment_name VARCHAR NOT NULL,
    quantity       INTEGER                  DEFAULT 1,
    is_available   BOOLEAN                  DEFAULT TRUE,

    updated_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
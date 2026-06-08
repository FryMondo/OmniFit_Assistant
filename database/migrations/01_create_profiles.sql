CREATE TYPE user_role AS ENUM ('athlete', 'coach', 'manager');

CREATE TABLE profiles
(
    id         UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
    username   VARCHAR UNIQUE,
    role       user_role NOT NULL       DEFAULT 'athlete',
    first_name VARCHAR,
    last_name  VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE
OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
INSERT INTO public.profiles (id, username, first_name, last_name, role)
VALUES (NEW.id,
        NEW.raw_user_meta_data ->>'username',
        NEW.raw_user_meta_data ->>'first_name',
        NEW.raw_user_meta_data ->>'last_name',
        COALESCE((NEW.raw_user_meta_data ->>'role') ::user_role, 'athlete' ::user_role));
RETURN NEW;
END;
$$
LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT
    ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
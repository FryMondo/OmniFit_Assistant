import {supabase} from '../../config/supabase';

export interface Profile {
    id: string;
    username: string;
    role: 'athlete' | 'coach' | 'manager';
    first_name: string;
    last_name: string;
    created_at: string;
}

export async function getProfileByUsername(username: string): Promise<Profile | null> {
    const {data, error} = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();

    if (error) {
        console.error(`Помилка пошуку користувача @${username}:`, error.message);
        return null;
    }

    return data;
}

export async function getProfileById(userId: string): Promise<Profile | null> {
    const {data, error} = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) {
        console.error(`Помилка отримання профілю ${userId}:`, error.message);
        return null;
    }

    return data;
}

export async function updateProfile(
    userId: string,
    updates: Partial<Omit<Profile, 'id' | 'created_at'>>
): Promise<Profile | null> {
    const {data, error} = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

    if (error) {
        console.error(`Помилка оновлення профілю ${userId}:`, error.message);
        return null;
    }

    return data;
}
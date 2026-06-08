import {supabase} from '../../config/supabase';

export interface DaySchedule {
    isOpen: boolean;
    openTime: string | null;
    closeTime: string | null;
}

export interface GymSchedule {
    monday?: DaySchedule;
    tuesday?: DaySchedule;
    wednesday?: DaySchedule;
    thursday?: DaySchedule;
    friday?: DaySchedule;
    saturday?: DaySchedule;
    sunday?: DaySchedule;
}

export interface Gym {
    id?: string;
    manager_id: string;
    name: string;
    address: string | null;
    description: string | null;
    total_score?: number;
    total_votes?: number;
    schedule?: GymSchedule;
    created_at?: string;
}

export async function createGym(gymData: Omit<Gym, 'id' | 'created_at' | 'total_score' | 'total_votes'>): Promise<Gym | null> {
    const {data, error} = await supabase
        .from('gyms')
        .insert([gymData])
        .select()
        .single();

    if (error) {
        console.error('Помилка створення залу:', error.message);
        return null;
    }

    return data;
}

export async function getAllGyms(): Promise<Gym[]> {
    const {data, error} = await supabase
        .from('gyms')
        .select('*')
        .order('created_at', {ascending: false});

    if (error) {
        console.error('Помилка отримання списку залів:', error.message);
        return [];
    }

    return data || [];
}

export async function getGymById(gymId: string): Promise<Gym | null> {
    const {data, error} = await supabase
        .from('gyms')
        .select('*')
        .eq('id', gymId)
        .single();

    if (error) {
        console.error(`Помилка отримання залу ${gymId}:`, error.message);
        return null;
    }

    return data;
}

export async function updateGym(
    gymId: string,
    updates: Partial<Omit<Gym, 'id' | 'manager_id' | 'created_at'>>
): Promise<Gym | null> {
    const {data, error} = await supabase
        .from('gyms')
        .update(updates)
        .eq('id', gymId)
        .select()
        .single();

    if (error) {
        console.error(`Помилка оновлення залу ${gymId}:`, error.message);
        return null;
    }

    return data;
}

export async function deleteGym(gymId: string): Promise<boolean> {
    const {error} = await supabase
        .from('gyms')
        .delete()
        .eq('id', gymId);

    if (error) {
        console.error(`Помилка видалення залу ${gymId}:`, error.message);
        return false;
    }

    return true;
}
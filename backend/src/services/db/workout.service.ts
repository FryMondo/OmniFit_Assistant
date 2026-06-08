import {supabase} from '../../config/supabase';

export interface Workout {
    id?: string;
    athlete_id: string;
    plan_name: string;
    workout_data: any;
    created_at?: string;
}

export async function saveWorkoutPlan(workoutData: Omit<Workout, 'id' | 'created_at'>): Promise<Workout | null> {
    const {data, error} = await supabase
        .from('workouts')
        .insert([workoutData])
        .select()
        .single();

    if (error) {
        console.error('Помилка збереження плану тренування:', error.message);
        return null;
    }

    return data;
}

export async function getWorkoutsByAthleteId(athleteId: string): Promise<Workout[]> {
    const {data, error} = await supabase
        .from('workouts')
        .select('*')
        .eq('athlete_id', athleteId)
        .order('created_at', {ascending: false});

    if (error) {
        console.error(`Помилка отримання планів для атлета ${athleteId}:`, error.message);
        return [];
    }

    return data || [];
}

export async function getWorkoutById(workoutId: string): Promise<Workout | null> {
    const {data, error} = await supabase
        .from('workouts')
        .select('*')
        .eq('id', workoutId)
        .single();

    if (error) {
        console.error(`Помилка отримання плану ${workoutId}:`, error.message);
        return null;
    }

    return data;
}

export async function updateWorkoutPlan(workoutId: string, updates: { plan_name?: string; workout_data?: any }) {
    const {data, error} = await supabase
        .from('workouts')
        .update(updates)
        .eq('id', workoutId)
        .select()
        .single();

    if (error) {
        console.error(`Помилка оновлення плану ${workoutId}:`, error.message);
        return null;
    }
    return data;
}

export async function deleteWorkoutPlan(workoutId: string): Promise<boolean> {
    const {error} = await supabase
        .from('workouts')
        .delete()
        .eq('id', workoutId);

    if (error) {
        console.error(`Помилка видалення плану ${workoutId}:`, error.message);
        return false;
    }

    return true;
}
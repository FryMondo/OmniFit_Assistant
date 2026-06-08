import {supabase} from '../../config/supabase';

export interface CustomMeal {
    id?: string;
    athlete_id: string;
    name: string;
    ingredients: any;
    total_calories: number;
    total_protein: number;
    total_fat: number;
    total_carbs: number;
    created_at?: string;
    updated_at?: string;
}

export async function createCustomMeal(mealData: Omit<CustomMeal, 'id' | 'created_at' | 'updated_at'>): Promise<CustomMeal | null> {
    const {data, error} = await supabase
        .from('custom_meals')
        .insert([mealData])
        .select()
        .single();

    if (error) {
        console.error('Помилка створення власної страви:', error.message);
        return null;
    }

    return data;
}

export async function getCustomMealsByAthleteId(athleteId: string): Promise<CustomMeal[]> {
    const {data, error} = await supabase
        .from('custom_meals')
        .select('*')
        .eq('athlete_id', athleteId)
        .order('name', {ascending: true});

    if (error) {
        console.error(`Помилка отримання страв для атлета ${athleteId}:`, error.message);
        return [];
    }

    return data || [];
}

export async function getCustomMealById(mealId: string): Promise<CustomMeal | null> {
    const {data, error} = await supabase
        .from('custom_meals')
        .select('*')
        .eq('id', mealId)
        .single();

    if (error) {
        console.error(`Помилка отримання страви ${mealId}:`, error.message);
        return null;
    }

    return data;
}

export async function updateCustomMeal(
    mealId: string,
    updates: Partial<Omit<CustomMeal, 'id' | 'athlete_id' | 'created_at'>>
): Promise<CustomMeal | null> {
    const {data, error} = await supabase
        .from('custom_meals')
        .update({...updates, updated_at: new Date().toISOString()})
        .eq('id', mealId)
        .select()
        .single();

    if (error) {
        console.error(`Помилка оновлення страви ${mealId}:`, error.message);
        return null;
    }

    return data;
}

export async function deleteCustomMeal(mealId: string): Promise<boolean> {
    const {error} = await supabase
        .from('custom_meals')
        .delete()
        .eq('id', mealId);

    if (error) {
        console.error(`Помилка видалення страви ${mealId}:`, error.message);
        return false;
    }

    return true;
}
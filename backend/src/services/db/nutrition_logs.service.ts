import {supabase} from '../../config/supabase';

export interface NutritionLog {
    id?: string;
    athlete_id: string;
    meal_category: 'breakfast' | 'lunch' | 'dinner' | 'snack' | null;
    meal_data: any;
    total_calories: number;
    logged_at?: string;
}

export async function saveNutritionLog(logData: Omit<NutritionLog, 'id' | 'logged_at'>): Promise<NutritionLog | null> {
    const {data, error} = await supabase
        .from('nutrition_logs')
        .insert([logData])
        .select()
        .single();

    if (error) {
        console.error('Помилка збереження прийому їжі:', error.message);
        return null;
    }

    return data;
}

export async function getNutritionLogsByAthleteId(athleteId: string): Promise<NutritionLog[]> {
    const {data, error} = await supabase
        .from('nutrition_logs')
        .select('*')
        .eq('athlete_id', athleteId)
        .order('logged_at', {ascending: false});

    if (error) {
        console.error(`Помилка отримання харчування для атлета ${athleteId}:`, error.message);
        return [];
    }

    return data || [];
}

export async function getNutritionLogById(logId: string): Promise<NutritionLog | null> {
    const {data, error} = await supabase
        .from('nutrition_logs')
        .select('*')
        .eq('id', logId)
        .single();

    if (error) {
        console.error(`Помилка отримання запису їжі ${logId}:`, error.message);
        return null;
    }

    return data;
}

export async function deleteNutritionLog(logId: string): Promise<boolean> {
    const {error} = await supabase
        .from('nutrition_logs')
        .delete()
        .eq('id', logId);

    if (error) {
        console.error(`Помилка видалення запису їжі ${logId}:`, error.message);
        return false;
    }

    return true;
}
import {supabase} from '../../config/supabase';

export interface AthleteMetrics {
    id?: string;
    athlete_id: string;
    gender: 'male' | 'female' | null;
    date_of_birth: string | null;
    weight_kg: number | null;
    height_cm: number | null;
    experience_level: string | null;
    injuries: string[] | null;
    goal?: 'weight_loss' | 'muscle_gain' | 'strength' | 'endurance' | null;
    target_calories?: number | null;
    target_protein?: number | null;
    target_fat?: number | null;
    target_carbs?: number | null;
    updated_at?: string;
}

export async function getMetricsByAthleteId(athleteId: string): Promise<AthleteMetrics | null> {
    const {data, error} = await supabase
        .from('athlete_metrics')
        .select('*')
        .eq('athlete_id', athleteId)
        .single();

    if (error && error.code !== 'PGRST116') {
        console.error(`Помилка отримання метрик для ${athleteId}:`, error.message);
        return null;
    }

    return data;
}

export async function upsertAthleteMetrics(
    athleteId: string,
    metricsData: Partial<Omit<AthleteMetrics, 'id' | 'athlete_id' | 'updated_at'>>
): Promise<AthleteMetrics | null> {
    const existingMetrics = await getMetricsByAthleteId(athleteId);

    let result;

    if (existingMetrics) {
        result = await supabase
            .from('athlete_metrics')
            .update({...metricsData, updated_at: new Date().toISOString()})
            .eq('athlete_id', athleteId)
            .select()
            .single();
    } else {
        result = await supabase
            .from('athlete_metrics')
            .insert([{athlete_id: athleteId, ...metricsData}])
            .select()
            .single();
    }

    if (result.error) {
        console.error(`Помилка збереження метрик для ${athleteId}:`, result.error.message);
        return null;
    }

    return result.data;
}
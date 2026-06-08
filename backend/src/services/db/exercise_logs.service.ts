import {supabase} from '../../config/supabase';

export interface ExerciseLog {
    id?: string;
    athlete_id: string;
    workout_plan_id?: string | null;
    exercise_name: string;
    weight_kg?: number | null;
    reps: number;
    performed_at?: string;
}

export async function logExercise(logData: Omit<ExerciseLog, 'id' | 'performed_at'>): Promise<ExerciseLog | null> {
    const {data, error} = await supabase
        .from('exercise_logs')
        .insert([logData])
        .select()
        .single();

    if (error) {
        console.error('Помилка збереження вправи:', error.message);
        return null;
    }

    return data;
}

export async function getExerciseLogsByAthleteId(athleteId: string): Promise<ExerciseLog[]> {
    const {data, error} = await supabase
        .from('exercise_logs')
        .select('*')
        .eq('athlete_id', athleteId)
        .order('performed_at', {ascending: false});

    if (error) {
        console.error(`Помилка отримання історії для атлета ${athleteId}:`, error.message);
        return [];
    }

    return data || [];
}

export async function getProgressForExercise(athleteId: string, exerciseName: string): Promise<ExerciseLog[]> {
    const {data, error} = await supabase
        .from('exercise_logs')
        .select('*')
        .eq('athlete_id', athleteId)
        .ilike('exercise_name', exerciseName)
        .order('performed_at', {ascending: true});

    if (error) {
        console.error(`Помилка отримання прогресу для вправи ${exerciseName}:`, error.message);
        return [];
    }

    return data || [];
}

export async function updateExerciseLog(
    logId: string,
    updates: Partial<Omit<ExerciseLog, 'id' | 'athlete_id' | 'performed_at'>>
): Promise<ExerciseLog | null> {
    const {data, error} = await supabase
        .from('exercise_logs')
        .update(updates)
        .eq('id', logId)
        .select()
        .single();

    if (error) {
        console.error(`Помилка оновлення запису ${logId}:`, error.message);
        return null;
    }

    return data;
}

export async function deleteExerciseLog(logId: string): Promise<boolean> {
    const {error} = await supabase
        .from('exercise_logs')
        .delete()
        .eq('id', logId);

    if (error) {
        console.error(`Помилка видалення запису ${logId}:`, error.message);
        return false;
    }

    return true;
}
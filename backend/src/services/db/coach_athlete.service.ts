import {supabase} from '../../config/supabase';

export interface CoachAthleteRelation {
    id?: string;
    coach_id: string;
    athlete_id: string;
    status: 'pending' | 'active' | 'rejected';
    created_at?: string;
}

export async function sendRelationRequest(coachId: string, athleteId: string): Promise<CoachAthleteRelation | null> {
    const {data, error} = await supabase
        .from('coach_athlete_relations')
        .insert([{
            coach_id: coachId,
            athlete_id: athleteId,
            status: 'pending'
        }])
        .select()
        .single();

    if (error) {
        console.error('Помилка створення заявки:', error.message);
        return null;
    }

    return data;
}

export async function getAthletesByCoachId(coachId: string): Promise<CoachAthleteRelation[]> {
    const {data, error} = await supabase
        .from('coach_athlete_relations')
        .select('*')
        .eq('coach_id', coachId);

    if (error) {
        console.error(`Помилка отримання учнів для тренера ${coachId}:`, error.message);
        return [];
    }

    return data || [];
}

export async function getCoachesByAthleteId(athleteId: string): Promise<CoachAthleteRelation[]> {
    const {data, error} = await supabase
        .from('coach_athlete_relations')
        .select('*')
        .eq('athlete_id', athleteId);

    if (error) {
        console.error(`Помилка отримання тренерів для учня ${athleteId}:`, error.message);
        return [];
    }

    return data || [];
}

export async function updateRelationStatus(
    relationId: string,
    newStatus: 'pending' | 'active' | 'rejected'
): Promise<CoachAthleteRelation | null> {
    const {data, error} = await supabase
        .from('coach_athlete_relations')
        .update({status: newStatus})
        .eq('id', relationId)
        .select()
        .single();

    if (error) {
        console.error(`Помилка оновлення статусу зв'язку ${relationId}:`, error.message);
        return null;
    }

    return data;
}

export async function deleteRelation(relationId: string): Promise<boolean> {
    const {error} = await supabase
        .from('coach_athlete_relations')
        .delete()
        .eq('id', relationId);

    if (error) {
        console.error(`Помилка видалення зв'язку ${relationId}:`, error.message);
        return false;
    }

    return true;
}
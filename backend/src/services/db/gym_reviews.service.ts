import {supabase} from '../../config/supabase';

export interface GymReview {
    id?: string;
    gym_id: string;
    user_id: string;
    score: number;
}

export async function addReview(gym_id: string, user_id: string, score: number): Promise<{
    review: GymReview | null,
    error: string | null
}> {
    const {data: review, error: reviewError} = await supabase
        .from('gym_reviews')
        .insert([{gym_id, user_id, score}])
        .select()
        .single();

    if (reviewError) {
        if (reviewError.code === '23505') {
            return {review: null, error: 'Ви вже залишали оцінку цьому залу'};
        }
        console.error('Помилка додавання відгуку:', reviewError.message);
        return {review: null, error: 'Не вдалося зберегти оцінку'};
    }

    const {data: gym} = await supabase
        .from('gyms')
        .select('total_score, total_votes')
        .eq('id', gym_id)
        .single();

    if (gym) {
        await supabase
            .from('gyms')
            .update({
                total_score: gym.total_score + score,
                total_votes: gym.total_votes + 1
            })
            .eq('id', gym_id);
    }

    return {review, error: null};
}

export async function getReviewsByGymId(gym_id: string): Promise<GymReview[]> {
    const {data, error} = await supabase
        .from('gym_reviews')
        .select('*')
        .eq('gym_id', gym_id);

    if (error) {
        console.error(`Помилка отримання відгуків для залу ${gym_id}:`, error.message);
        return [];
    }

    return data || [];
}

export async function getUserReviewForGym(gym_id: string, user_id: string): Promise<GymReview | null> {
    const {data, error} = await supabase
        .from('gym_reviews')
        .select('*')
        .eq('gym_id', gym_id)
        .eq('user_id', user_id)
        .single();

    if (error && error.code !== 'PGRST116') {
        console.error('Помилка перевірки статусу відгуку:', error.message);
    }

    return data;
}
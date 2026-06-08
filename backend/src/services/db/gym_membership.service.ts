import {supabase} from '../../config/supabase';

export type MembershipStatus = 'pending' | 'active' | 'rejected';

export interface GymMembership {
    id?: string;
    gym_id: string;
    user_id: string;
    user_type: 'staff' | 'client';
    status?: MembershipStatus;
    joined_at?: string;
}

export async function joinGym(
    gymId: string,
    userId: string,
    userType: 'staff' | 'client',
    status: MembershipStatus = 'pending'
): Promise<GymMembership | null> {
    const {data, error} = await supabase
        .from('gym_memberships')
        .insert([{
            gym_id: gymId,
            user_id: userId,
            user_type: userType,
            status: status
        }])
        .select()
        .single();

    if (error) {
        console.error('Помилка додавання користувача до залу:', error.message);
        return null;
    }

    return data;
}

export async function getMembersByGymId(gymId: string): Promise<GymMembership[]> {
    const {data, error} = await supabase
        .from('gym_memberships')
        .select('*')
        .eq('gym_id', gymId);

    if (error) {
        console.error(`Помилка отримання учасників залу ${gymId}:`, error.message);
        return [];
    }

    return data || [];
}

export async function getPendingStaffRequests(gymId: string): Promise<GymMembership[]> {
    const {data, error} = await supabase
        .from('gym_memberships')
        .select('*')
        .eq('gym_id', gymId)
        .eq('user_type', 'staff')
        .eq('status', 'pending');

    if (error) {
        console.error(`Помилка отримання заявок тренерів для залу ${gymId}:`, error.message);
        return [];
    }

    return data || [];
}

export async function getGymsByUserId(userId: string): Promise<GymMembership[]> {
    const {data, error} = await supabase
        .from('gym_memberships')
        .select('*')
        .eq('user_id', userId);

    if (error) {
        console.error(`Помилка отримання залів для користувача ${userId}:`, error.message);
        return [];
    }

    return data || [];
}

export async function updateMembershipType(
    membershipId: string,
    newType: 'staff' | 'client'
): Promise<GymMembership | null> {
    const {data, error} = await supabase
        .from('gym_memberships')
        .update({user_type: newType})
        .eq('id', membershipId)
        .select()
        .single();

    if (error) {
        console.error(`Помилка оновлення ролі в залі ${membershipId}:`, error.message);
        return null;
    }

    return data;
}

export async function updateMembershipStatus(
    membershipId: string,
    newStatus: MembershipStatus
): Promise<GymMembership | null> {
    const {data, error} = await supabase
        .from('gym_memberships')
        .update({status: newStatus})
        .eq('id', membershipId)
        .select()
        .single();

    if (error) {
        console.error(`Помилка оновлення статусу заявки ${membershipId}:`, error.message);
        return null;
    }

    return data;
}

export async function leaveGym(membershipId: string): Promise<boolean> {
    const {error} = await supabase
        .from('gym_memberships')
        .delete()
        .eq('id', membershipId);

    if (error) {
        console.error(`Помилка видалення членства ${membershipId}:`, error.message);
        return false;
    }

    return true;
}
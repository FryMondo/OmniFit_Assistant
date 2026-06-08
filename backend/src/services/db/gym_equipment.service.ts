import {supabase} from '../../config/supabase';

export interface GymEquipment {
    id?: string;
    gym_id: string;
    equipment_name: string;
    quantity: number;
    is_available: boolean;
    updated_at?: string;
}

export async function addEquipment(equipmentData: Omit<GymEquipment, 'id' | 'updated_at'>): Promise<GymEquipment | null> {
    const {data, error} = await supabase
        .from('gym_equipment')
        .insert([equipmentData])
        .select()
        .single();

    if (error) {
        console.error('Помилка додавання інвентарю:', error.message);
        return null;
    }

    return data;
}

export async function getEquipmentByGymId(gymId: string): Promise<GymEquipment[]> {
    const {data, error} = await supabase
        .from('gym_equipment')
        .select('*')
        .eq('gym_id', gymId)
        .order('equipment_name', {ascending: true});

    if (error) {
        console.error(`Помилка отримання інвентарю для залу ${gymId}:`, error.message);
        return [];
    }

    return data || [];
}

export async function updateEquipment(
    equipmentId: string,
    updates: Partial<Omit<GymEquipment, 'id' | 'gym_id'>>
): Promise<GymEquipment | null> {
    const {data, error} = await supabase
        .from('gym_equipment')
        .update({...updates, updated_at: new Date().toISOString()})
        .eq('id', equipmentId)
        .select()
        .single();

    if (error) {
        console.error(`Помилка оновлення інвентарю ${equipmentId}:`, error.message);
        return null;
    }

    return data;
}

export async function deleteEquipment(equipmentId: string): Promise<boolean> {
    const {error} = await supabase
        .from('gym_equipment')
        .delete()
        .eq('id', equipmentId);

    if (error) {
        console.error(`Помилка видалення інвентарю ${equipmentId}:`, error.message);
        return false;
    }

    return true;
}
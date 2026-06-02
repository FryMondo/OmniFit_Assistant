import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const CALORIE_NINJAS_KEY = process.env.CALORIE_NINJAS_KEY as string;

export interface NutritionalInfo {
    name: string;
    calories: number;
    protein_g: number;
    fat_total_g: number;
    carbohydrates_total_g: number;
    serving_size_g: number;
}

export async function fetchNutritionData(query: string): Promise<NutritionalInfo | null> {
    try {
        const url = `https://api.calorieninjas.com/v1/nutrition?query=${encodeURIComponent(query)}`;
        const response = await axios.get(url, {
            headers: { 'X-Api-Key': CALORIE_NINJAS_KEY }
        });

        if (response.data.items && response.data.items.length > 0) {
            return response.data.items[0] as NutritionalInfo;
        }
        return null;
    } catch (error: any) {
        console.error(`Помилка API для "${query}":`, error.message);
        return null;
    }
}
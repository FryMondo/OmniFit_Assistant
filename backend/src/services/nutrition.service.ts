import {nutritionModel} from "../config/gemini.config";
import {fetchNutritionData} from "./calorie.ninjas.service";

export interface NutritionItem {
    status: 'success' | 'error';
    product: string | null;
    amount: number | null;
    unit: string | null;
    note: string | null;
}

export interface GeminiNutritionResponse {
    items: NutritionItem[];
}

export interface CalculatedFoodItem {
    original_name: string;
    amount: number;
    unit: string;
    calories: number;
    protein_g: number;
    fat_g: number;
    carbs_g: number;
}

export interface NutritionSummary {
    items: CalculatedFoodItem[];
    totals: {
        calories: number;
        protein_g: number;
        fat_g: number;
        carbs_g: number;
    };
    errors: string[];
}

export async function parseNutritionInput(text: string): Promise<NutritionItem[]> {
    try {
        const result = await nutritionModel.generateContent(text);
        const responseText = result.response.text();

        const parsedData = JSON.parse(responseText) as GeminiNutritionResponse;

        return parsedData.items || [];
    } catch (error) {
        console.error("Gemini Parsing Error:", error);
        return [{
            status: "error",
            product: null,
            amount: null,
            unit: null,
            note: "Critical parsing failure"
        }];
    }
}

export async function calculateCaloriesFromText(userInput: string): Promise<NutritionSummary> {
    const parsedItems = await parseNutritionInput(userInput);

    const result: NutritionSummary = {
        items: [],
        totals: {calories: 0, protein_g: 0, fat_g: 0, carbs_g: 0},
        errors: []
    };

    for (const item of parsedItems) {
        if (item.status === 'error' || !item.product) {
            result.errors.push(item.note || 'Невідома помилка розпізнавання NLP.');
            continue;
        }
        let queryProduct = item.product;

        if (queryProduct.toLowerCase().match(/(zero|diet|no sugar)/)) {
            queryProduct = 'diet cola';
        }

        const query = `${item.amount}g ${queryProduct}`;
        const nutrition = await fetchNutritionData(query);

        if (nutrition) {
            result.items.push({
                original_name: item.product,
                amount: Number(item.amount),
                unit: item.unit || 'g',
                calories: nutrition.calories,
                protein_g: nutrition.protein_g,
                fat_g: nutrition.fat_total_g,
                carbs_g: nutrition.carbohydrates_total_g
            });

            result.totals.calories += nutrition.calories;
            result.totals.protein_g += nutrition.protein_g;
            result.totals.fat_g += nutrition.fat_total_g;
            result.totals.carbs_g += nutrition.carbohydrates_total_g;
        } else {
            result.errors.push(`Не вдалося знайти дані в базі для: "${item.product}"`);
        }
    }

    result.totals.calories = Number(result.totals.calories.toFixed(1));
    result.totals.protein_g = Number(result.totals.protein_g.toFixed(1));
    result.totals.fat_g = Number(result.totals.fat_g.toFixed(1));
    result.totals.carbs_g = Number(result.totals.carbs_g.toFixed(1));

    return result;
}
import {nutritionModel} from "../config/gemini.config";
import {fetchNutritionData} from "./calorie.ninjas.service";
import {getCustomMealsByAthleteId} from "./db/custom_meals.service";

export interface NutritionItem {
    status: 'success' | 'error';
    product: string | null;
    amount: number | null;
    unit: string | null;
    note: string | null;
}

export interface GeminiNutritionResponse {
    intent: 'log_meal' | 'create_custom_meal';
    meal_name: string | null;
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
    intent: 'log_meal' | 'create_custom_meal';
    custom_meal_name: string | null;
    items: CalculatedFoodItem[];
    totals: {
        calories: number;
        protein_g: number;
        fat_g: number;
        carbs_g: number;
    };
    errors: string[];
}

export async function parseNutritionInput(text: string): Promise<GeminiNutritionResponse> {
    try {
        const result = await nutritionModel.generateContent(text);
        const responseText = result.response.text();

        const parsedData = JSON.parse(responseText) as GeminiNutritionResponse;

        return {
            intent: parsedData.intent || 'log_meal',
            meal_name: parsedData.meal_name || null,
            items: parsedData.items || []
        };
    } catch (error) {
        console.error("Gemini Parsing Error:", error);
        return {
            intent: 'log_meal',
            meal_name: null,
            items: [{
                status: "error",
                product: null,
                amount: null,
                unit: null,
                note: "Critical parsing failure"
            }]
        };
    }
}

export async function calculateCaloriesFromText(userInput: string, athleteId: string): Promise<NutritionSummary> {
    const parsedData = await parseNutritionInput(userInput);
    const customMeals = await getCustomMealsByAthleteId(athleteId);

    const result: NutritionSummary = {
        intent: parsedData.intent,
        custom_meal_name: parsedData.meal_name,
        items: [],
        totals: {calories: 0, protein_g: 0, fat_g: 0, carbs_g: 0},
        errors: []
    };

    for (const item of parsedData.items) {
        if (item.status === 'error' || !item.product) {
            result.errors.push(item.note || 'Невідома помилка розпізнавання NLP.');
            continue;
        }

        const queryProduct = item.product.toLowerCase();
        const matchedCustomMeal = customMeals.find(m => m.name.toLowerCase() === queryProduct);

        if (matchedCustomMeal) {
            result.items.push({
                original_name: matchedCustomMeal.name,
                amount: 1,
                unit: 'serving',
                calories: matchedCustomMeal.total_calories,
                protein_g: matchedCustomMeal.total_protein,
                fat_g: matchedCustomMeal.total_fat,
                carbs_g: matchedCustomMeal.total_carbs
            });

            result.totals.calories += matchedCustomMeal.total_calories;
            result.totals.protein_g += matchedCustomMeal.total_protein;
            result.totals.fat_g += matchedCustomMeal.total_fat;
            result.totals.carbs_g += matchedCustomMeal.total_carbs;

            continue;
        }

        let apiQueryProduct = item.product;
        if (apiQueryProduct.toLowerCase().match(/(zero|diet|no sugar)/)) {
            apiQueryProduct = 'diet cola';
        }

        const query = `${item.amount}g ${apiQueryProduct}`;
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
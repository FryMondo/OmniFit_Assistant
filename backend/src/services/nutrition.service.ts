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

export async function parseNutritionInput(text: string, customMealNames: string[] = []): Promise<GeminiNutritionResponse> {
    try {
        let finalPrompt = text;
        if (customMealNames.length > 0) {
            const namesList = customMealNames.map(n => `"${n}"`).join(', ');
            finalPrompt += `\n\nIMPORTANT CONTEXT: The user has the following saved custom meals: [${namesList}]. If the user input mentions any of these, DO NOT translate the name into English, extract it EXACTLY as it is written in the array, and MUST set status to 'success' (do not mark it as an error or too generic).`;
        }

        const result = await nutritionModel.generateContent(finalPrompt);
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
    const customMeals = await getCustomMealsByAthleteId(athleteId);
    const customMealNames = customMeals.map(m => m.name);

    const parsedData = await parseNutritionInput(userInput, customMealNames);

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

        const queryProduct = item.product.toLowerCase().trim();
        const matchedCustomMeal = customMeals.find(m => m.name.toLowerCase().trim() === queryProduct);

        if (matchedCustomMeal) {
            let totalRecipeWeight = 0;
            if (matchedCustomMeal.ingredients && Array.isArray(matchedCustomMeal.ingredients)) {
                totalRecipeWeight = matchedCustomMeal.ingredients.reduce((sum: number, ing: any) => sum + (Number(ing.amount) || 0), 0);
            }

            if (totalRecipeWeight === 0) totalRecipeWeight = 1;

            let multiplier = 1;
            const inputAmount = Number(item.amount) || 1;

            if (item.unit === 'g' || item.unit === 'г' || item.unit === 'ml') {
                multiplier = inputAmount / totalRecipeWeight;
            } else {
                multiplier = inputAmount;
            }

            const calcCalories = Number((matchedCustomMeal.total_calories * multiplier).toFixed(1));
            const calcProtein = Number((matchedCustomMeal.total_protein * multiplier).toFixed(1));
            const calcFat = Number((matchedCustomMeal.total_fat * multiplier).toFixed(1));
            const calcCarbs = Number((matchedCustomMeal.total_carbs * multiplier).toFixed(1));

            result.items.push({
                original_name: matchedCustomMeal.name,
                amount: inputAmount,
                unit: item.unit || 'serving',
                calories: calcCalories,
                protein_g: calcProtein,
                fat_g: calcFat,
                carbs_g: calcCarbs
            });

            result.totals.calories += calcCalories;
            result.totals.protein_g += calcProtein;
            result.totals.fat_g += calcFat;
            result.totals.carbs_g += calcCarbs;

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
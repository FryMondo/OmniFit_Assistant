import {nutritionModel} from "../config/gemini.config";

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
import {fitnessModel, fitnessVoiceModel} from "../config/gemini.config";

export interface FitnessInput {
    goal: "weight_loss" | "muscle_gain" | "strength" | "endurance";
    experience_level: "beginner" | "intermediate" | "advanced";
    days_per_week: number;
    location: "gym" | "home" | "street";
    optional_equipment?: string[];
    injuries?: string[];
    additional_notes?: string;
    is_valid_fitness_query: boolean;
}

export interface Exercise {
    exercise_name: string;
    sets: number;
    reps: string;
    rest_seconds: number;
}

export interface TrainingDay {
    day_number: number;
    focus: string;
    exercises: Exercise[];
}

export interface FitnessPlanResponse {
    plan_name: string;
    days: TrainingDay[];
}

export async function parseFitnessVoiceInput(rawText: string): Promise<FitnessInput> {
    let parsedInput: FitnessInput;

    try {
        const result = await fitnessVoiceModel.generateContent(rawText);
        const responseText = result.response.text();
        parsedInput = JSON.parse(responseText) as FitnessInput;
    } catch (error: any) {
        console.error("Gemini API or JSON Parse Error:", error.message);
        throw new Error("FAILED_TO_PARSE_SPEECH");
    }

    if (!parsedInput.is_valid_fitness_query) {
        throw new Error("INVALID_FITNESS_QUERY");
    }

    if (parsedInput.injuries && parsedInput.injuries[0] === "UNSPECIFIED_INJURIES") {
        throw new Error("MISSING_INJURY_INFO");
    }

    return parsedInput;
}

export async function generateWorkoutPlan(input: FitnessInput): Promise<FitnessPlanResponse> {
    try {
        const prompt = JSON.stringify(input);
        const result = await fitnessModel.generateContent(prompt);
        const responseText = result.response.text();

        return JSON.parse(responseText) as FitnessPlanResponse;
    } catch (error: any) {
        console.error("Gemini Fitness Generation Error:", error.message);
        throw new Error("FAILED_TO_GENERATE_WORKOUT_PLAN");
    }
}
import {GoogleGenerativeAI, SchemaType, ResponseSchema} from "@google/generative-ai";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config();

const nutritionSchema: ResponseSchema = {
    type: SchemaType.OBJECT,
    properties: {
        intent: {
            type: SchemaType.STRING,
            description: "Намір користувача: 'log_meal' для звичайного запису їжі, або 'create_custom_meal' для створення нового рецепту/страви"
        },
        meal_name: {
            type: SchemaType.STRING,
            description: "Назва кастомної страви (наприклад, 'Бутерброди'), якщо intent = 'create_custom_meal'. Якщо назви немає, згенеруй коротку назву за інгредієнтами. Якщо intent = 'log_meal', поверни null",
            nullable: true
        },
        items: {
            type: SchemaType.ARRAY,
            description: "Список знайдених продуктів у тексті",
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    status: {
                        type: SchemaType.STRING,
                        description: "success або error"
                    },
                    product: {
                        type: SchemaType.STRING,
                        description: "Назва продукту англійською мовою",
                        nullable: true
                    },
                    amount: {
                        type: SchemaType.NUMBER,
                        description: "Кількість",
                        nullable: true
                    },
                    unit: {
                        type: SchemaType.STRING,
                        description: "Одиниці виміру (g або ml)",
                        nullable: true
                    },
                    note: {
                        type: SchemaType.STRING,
                        description: "Примітка англійською мовою, обов'язкова у разі помилки",
                        nullable: true
                    }
                },
                required: ["status", "product", "amount", "unit", "note"]
            }
        }
    },
    required: ["intent", "meal_name", "items"]
};

const fitnessSchema: ResponseSchema = {
    description: "Схема для генерації адаптивного плану тренувань",
    type: SchemaType.OBJECT,
    properties: {
        plan_name: {
            type: SchemaType.STRING,
            description: "Назва плану тренувань"
        },
        days: {
            type: SchemaType.ARRAY,
            description: "Масив тренувальних днів",
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    day_number: {
                        type: SchemaType.NUMBER,
                        description: "Порядковий номер дня"
                    },
                    focus: {
                        type: SchemaType.STRING,
                        description: "Групи м'язів або тип навантаження"
                    },
                    exercises: {
                        type: SchemaType.ARRAY,
                        items: {
                            type: SchemaType.OBJECT,
                            properties: {
                                exercise_name: {type: SchemaType.STRING},
                                sets: {type: SchemaType.NUMBER},
                                reps: {
                                    type: SchemaType.STRING,
                                    description: "Діапазон повторень відповідно до цілі"
                                },
                                rest_seconds: {type: SchemaType.NUMBER}
                            },
                            required: ["exercise_name", "sets", "reps", "rest_seconds"]
                        }
                    }
                },
                required: ["day_number", "focus", "exercises"]
            }
        }
    },
    required: ["plan_name", "days"]
};

const fitnessInputSchema: ResponseSchema = {
    description: "Парсинг тексту голосу у структуровані параметри тренування",
    type: SchemaType.OBJECT,
    properties: {
        goal: {
            type: SchemaType.STRING,
            enum: ["weight_loss", "muscle_gain", "strength", "endurance"],
            format: "enum"
        },
        experience_level: {
            type: SchemaType.STRING,
            enum: ["beginner", "intermediate", "advanced"],
            format: "enum"
        },
        days_per_week: {type: SchemaType.NUMBER},
        location: {
            type: SchemaType.STRING,
            enum: ["gym", "home", "street"],
            format: "enum"
        },
        optional_equipment: {
            type: SchemaType.ARRAY,
            items: {type: SchemaType.STRING},
            description: "List of equipment mentioned in English (e.g., dumbbells, barbell)"
        },
        injuries: {
            type: SchemaType.ARRAY,
            items: {type: SchemaType.STRING},
            description: "List of health issues or injuries in English (e.g., knee_pain, back_pain)"
        },
        additional_notes: {
            type: SchemaType.STRING,
            nullable: true
        },
        is_valid_fitness_query: {
            type: SchemaType.BOOLEAN,
            description: "True if the user is actually asking for a workout/fitness plan. False if the text is absurd, random, or unrelated to fitness."
        }
    },
    required: ["goal", "experience_level", "days_per_week", "location", "injuries", "is_valid_fitness_query"]
};

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

const nutritionInstructionText = fs.readFileSync(
    path.join(__dirname, "../prompts/calories_voice_instructions.txt"),
    "utf-8"
);

const fitnessInstructionText = fs.readFileSync(
    path.join(__dirname, "../prompts/fitness_instructions.txt"),
    "utf-8"
);

const voiceInstructionText = fs.readFileSync(
    path.join(__dirname, "../prompts/fitness_voice_instructions.txt"),
    "utf-8"
);

export const nutritionModel = genAI.getGenerativeModel({
    model: "gemini-3.1-flash-lite",
    generationConfig: {
        responseMimeType: "application/json",
        responseSchema: nutritionSchema,
    },
    systemInstruction: nutritionInstructionText,
});

export const fitnessModel = genAI.getGenerativeModel({
    model: "gemini-3.1-flash-lite",
    generationConfig: {
        responseMimeType: "application/json",
        responseSchema: fitnessSchema,
    },
    systemInstruction: fitnessInstructionText,
});

export const fitnessVoiceModel = genAI.getGenerativeModel({
    model: "gemini-3.1-flash-lite",
    generationConfig: {
        responseMimeType: "application/json",
        responseSchema: fitnessInputSchema,
    },
    systemInstruction: voiceInstructionText,
});
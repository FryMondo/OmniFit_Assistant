import {parseNutritionInput, calculateCaloriesFromText} from "./src/services/nutrition.service";
import {generateWorkoutPlan, FitnessInput, parseFitnessVoiceInput} from "./src/services/fitness.service";
import {supabase} from './src/config/supabase'

async function nutritionVoice(userInput: string) {
    const data = await parseNutritionInput(userInput);

    if (data.items[0]!.status === "success") {
        console.log(data);
    } else {
        console.log("Помилка: запит не зрозуміло.");
        console.log(data);
    }
}

async function fitness(userInput: string) {
    // const beginnerGym: FitnessInput = {
    //     goal: "muscle_gain",
    //     experience_level: "advanced",
    //     days_per_week: 6,
    //     location: "gym",
    //     injuries: []
    // };
    //
    // const plan = await generateWorkoutPlan(beginnerGym);
    //
    // if (plan) {
    //     console.log(JSON.stringify(plan, null, 2));
    // } else {
    //     console.log("Помилка при генерації плану.");
    // }
    const extractedInput = await parseFitnessVoiceInput(userInput);

    if (!extractedInput) {
        console.log("Voice unrecognized.");
        return;
    }

    console.log(extractedInput);
    const finalPlan = await generateWorkoutPlan(extractedInput);

    if (finalPlan) {
        console.log(JSON.stringify(finalPlan, null, 2));
    } else {
        console.log("Помилка при генерації плану.");
    }
}

async function caloriesOfNutritionInput(userInput: string) {
    // @ts-ignore
    const finalData = await calculateCaloriesFromText(userInput);

    console.log(JSON.stringify(finalData, null, 2));
}

async function testDatabaseConnection() {
    console.log("Спроба підключення до Supabase...");

    const {data, error} = await supabase
        .from('profiles')
        .select('*')
        .limit(1);

    if (error) {
        console.error("Помилка підключення:", error.message);
        return;
    }

    console.log("Підключення успішне!");
    console.log("Отримані дані:", data);
}

// nutritionVoice("2 cinnamon rolls and 1 coffee");

// fitness("Створи план для набору маси. Досвід: новачок. Локація: зал. Інвентар: гантелі. Травми: болить коліно");

// caloriesOfNutritionInput("200 грамів хліба 130 грам ковбаси 40 грам сиру 10 грам майонезу 20 грам кетчупу");

// testDatabaseConnection();
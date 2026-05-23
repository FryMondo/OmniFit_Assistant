import {parseNutritionInput} from "./src/services/nutrition.service";
import {generateWorkoutPlan, FitnessInput, parseFitnessVoiceInput} from "./src/services/fitness.service";

async function nutrition() {
    const userInput = "MI BOMBO!!!";
    const data = await parseNutritionInput(userInput);

    if (data[0]!.status === "success") {
        console.log(data);
    } else {
        console.log("Помилка: запит не зрозуміло.");
        console.log(data);
    }
}

async function fitness() {
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
    const userInput = "Я хочу набрати м'язову масу, тренуюся 4 рази на тиждень, в залі а травм немає";
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

// nutrition();
fitness();
import {generateWorkoutPlan, FitnessInput} from "../src/services/fitness.service";

describe("Fitness Service - generateWorkoutPlan (Plan Selection)", () => {
    it("1. Повинен генерувати 'Full Body' для новачка без спеціальних нотаток", async () => {
        const input: FitnessInput = {
            goal: "muscle_gain",
            experience_level: "beginner",
            days_per_week: 3,
            location: "gym",
            is_valid_fitness_query: true
        };
        const result = await generateWorkoutPlan(input);
        expect(result.plan_name).toBe("Full Body");
    });

    it("2. Повинен генерувати 'Upper/Lower Split' для середнього рівня на 4 дні", async () => {
        const input: FitnessInput = {
            goal: "muscle_gain",
            experience_level: "intermediate",
            days_per_week: 4,
            location: "gym",
            is_valid_fitness_query: true
        };
        const result = await generateWorkoutPlan(input);
        expect(result.plan_name).toBe("Upper/Lower Split");
    });

    it("3. Повинен генерувати 'Push/Pull/Legs' для середнього рівня на 3 дні",
        async () => {
            const input: FitnessInput = {
                goal: "muscle_gain",
                experience_level: "intermediate",
                days_per_week: 3,
                location: "gym",
                injuries: [],
                is_valid_fitness_query: true
            };
            const result = await generateWorkoutPlan(input);
            expect(result.plan_name).toBe("Push/Pull/Legs");
        });

    it("4. Повинен генерувати 'Split' замість PPL, якщо є травма ніг", async () => {
        const input: FitnessInput = {
            goal: "muscle_gain",
            experience_level: "intermediate",
            days_per_week: 3,
            location: "gym",
            injuries: ["knee_pain"],
            is_valid_fitness_query: true
        };
        const result = await generateWorkoutPlan(input);
        expect(result.plan_name).toBe("Split");
    });

    it("5. Повинен генерувати 'Circuit Training' для новачка, який хоче схуднути і не хоче довго займатись",
        async () => {
            const input: FitnessInput = {
                goal: "weight_loss",
                experience_level: "beginner",
                days_per_week: 3,
                location: "home",
                additional_notes: "не хочу довго",
                is_valid_fitness_query: true
            };
            const result = await generateWorkoutPlan(input);
            expect(result.plan_name).toBe("Circuit Training");
        });

    it("6. Повинен генерувати 'High-intensity interval training' при запиті на високу інтенсивність",
        async () => {
            const input: FitnessInput = {
                goal: "weight_loss",
                experience_level: "beginner",
                days_per_week: 3,
                location: "home",
                additional_notes: "хочу більшу інтенсивність",
                is_valid_fitness_query: true
            };
            const result = await generateWorkoutPlan(input);
            expect(result.plan_name).toBe("High-intensity interval training");
        });

    it("7. Повинен обмежувати кількість днів, якщо введено надто багато днів (наприклад, 8+)",
        async () => {
            const input: FitnessInput = {
                goal: "muscle_gain",
                experience_level: "beginner",
                days_per_week: 8,
                location: "gym",
                is_valid_fitness_query: true
            };
            const result = await generateWorkoutPlan(input);

            expect(result.days.length).toBeLessThanOrEqual(4);
        });

    it("8. Повинен адаптувати вправи під наявне спорядження (тільки гантелі вдома)", async () => {
        const input: FitnessInput = {
            goal: "muscle_gain",
            experience_level: "intermediate",
            days_per_week: 3,
            location: "home",
            optional_equipment: ["dumbbells"],
            is_valid_fitness_query: true
        };
        const result = await generateWorkoutPlan(input);

        const allExercises = result.days.flatMap(day =>
            day.exercises.map(ex => ex.exercise_name.toLowerCase()));

        const hasDumbbellExercise = allExercises.some(name => name.includes("dumbbell"));
        expect(hasDumbbellExercise).toBe(true);
    });

    it("9. Повинен повністю адаптувати тренування під серйозну травму (зламана нога)", async () => {
        const input: FitnessInput = {
            goal: "muscle_gain",
            experience_level: "intermediate",
            days_per_week: 3,
            location: "gym",
            injuries: ["broken_leg"],
            is_valid_fitness_query: true
        };
        const result = await generateWorkoutPlan(input);

        const allExercises = result.days.flatMap(day =>
            day.exercises.map(ex => ex.exercise_name.toLowerCase()));
        const hasStandingLegExercises = allExercises.some(name =>
            name.includes("squat") || name.includes("lunge") ||
            name.includes("deadlift") || name.includes("leg press")
        );

        expect(hasStandingLegExercises).toBe(false);
    });

    it("10. Повинен встановлювати правильні reps та rest_seconds для схуднення (weight_loss)",
        async () => {
            const input: FitnessInput = {
                goal: "weight_loss",
                experience_level: "beginner",
                days_per_week: 3,
                location: "gym",
                is_valid_fitness_query: true
            };
            const result = await generateWorkoutPlan(input);

            const firstExercise = result.days[0].exercises[0];

            expect(firstExercise.rest_seconds).toBeGreaterThanOrEqual(15);
            expect(firstExercise.rest_seconds).toBeLessThanOrEqual(180);
            expect(firstExercise.reps).toMatch(/(15|20|30)/);
        });

    it("11. Повинен встановлювати правильні reps та rest_seconds для набору маси (muscle_gain)",
        async () => {
            const input: FitnessInput = {
                goal: "muscle_gain",
                experience_level: "intermediate",
                days_per_week: 3,
                location: "gym",
                is_valid_fitness_query: true
            };
            const result = await generateWorkoutPlan(input);

            const firstExercise = result.days[0].exercises[0];

            expect(firstExercise.rest_seconds).toBeGreaterThanOrEqual(180);
            expect(firstExercise.rest_seconds).toBeLessThanOrEqual(300);
            expect(firstExercise.reps).toMatch(/(6|8|10|12|15)/);
        });

    it("12. Повинен встановлювати правильні reps та rest_seconds для сили (strength)",
        async () => {
            const input: FitnessInput = {
                goal: "strength",
                experience_level: "advanced",
                days_per_week: 4,
                location: "gym",
                is_valid_fitness_query: true
            };
            const result = await generateWorkoutPlan(input);

            const firstExercise = result.days[0].exercises[0];

            expect(firstExercise.rest_seconds).toBeGreaterThanOrEqual(300);
            expect(firstExercise.reps).toMatch(/([123456])/);
        });

    it("13. Повинен успішно генерувати план із мінімальним набором даних (DEFAULT VALUES)",
        async () => {
            const input: FitnessInput = {
                goal: "muscle_gain",
                experience_level: "beginner",
                days_per_week: 3,
                location: "gym",
                injuries: [],
                is_valid_fitness_query: true
            };
            const result = await generateWorkoutPlan(input);

            expect(result).toHaveProperty("plan_name");
            expect(result.days.length).toBeGreaterThan(0);
            expect(result.days[0].exercises.length).toBeGreaterThan(0);
        });
});
import {parseFitnessVoiceInput} from "../src/services/fitness.service";

describe("parseFitnessVoiceInput - Голосовий процесор", () => {
    it("1. Повне введення (Я профі, хочу приріст сили. Буду займатись в залі 4 дні на тиждень. Травм немає, повністю здоровий.)", async () => {
        const input = "Я профі, хочу приріст сили. Буду займатись в залі 4 дні на тиждень. Травм немає, повністю здоровий.";
        const result = await parseFitnessVoiceInput(input);

        expect(result.is_valid_fitness_query).toBe(true);
        expect(result.goal).toBe("strength");
        expect(result.experience_level).toBe("advanced");
        expect(result.days_per_week).toBe(4);
        expect(result.location).toBe("gym");
        expect(result.injuries).toEqual([]);
    });

    it("2. Повне введення без вказування травми (Привіт, я новачок, хочу скинути вагу. Буду займатись вдома 3 рази на тиждень.)", async () => {
        const input = "Привіт, я новачок, хочу скинути вагу. Буду займатись вдома 3 рази на тиждень.";

        await expect(parseFitnessVoiceInput(input)).rejects.toThrow("MISSING_INJURY_INFO");
    });

    it("3. Повне введення, але з дефектами мовлення та суржиком (Карочє хачу схудати, треніруватися буду дома 3 рази, зі спорядження тіки гантєлі. здаровий нічо не болить)", async () => {
        const input = "Карочє хачу схудати, треніруватися буду дома 3 рази, зі спорядження тіки гантєлі. здаровий нічо не болить";
        const result = await parseFitnessVoiceInput(input);

        expect(result.is_valid_fitness_query).toBe(true);
        expect(result.goal).toBe("weight_loss");
        expect(result.location).toBe("home");
        expect(result.optional_equipment).toContain("dumbbells");
        expect(result.injuries).toEqual([]);
    });

    it("4. Недостатньо даних - спрацювання DEFAULT VALUES (Склади мені якусь програму тренувань. Травм немає.)", async () => {
        const input = "Склади мені якусь програму тренувань. Травм немає.";
        const result = await parseFitnessVoiceInput(input);

        expect(result.is_valid_fitness_query).toBe(true);
        expect(result.goal).toBe("muscle_gain");
        expect(result.experience_level).toBe("beginner");
        expect(result.days_per_week).toBe(3);
        expect(result.location).toBe("gym");
        expect(result.injuries).toEqual([]);
    });

    it("5. Недостатньо даних без вказування травми (Склади мені якусь програму тренувань.)", async () => {
        const input = "Склади мені якусь програму тренувань.";

        await expect(parseFitnessVoiceInput(input)).rejects.toThrow("MISSING_INJURY_INFO");
    });

    it("6. Абсурдні дані (MI BOMBO!!!)", async () => {
        const input = "MI BOMBO!!!";

        await expect(parseFitnessVoiceInput(input)).rejects.toThrow("INVALID_FITNESS_QUERY");
    });

});
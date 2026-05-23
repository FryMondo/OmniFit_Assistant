import {parseFitnessVoiceInput} from "../src/services/fitness.service";

describe("parseFitnessVoiceInput - Голосовий процесор", () => {
    it("1. Звичайна робота (Повний набір валідних даних)", async () => {
        const input = "Я профі, хочу приріст сили. Буду займатись в залі 4 дні на тиждень. Травм немає, повністю здоровий.";
        const result = await parseFitnessVoiceInput(input);

        expect(result.is_valid_fitness_query).toBe(true);
        expect(result.goal).toBe("strength");
        expect(result.experience_level).toBe("advanced");
        expect(result.days_per_week).toBe(4);
        expect(result.location).toBe("gym");
        expect(result.injuries).toEqual([]);
    });

    it("2. Звичайна робота, але БЕЗ вказування травми (Очікується помилка безпеки)", async () => {
        const input = "Привіт, я новачок, хочу скинути вагу. Буду займатись вдома 3 рази на тиждень.";

        await expect(parseFitnessVoiceInput(input)).rejects.toThrow("MISSING_INJURY_INFO");
    });

    it("3. Звичайне введення, але з дефектами мовлення та суржиком", async () => {
        const input = "Карочє хачу схудати, треніруватися буду дома 3 рази, зі спорядження тіки гантєлі. здаровий нічо не болить";
        const result = await parseFitnessVoiceInput(input);

        expect(result.is_valid_fitness_query).toBe(true);
        expect(result.goal).toBe("weight_loss");
        expect(result.location).toBe("home");
        expect(result.optional_equipment).toContain("dumbbells");
        expect(result.injuries).toEqual([]);
    });

    it("4. Мало даних + спрацювання DEFAULT VALUES + вказана відсутність травм", async () => {
        const input = "Склади мені якусь програму тренувань. Травм немає.";
        const result = await parseFitnessVoiceInput(input);

        expect(result.is_valid_fitness_query).toBe(true);
        expect(result.goal).toBe("muscle_gain");
        expect(result.experience_level).toBe("beginner");
        expect(result.days_per_week).toBe(3);
        expect(result.location).toBe("gym");
        expect(result.injuries).toEqual([]);
    });

    it("5. Мало даних і БЕЗ вказування травми (Перевага безпеки над дефолтом)", async () => {
        const input = "Склади мені якусь програму тренувань.";

        await expect(parseFitnessVoiceInput(input)).rejects.toThrow("MISSING_INJURY_INFO");
    });

    it("6. Абсурдні дані (Очікується помилка наміру)", async () => {
        const input = "MI BOMBO!!!";

        await expect(parseFitnessVoiceInput(input)).rejects.toThrow("INVALID_FITNESS_QUERY");
    });

    it("7. Абсурдні дані + вказування травми (Намір важливіший за травму)", async () => {
        const input = "MI BOMBO!!! травма голови";

        await expect(parseFitnessVoiceInput(input)).rejects.toThrow("INVALID_FITNESS_QUERY");
    });

});
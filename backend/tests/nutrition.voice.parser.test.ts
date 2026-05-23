import {parseNutritionInput} from "../src/services/nutrition.service";

describe("Nutrition Service AI Tests", () => {
    // 1. Чітке введення одного продукту (50 грамів курки)
    test("1. Має вивести продукт та його кількість при чіткому запиті", async () => {
        const result = await parseNutritionInput("50 грамів курки");

        expect(result[0].status).toBe("success");
        expect(result[0].product).toMatch(/chicken/i);
        expect(result[0].amount).toBe(50);
    });

    // 2. Довге введення одного продукту (Привіт! Я спожив 150 грамів хліба, який я купив сьогодні в магазині)
    test("2. Має вивести продукт та його кількість при довгому запиті", async () => {
        const result = await
            parseNutritionInput("Привіт! Я спожив 150 грамів хліба, який я купив сьогодні в магазині");

        expect(result[0].status).toBe("success");
        expect(result[0].product).toMatch(/bread/i);
        expect(result[0].amount).toBe(150);
    });

    // 3. Введенні дані не стосуються продуктів та їх кількості (MI BOMBO!!!)
    test("3. Має вивести помилку запиту при неправильно введеному запиті", async () => {
        const result = await parseNutritionInput("MI BOMBO!!!");

        expect(result[0].status).toBe("error");
    });

    // 4. Переведення з сирого в готовий продукт (Я зварив 100 грамів рису і спожив його)
    test("4. Має вивести продукт та його готову кількість", async () => {
        const result = await
            parseNutritionInput("Я зварив 100 грамів рису і спожив його");

        expect(result[0].status).toBe("success");
        expect(result[0].product).toMatch(/rice/i);
        expect(result[0].amount).toBeGreaterThanOrEqual(300);
    });

    // 5. Введення даних англійською мовою (300 grams of beef)
    test("5. Має вивести продукт та його кількість при запиті англійською", async () => {
        const result = await
            parseNutritionInput("300 grams of beef");

        expect(result[0].status).toBe("success");
        expect(result[0].product).toMatch(/beef/i);
        expect(result[0].amount).toBe(300);
    });

    // 6. Введення даних російською мовою (175 грамов картошки)
    test("6. Має вивести продукт та його кількість при запиті російською", async () => {
        const result = await
            parseNutritionInput("175 грамов картошки");

        expect(result[0].status).toBe("success");
        expect(result[0].product).toMatch(/potato/i);
        expect(result[0].amount).toBe(175);
    });

    // 7. Чітке введення декількох продуктів (230 грамів гречки та 100 грамів огірків)
    test("7. Має коректно розпізнати декілька продуктів при чіткому запиті одночасно", async () => {
        const result = await parseNutritionInput("230 грамів гречки та 100 грамів огірків");

        expect(result.length).toBeGreaterThanOrEqual(2);

        expect(result[0].status).toBe("success");
        expect(result[0].product).toMatch(/buckwheat/i);
        expect(result[0].amount).toBe(230);

        expect(result[1].status).toBe("success");
        expect(result[1].product).toMatch(/cucumber/i);
        expect(result[1].amount).toBe(100);
    });

    // 8. Довге введення декількох продуктів (Я приготував собі вечерю, а саме 200 грамів макаронів, 150 грамів курки та 50 грамів салату з помідорів і огірків, і я все це з'їв)
    test("8. Має коректно розпізнати декілька продуктів при довгому запиті одночасно", async () => {
        const result = await parseNutritionInput("Я приготував собі вечерю, а саме 200 грамів макаронів, 150 грамів курки та 50 грамів салату з помідорів і огірків, і я все це з'їв");

        expect(result.length).toBeGreaterThanOrEqual(3);

        expect(result[0].status).toBe("success");
        expect(result[0].product).toMatch(/pasta/i);
        expect(result[0].amount).toBe(200);

        expect(result[1].status).toBe("success");
        expect(result[1].product).toMatch(/chicken/i);
        expect(result[1].amount).toBe(150);

        expect(result[2].status).toBe("success");
        expect(result[2].product).toMatch(/salad/i);
        expect(result[2].amount).toBe(50);
    })

    // 9. Питання скільки калорій в певній кількості продукту (Скільки калорій в 1000 грамах хліба?)
    test("9. Має вивести продукт та його кількість якщо було задано питання", async () => {
        const result = await parseNutritionInput("Скільки калорій в 1000 грамах хліба?");

        expect(result[0].status).toBe("success");
        expect(result[0].product).toMatch(/bread/i);
        expect(result[0].amount).toBe(1000);
    });

    // 10. Скільки калорій в продукті без вказування кількості (Скільки калорій в смаженій курці?)
    test("10. Має вивести продукт в кількості 100 грам, навіть без вказування ваги, якщо було задано питання", async () => {
        const result = await parseNutritionInput("Скільки калорій в смаженій курці?");

        expect(result[0].status).toBe("success");
        expect(result[0].product).toMatch(/fried chicken/i);
        expect(result[0].amount).toBe(100);
    });

    // 11. Нечітке введення продукту та його кількості (тлиста глам либи) (300 грам риби)
    test("11. Має розпізнати продукт та його кількість при нечіткому запиті", async () => {
        const result = await parseNutritionInput("тлиста глам либи");

        expect(result[0].status).toBe("success");
        expect(result[0].product).toMatch(/fish/i);
        expect(result[0].amount).toBe(300);
    });

    // 12. Переведення сирого продукту в готовий, але не було з'їдено певну частину (Я зварив 300 грамів гречки, але з'їв лише третину)
    test("12. Має розрахувати переведення сирого продукту в готовий, але врахувати лише вказану частину", async () => {
        const result = await parseNutritionInput("Я зварив 300 грамів гречки, але з'їв лише третину");

        expect(result[0].status).toBe("success");
        expect(result[0].product).toMatch(/buckwheat/i);
        expect(result[0].amount).toBeGreaterThanOrEqual(300);
    });
});
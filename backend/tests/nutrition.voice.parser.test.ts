import {parseNutritionInput} from "../src/services/nutrition.service";

describe("Nutrition Service AI Tests", () => {
    test("1. Чітке введення одного продукту (50 грамів курки)", async () => {
        const result = await parseNutritionInput("50 грамів курки");

        expect(result.items[0].status).toBe("success");
        expect(result.items[0].product).toMatch(/chicken/i);
        expect(result.items[0].amount).toBe(50);
    });

    test("2.  Довге введення одного продукту (Привіт! Я спожив 150 грамів хліба, який я купив сьогодні в магазині)", async () => {
        const result = await
            parseNutritionInput("Привіт! Я спожив 150 грамів хліба, який я купив сьогодні в магазині");

        expect(result.items[0].status).toBe("success");
        expect(result.items[0].product).toMatch(/bread/i);
        expect(result.items[0].amount).toBe(150);
    });

    test("3. Введенні дані не стосуються продуктів та їх кількості (MI BOMBO!!!)", async () => {
        const result = await parseNutritionInput("MI BOMBO!!!");

        expect(result.items[0].status).toBe("error");
    });

    test("4. Переведення з сирого в готовий продукт (Я зварив 100 грамів сухого рису і спожив його)", async () => {
        const result = await
            parseNutritionInput("Я зварив 100 грамів сухого рису і спожив його");

        expect(result.items[0].status).toBe("success");
        expect(result.items[0].product).toMatch(/rice/i);
        expect(result.items[0].amount).toBeGreaterThanOrEqual(300);
    });

    test("5. Введення даних англійською мовою (300 grams of beef)", async () => {
        const result = await
            parseNutritionInput("300 grams of beef");

        expect(result.items[0].status).toBe("success");
        expect(result.items[0].product).toMatch(/beef/i);
        expect(result.items[0].amount).toBe(300);
    });

    test("6. Чітке введення декількох продуктів (230 грамів гречки та 100 грамів огірків)", async () => {
        const result = await parseNutritionInput("230 грамів гречки та 100 грамів огірків");

        expect(result.items.length).toBeGreaterThanOrEqual(2);

        expect(result.items[0].status).toBe("success");
        expect(result.items[0].product).toMatch(/buckwheat/i);
        expect(result.items[0].amount).toBe(230);

        expect(result.items[1].status).toBe("success");
        expect(result.items[1].product).toMatch(/cucumber/i);
        expect(result.items[1].amount).toBe(100);
    });

    test("7. Довге введення декількох продуктів (Я приготував собі вечерю, а саме 200 грамів макаронів, 150 грамів курки та 50 грамів салату з помідорів і огірків, і я все це з'їв)", async () => {
        const result = await parseNutritionInput("Я приготував собі вечерю, а саме 200 грамів макаронів, 150 грамів курки та 50 грамів салату з помідорів і огірків, і я все це з'їв");

        expect(result.items.length).toBeGreaterThanOrEqual(3);

        expect(result.items[0].status).toBe("success");
        expect(result.items[0].product).toMatch(/pasta/i);
        expect(result.items[0].amount).toBe(200);

        expect(result.items[1].status).toBe("success");
        expect(result.items[1].product).toMatch(/chicken/i);
        expect(result.items[1].amount).toBe(150);

        expect(result.items[2].status).toBe("success");
        expect(result.items[2].product).toMatch(/salad/i);
        expect(result.items[2].amount).toBe(50);
    })

    test("8. Питання скільки калорій в певній кількості продукту (Скільки калорій в 1000 грамах хліба?)", async () => {
        const result = await parseNutritionInput("Скільки калорій в 1000 грамах хліба?");

        expect(result.items[0].status).toBe("success");
        expect(result.items[0].product).toMatch(/bread/i);
        expect(result.items[0].amount).toBe(1000);
    });

    test("9. Скільки калорій в продукті без вказування кількості (Скільки калорій в смаженій курці?)", async () => {
        const result = await parseNutritionInput("Скільки калорій в смаженій курці?");

        expect(result.items[0].status).toBe("success");
        expect(result.items[0].product).toMatch(/fried chicken/i);
        expect(result.items[0].amount).toBe(100);
    });

    test("10. Нечітке введення продукту та його кількості (тлиста глам либи) (300 грам риби)", async () => {
        const result = await parseNutritionInput("тлиста глам либи");

        expect(result.items[0].status).toBe("success");
        expect(result.items[0].product).toMatch(/fish/i);
        expect(result.items[0].amount).toBe(300);
    });

    test("11. Переведення сирого продукту в готовий, але не було з'їдено певну частину (Я зварив 300 грамів гречки, але з'їв лише третину)", async () => {
        const result = await parseNutritionInput("Я зварив 300 грамів гречки, але з'їв лише третину");

        expect(result.items[0].status).toBe("success");
        expect(result.items[0].product).toMatch(/buckwheat/i);
        expect(result.items[0].amount).toBeGreaterThanOrEqual(300);
    });
});
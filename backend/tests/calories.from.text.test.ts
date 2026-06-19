import {calculateCaloriesFromText} from "../src/services/nutrition.service";

describe("Nutrition Service - calculateCaloriesFromText", () => {
    const userId = "e3a67a44-1b5f-4653-9eab-3285c25a1228";

    it("1. Чітке введення продукту: '100 грам хліба'", async () => {
        const result = await calculateCaloriesFromText("100 грам хліба", userId);

        expect(result.items.length).toBe(1);
        expect(result.items[0].original_name).toMatch(/bread/i);
        expect(result.items[0].amount).toBe(100);

        expect(result.items[0].calories).toBe(261.6);
        expect(result.items[0].protein_g).toBe(8.8);
        expect(result.items[0].fat_g).toBe(3.4);
        expect(result.items[0].carbs_g).toBe(50.2);

        expect(result.totals.calories).toBe(261.6);
        expect(result.totals.protein_g).toBe(8.8);
        expect(result.totals.fat_g).toBe(3.4);
        expect(result.totals.carbs_g).toBe(50.2);

        expect(result.errors.length).toBe(0);
    });

    it("2. Чітке введення продукту іноземною мовою: '135 grams of spaghetti'", async () => {
        const result = await calculateCaloriesFromText("135 grams of spaghetti", userId);

        expect(result.items.length).toBe(1);
        expect(result.items[0].original_name).toMatch(/spaghetti/i);
        expect(result.items[0].amount).toBe(135);

        expect(result.items[0].calories).toBe(208);
        expect(result.items[0].protein_g).toBe(7.2);
        expect(result.items[0].fat_g).toBe(0.8);
        expect(result.items[0].carbs_g).toBe(41.3);

        expect(result.totals.calories).toBe(208);
        expect(result.totals.protein_g).toBe(7.2);
        expect(result.totals.fat_g).toBe(0.8);
        expect(result.totals.carbs_g).toBe(41.3);

        expect(result.errors.length).toBe(0);
    });

    it("3. Чітке введення декількох продуктів: '200 грам курки та 450 грам гречки'", async () => {
        const result = await calculateCaloriesFromText("200 грам курки та 450 грам гречки", userId);

        expect(result.items.length).toBe(2);
        expect(result.items[0].original_name).toMatch(/chicken/i);
        expect(result.items[0].amount).toBe(200);

        expect(result.items[0].calories).toBe(448.2);
        expect(result.items[0].protein_g).toBe(47.8);
        expect(result.items[0].fat_g).toBe(25.9);
        expect(result.items[0].carbs_g).toBe(0.1);

        expect(result.items[1].original_name).toMatch(/buckwheat/i);
        expect(result.items[1].amount).toBe(450);

        expect(result.items[1].calories).toBe(416.4);
        expect(result.items[1].protein_g).toBe(15.2);
        expect(result.items[1].fat_g).toBe(2.7);
        expect(result.items[1].carbs_g).toBe(90.5);

        expect(result.totals.calories).toBe(864.6);
        expect(result.totals.protein_g).toBe(63.0);
        expect(result.totals.fat_g).toBe(28.6);
        expect(result.totals.carbs_g).toBe(90.6);

        expect(result.errors.length).toBe(0);
    });

    it("4. Чітке введення декількох продуктів з умовною кількістю: '2 cinnamon rolls and 1 coffee'", async () => {
        const result = await calculateCaloriesFromText("2 cinnamon rolls and 1 coffee", userId);

        expect(result.items.length).toBe(2);
        expect(result.items[0].original_name).toMatch(/cinnamon roll/i);
        expect(result.items[0].amount).toBe(200);

        expect(result.items[0].calories).toBe(643.9);
        expect(result.items[0].protein_g).toBe(8.7);
        expect(result.items[0].fat_g).toBe(22.9);
        expect(result.items[0].carbs_g).toBe(106.2);

        expect(result.items[1].original_name).toMatch(/coffee/i);
        expect(result.items[1].amount).toBe(100);

        expect(result.items[1].calories).toBe(1);
        expect(result.items[1].protein_g).toBe(0.1);
        expect(result.items[1].fat_g).toBe(0);
        expect(result.items[1].carbs_g).toBe(0);

        expect(result.totals.calories).toBe(644.9);
        expect(result.totals.protein_g).toBe(8.8);
        expect(result.totals.fat_g).toBe(22.9);
        expect(result.totals.carbs_g).toBe(106.2);

        expect(result.errors.length).toBe(0);
    });

    it("5. Довге введення з математикою: 'Я з'їв 150 грамів вареної курки, зварив десь двісті грамів рису і з'їв половину'", async () => {
        const result = await calculateCaloriesFromText("Я з'їв 150 грамів вареної курки, зварив десь двісті грамів сухого рису і з'їв половину", userId);

        expect(result.items.length).toBe(2);
        expect(result.items[0].original_name).toMatch(/chicken/i);
        expect(result.items[0].amount).toBe(150);

        expect(result.items[0].calories).toBe(334);
        expect(result.items[0].protein_g).toBe(35.6);
        expect(result.items[0].fat_g).toBe(19.3);
        expect(result.items[0].carbs_g).toBe(0.1);

        expect(result.items[1].original_name).toMatch(/rice/i);
        expect(result.items[1].amount).toBe(350);

        expect(result.items[1].calories).toBe(445.9);
        expect(result.items[1].protein_g).toBe(9.3);
        expect(result.items[1].fat_g).toBe(1);
        expect(result.items[1].carbs_g).toBe(99.5);

        expect(result.totals.calories).toBe(779.9);
        expect(result.totals.protein_g).toBe(44.9);
        expect(result.totals.fat_g).toBe(20.3);
        expect(result.totals.carbs_g).toBe(99.6);

        expect(result.errors.length).toBe(0);
    });

    it("6. Неправильне введення (Абсурдний текст): 'MI BOMBO!!!'", async () => {
        const result = await calculateCaloriesFromText("MI BOMBO!!!", userId);

        expect(result.items.length).toBe(0);

        expect(result.totals.calories).toBe(0);
        expect(result.totals.protein_g).toBe(0);
        expect(result.totals.fat_g).toBe(0);
        expect(result.totals.carbs_g).toBe(0);

        expect(result.errors.length).toBeGreaterThan(0);
    });

    it("7. Питання: 'Скільки калорій в свинині?'", async () => {
        const result = await calculateCaloriesFromText("Скільки калорій в свинині?", userId);

        expect(result.items.length).toBe(1);
        expect(result.items[0].original_name).toMatch(/pork/i);
        expect(result.items[0].amount).toBe(100);

        expect(result.items[0].calories).toBe(236.2);
        expect(result.items[0].protein_g).toBe(26.2);
        expect(result.items[0].fat_g).toBe(14);
        expect(result.items[0].carbs_g).toBe(0);

        expect(result.totals.calories).toBe(236.2);
        expect(result.totals.protein_g).toBe(26.2);
        expect(result.totals.fat_g).toBe(14);
        expect(result.totals.carbs_g).toBe(0);

        expect(result.errors.length).toBe(0);
    });

    it("8. Продукт із смаком: 'Маленька пачка чипсів зі смаком краб'", async () => {
        const result = await calculateCaloriesFromText("Маленька пачка чипсів зі смаком краб", userId);

        expect(result.items.length).toBe(1);
        expect(result.items[0].original_name).toMatch(/potato chips/i);
        expect(result.items[0].amount).toBe(100);

        expect(result.items[0].calories).toBe(541);
        expect(result.items[0].protein_g).toBe(6.4);
        expect(result.items[0].fat_g).toBe(33.9);
        expect(result.items[0].carbs_g).toBe(54.1);

        expect(result.totals.calories).toBe(541);
        expect(result.totals.protein_g).toBe(6.4);
        expect(result.totals.fat_g).toBe(33.9);
        expect(result.totals.carbs_g).toBe(54.1);

        expect(result.errors.length).toBe(0);
    });

    it("9. Екзотичні страви: '700 грамів борщу з буряка'", async () => {
        const result = await calculateCaloriesFromText("700 грамів борщу з буряка", userId);

        expect(result.items.length).toBe(1);
        expect(result.items[0].original_name).toMatch(/borscht/i);
        expect(result.items[0].amount).toBe(700);

        expect(result.items[0].calories).toBe(284.7);
        expect(result.items[0].protein_g).toBe(9.3);
        expect(result.items[0].fat_g).toBe(8.6);
        expect(result.items[0].carbs_g).toBe(45.3);

        expect(result.totals.calories).toBe(284.7);
        expect(result.totals.protein_g).toBe(9.3);
        expect(result.totals.fat_g).toBe(8.6);
        expect(result.totals.carbs_g).toBe(45.3);

        expect(result.errors.length).toBe(0);
    });

    it("10. Введення напоїв: 'Літра Кока-Коли'", async () => {
        const result = await calculateCaloriesFromText("Літра Кока-Коли", userId);

        expect(result.items.length).toBe(1);
        expect(result.items[0].original_name).toMatch(/cola/i);
        expect(result.items[0].amount).toBe(1000);
        expect(result.items[0].unit).toBe("ml");

        expect(result.items[0].calories).toBe(429.1);
        expect(result.items[0].protein_g).toBe(0);
        expect(result.items[0].fat_g).toBe(2.5);
        expect(result.items[0].carbs_g).toBe(104.8);

        expect(result.totals.calories).toBe(429.1);
        expect(result.totals.protein_g).toBe(0);
        expect(result.totals.fat_g).toBe(2.5);
        expect(result.totals.carbs_g).toBe(104.8);

        expect(result.errors.length).toBe(0);
    });

});
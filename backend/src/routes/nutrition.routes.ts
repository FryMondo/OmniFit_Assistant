import {Router} from 'express';
import {calculateCaloriesFromText} from '../services/nutrition.service';
import {
    saveNutritionLog,
    getNutritionLogsByAthleteId,
    getNutritionLogById,
    deleteNutritionLog
} from '../services/db/nutrition_logs.service';

const router = Router();

router.post('/calculate', async (req, res) => {
    try {
        const {text, athlete_id} = req.body;

        if (!text || !athlete_id) {
            return res.status(400).json({error: 'text та athlete_id є обов\'язковими'});
        }

        const result = await calculateCaloriesFromText(text, athlete_id);

        res.json(result);
    } catch (error) {
        console.error("Nutrition Route Error:", error);
        res.status(500).json({error: 'Internal server error'});
    }
});

router.post('/', async (req, res) => {
    try {
        const {athlete_id, meal_category, items} = req.body;

        if (!athlete_id || !items || !Array.isArray(items)) {
            return res.status(400).json({error: 'athlete_id та масив items є обов\'язковими'});
        }

        const savedLogs = [];

        for (const item of items) {
            const mealData = {
                original_name: item.original_name,
                amount: item.amount,
                unit: item.unit,
                protein_g: item.protein_g,
                fat_g: item.fat_g,
                carbs_g: item.carbs_g
            };

            const newLog = await saveNutritionLog({
                athlete_id,
                meal_category: meal_category || null,
                meal_data: mealData,
                total_calories: item.calories
            });

            if (newLog) {
                savedLogs.push(newLog);
            }
        }

        if (savedLogs.length === 0) {
            return res.status(400).json({error: 'Не вдалося зберегти жодного продукту'});
        }

        res.status(201).json(savedLogs);
    } catch (error) {
        console.error("Route Error (Save Nutrition):", error);
        res.status(500).json({error: 'Internal server error'});
    }
});

router.get('/athlete/:athleteId', async (req, res) => {
    try {
        const {athleteId} = req.params;
        const logs = await getNutritionLogsByAthleteId(athleteId);
        res.json(logs);
    } catch (error) {
        console.error("Route Error (Get Nutrition Logs):", error);
        res.status(500).json({error: 'Internal server error'});
    }
});

router.get('/:id', async (req, res) => {
    try {
        const {id} = req.params;
        const log = await getNutritionLogById(id);
        if (!log) return res.status(404).json({error: 'Запис не знайдено'});
        res.json(log);
    } catch (error) {
        console.error("Route Error (Get Specific Nutrition Log):", error);
        res.status(500).json({error: 'Internal server error'});
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const {id} = req.params;
        const success = await deleteNutritionLog(id);
        if (!success) return res.status(400).json({error: 'Не вдалося видалити запис'});
        res.json({message: 'Запис успішно видалено'});
    } catch (error) {
        console.error("Route Error (Delete Nutrition Log):", error);
        res.status(500).json({error: 'Internal server error'});
    }
});

export default router;
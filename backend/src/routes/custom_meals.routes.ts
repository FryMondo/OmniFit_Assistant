import {Router} from 'express';
import {
    createCustomMeal,
    getCustomMealsByAthleteId,
    getCustomMealById,
    updateCustomMeal,
    deleteCustomMeal
} from '../services/db/custom_meals.service';

const router = Router();

router.post('/', async (req, res) => {
    try {
        const mealData = req.body;

        if (!mealData.athlete_id || !mealData.name || !mealData.ingredients || mealData.total_calories === undefined) {
            return res.status(400).json({error: 'athlete_id, name, ingredients та макронутрієнти є обов\'язковими'});
        }

        const newMeal = await createCustomMeal(mealData);

        if (!newMeal) {
            return res.status(400).json({error: 'Не вдалося зберегти власну страву'});
        }

        res.status(201).json(newMeal);
    } catch (error) {
        console.error("Route Error (Create Custom Meal):", error);
        res.status(500).json({error: 'Internal server error'});
    }
});

router.get('/athlete/:athleteId', async (req, res) => {
    try {
        const {athleteId} = req.params;
        const meals = await getCustomMealsByAthleteId(athleteId);

        res.json(meals);
    } catch (error) {
        console.error("Route Error (Get Custom Meals):", error);
        res.status(500).json({error: 'Internal server error'});
    }
});

router.get('/:id', async (req, res) => {
    try {
        const {id} = req.params;
        const meal = await getCustomMealById(id);

        if (!meal) {
            return res.status(404).json({error: 'Страву не знайдено'});
        }

        res.json(meal);
    } catch (error) {
        console.error("Route Error (Get Specific Custom Meal):", error);
        res.status(500).json({error: 'Internal server error'});
    }
});

router.put('/:id', async (req, res) => {
    try {
        const {id} = req.params;
        const updates = req.body;

        const updatedMeal = await updateCustomMeal(id, updates);

        if (!updatedMeal) {
            return res.status(400).json({error: 'Не вдалося оновити страву'});
        }

        res.json(updatedMeal);
    } catch (error) {
        console.error("Route Error (Update Custom Meal):", error);
        res.status(500).json({error: 'Internal server error'});
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const {id} = req.params;
        const success = await deleteCustomMeal(id);

        if (!success) {
            return res.status(400).json({error: 'Не вдалося видалити страву'});
        }

        res.json({message: 'Страву успішно видалено'});
    } catch (error) {
        console.error("Route Error (Delete Custom Meal):", error);
        res.status(500).json({error: 'Internal server error'});
    }
});

export default router;
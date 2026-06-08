import {Router} from 'express';
import {parseFitnessVoiceInput, generateWorkoutPlan} from '../services/fitness.service';
import {
    saveWorkoutPlan,
    getWorkoutsByAthleteId,
    getWorkoutById,
    updateWorkoutPlan,
    deleteWorkoutPlan
} from '../services/db/workout.service';

const router = Router();

router.post('/generate', async (req, res) => {
    try {
        const {text} = req.body;

        if (!text) {
            return res.status(400).json({error: 'Text is required'});
        }

        const extractedInput = await parseFitnessVoiceInput(text);

        if (!extractedInput) {
            return res.status(500).json({error: 'Failed to parse voice input'});
        }

        const finalPlan = await generateWorkoutPlan(extractedInput);
        res.json(finalPlan);

    } catch (error: any) {
        console.error("Workout Route Error:", error);

        if (error.message === "INVALID_FITNESS_QUERY") {
            return res.status(400).json({
                error: "INVALID_FITNESS_QUERY",
                message: "Запит не зрозумілий. Будь ласка, скажіть, що ви хочете отримати програму тренувань, вкажіть вашу ціль, досвід та наявність травм."
            });
        }

        if (error.message === "MISSING_INJURY_INFO") {
            return res.status(400).json({
                error: "MISSING_INJURY_INFO",
                message: "Безпека понад усе! Будь ласка, вкажіть, чи є у вас травми (наприклад, скажіть: 'в мене болить коліно' або 'травм немає')."
            });
        }

        res.status(500).json({error: 'Internal server error'});
    }
});

router.post('/', async (req, res) => {
    try {
        const {athlete_id, plan_name, workout_data} = req.body;

        if (!athlete_id || !plan_name || !workout_data) {
            return res.status(400).json({error: 'athlete_id, plan_name та workout_data є обов\'язковими'});
        }

        const newWorkout = await saveWorkoutPlan({athlete_id, plan_name, workout_data});

        if (!newWorkout) {
            return res.status(400).json({error: 'Не вдалося зберегти план тренувань'});
        }

        res.status(201).json(newWorkout);
    } catch (error) {
        console.error("Route Error (Save Workout):", error);
        res.status(500).json({error: 'Internal server error'});
    }
});

router.get('/athlete/:athleteId', async (req, res) => {
    try {
        const {athleteId} = req.params;
        const workouts = await getWorkoutsByAthleteId(athleteId);

        res.json(workouts);
    } catch (error) {
        console.error("Route Error (Get Workouts):", error);
        res.status(500).json({error: 'Internal server error'});
    }
});

router.get('/:id', async (req, res) => {
    try {
        const {id} = req.params;
        const workout = await getWorkoutById(id);

        if (!workout) {
            return res.status(404).json({error: 'План тренувань не знайдено'});
        }

        res.json(workout);
    } catch (error) {
        console.error("Route Error (Get Specific Workout):", error);
        res.status(500).json({error: 'Internal server error'});
    }
});

router.put('/:id', async (req, res) => {
    try {
        const {id} = req.params;
        const {plan_name, workout_data} = req.body;

        const updatedWorkout = await updateWorkoutPlan(id, {plan_name, workout_data});

        if (!updatedWorkout) {
            return res.status(400).json({error: 'Не вдалося оновити план тренувань'});
        }

        res.json(updatedWorkout);
    } catch (error) {
        console.error("Route Error (Update Workout):", error);
        res.status(500).json({error: 'Internal server error'});
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const {id} = req.params;
        const success = await deleteWorkoutPlan(id);

        if (!success) {
            return res.status(400).json({error: 'Не вдалося видалити план тренувань'});
        }

        res.json({message: 'План тренувань успішно видалено'});
    } catch (error) {
        console.error("Route Error (Delete Workout):", error);
        res.status(500).json({error: 'Internal server error'});
    }
});

export default router;
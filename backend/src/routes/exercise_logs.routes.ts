import {Router} from 'express';
import {
    logExercise,
    getExerciseLogsByAthleteId,
    getProgressForExercise,
    updateExerciseLog,
    deleteExerciseLog
} from '../services/db/exercise_logs.service';

const router = Router();

router.post('/', async (req, res) => {
    try {
        const logData = req.body;

        if (!logData.athlete_id || !logData.exercise_name || logData.reps === undefined) {
            return res.status(400).json({error: 'athlete_id, exercise_name та reps є обов\'язковими'});
        }

        const newLog = await logExercise(logData);

        if (!newLog) {
            return res.status(400).json({error: 'Не вдалося зберегти запис вправи'});
        }

        res.status(201).json(newLog);
    } catch (error) {
        console.error("Route Error (Log Exercise):", error);
        res.status(500).json({error: 'Internal server error'});
    }
});

router.get('/athlete/:athleteId', async (req, res) => {
    try {
        const {athleteId} = req.params;
        const logs = await getExerciseLogsByAthleteId(athleteId);

        res.json(logs);
    } catch (error) {
        console.error("Route Error (Get Exercise Logs):", error);
        res.status(500).json({error: 'Internal server error'});
    }
});

router.get('/athlete/:athleteId/progress/:exerciseName', async (req, res) => {
    try {
        const {athleteId, exerciseName} = req.params;
        const progress = await getProgressForExercise(athleteId, exerciseName);

        res.json(progress);
    } catch (error) {
        console.error("Route Error (Get Exercise Progress):", error);
        res.status(500).json({error: 'Internal server error'});
    }
});

router.put('/:id', async (req, res) => {
    try {
        const {id} = req.params;
        const updates = req.body;

        const updatedLog = await updateExerciseLog(id, updates);

        if (!updatedLog) {
            return res.status(400).json({error: 'Не вдалося оновити запис'});
        }

        res.json(updatedLog);
    } catch (error) {
        console.error("Route Error (Update Exercise Log):", error);
        res.status(500).json({error: 'Internal server error'});
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const {id} = req.params;
        const success = await deleteExerciseLog(id);

        if (!success) {
            return res.status(400).json({error: 'Не вдалося видалити запис'});
        }

        res.json({message: 'Запис успішно видалено'});
    } catch (error) {
        console.error("Route Error (Delete Exercise Log):", error);
        res.status(500).json({error: 'Internal server error'});
    }
});

export default router;
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import {calculateCaloriesFromText} from './services/nutrition.service';
import {parseFitnessVoiceInput, generateWorkoutPlan} from './services/fitness.service';

dotenv.config();

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.post('/api/nutrition', async (req, res) => {
    try {
        const {text} = req.body;
        if (!text) return res.status(400).json({error: 'Text is required'});

        const result = await calculateCaloriesFromText(text);
        res.json(result);
    } catch (error) {
        res.status(500).json({error: 'Internal server error'});
    }
});

app.post('/api/workout', async (req, res) => {
    try {
        const {text} = req.body;
        if (!text) return res.status(400).json({error: 'Text is required'});

        const extractedInput = await parseFitnessVoiceInput(text);

        if (!extractedInput) {
            return res.status(500).json({error: 'Failed to parse voice input'});
        }

        const finalPlan = await generateWorkoutPlan(extractedInput);
        res.json(finalPlan);
    } catch (error: any) {
        if (error.message === "INVALID_FITNESS_QUERY") {
            return res.status(400).json({
                error: "INVALID_FITNESS_QUERY",
                message: "Запит не зрозумілий. Будь ласка, скажіть, що ви хочете отримати програму тренувань, вкажіть вашу ціль, досвід та наявність травм."
            })
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
app.listen(PORT, () => {
    console.log(`Cервер запущено на http://localhost:${PORT}`);
});
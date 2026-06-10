import {Router} from 'express';
import {getMetricsByAthleteId, upsertAthleteMetrics} from '../services/db/athlete_metrics.service';
import {calculateTargetMacros} from '../services/macro_calculator.service';

const router = Router();

router.get('/:athleteId', async (req, res) => {
    try {
        const {athleteId} = req.params;
        const metrics = await getMetricsByAthleteId(athleteId);

        if (!metrics) {
            return res.status(404).json({message: 'Фізичні показники не знайдено'});
        }

        res.json(metrics);
    } catch (error) {
        console.error("Route Error (Get Metrics):", error);
        res.status(500).json({error: 'Internal server error'});
    }
});

router.put('/:athleteId', async (req, res) => {
    try {
        const {athleteId} = req.params;
        const {activity, goal, ...metricsData} = req.body;

        if (goal) {
            (metricsData as any).goal = goal;
        }

        if (
            activity &&
            goal &&
            metricsData.gender &&
            metricsData.date_of_birth &&
            metricsData.weight_kg &&
            metricsData.height_cm
        ) {
            const calculatedMacros = calculateTargetMacros(
                metricsData.gender,
                metricsData.date_of_birth,
                metricsData.weight_kg,
                metricsData.height_cm,
                Number(activity),
                goal
            );

            Object.assign(metricsData, calculatedMacros);
        }

        const updatedMetrics = await upsertAthleteMetrics(athleteId, metricsData);

        if (!updatedMetrics) {
            return res.status(400).json({error: 'Не вдалося зберегти фізичні показники'});
        }

        res.json(updatedMetrics);
    } catch (error) {
        console.error("Route Error (Upsert Metrics):", error);
        res.status(500).json({error: 'Internal server error'});
    }
});

export default router;
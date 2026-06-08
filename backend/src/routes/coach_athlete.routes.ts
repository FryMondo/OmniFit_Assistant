import {Router} from 'express';
import {
    sendRelationRequest,
    getAthletesByCoachId,
    getCoachesByAthleteId,
    updateRelationStatus,
    deleteRelation
} from '../services/db/coach_athlete.service';

const router = Router();

router.post('/', async (req, res) => {
    try {
        const {coach_id, athlete_id} = req.body;

        if (!coach_id || !athlete_id) {
            return res.status(400).json({error: 'coach_id та athlete_id є обов\'язковими'});
        }

        const newRelation = await sendRelationRequest(coach_id, athlete_id);

        if (!newRelation) {
            return res.status(400).json({error: 'Не вдалося створити заявку (можливо, вона вже існує)'});
        }

        res.status(201).json(newRelation);
    } catch (error) {
        console.error("Route Error (Send Relation Request):", error);
        res.status(500).json({error: 'Internal server error'});
    }
});

router.get('/coach/:coachId', async (req, res) => {
    try {
        const {coachId} = req.params;
        const relations = await getAthletesByCoachId(coachId);

        res.json(relations);
    } catch (error) {
        console.error("Route Error (Get Athletes):", error);
        res.status(500).json({error: 'Internal server error'});
    }
});

router.get('/athlete/:athleteId', async (req, res) => {
    try {
        const {athleteId} = req.params;
        const relations = await getCoachesByAthleteId(athleteId);

        res.json(relations);
    } catch (error) {
        console.error("Route Error (Get Coaches):", error);
        res.status(500).json({error: 'Internal server error'});
    }
});

router.patch('/:id/status', async (req, res) => {
    try {
        const {id} = req.params;
        const {status} = req.body;

        if (!['pending', 'active', 'rejected'].includes(status)) {
            return res.status(400).json({error: 'Некоректний статус'});
        }

        const updatedRelation = await updateRelationStatus(id, status);

        if (!updatedRelation) {
            return res.status(400).json({error: 'Не вдалося оновити статус'});
        }

        res.json(updatedRelation);
    } catch (error) {
        console.error("Route Error (Update Relation Status):", error);
        res.status(500).json({error: 'Internal server error'});
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const {id} = req.params;
        const success = await deleteRelation(id);

        if (!success) {
            return res.status(400).json({error: 'Не вдалося видалити зв\'язок'});
        }

        res.json({message: 'Зв\'язок успішно видалено'});
    } catch (error) {
        console.error("Route Error (Delete Relation):", error);
        res.status(500).json({error: 'Internal server error'});
    }
});

export default router;
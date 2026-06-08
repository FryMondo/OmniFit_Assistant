import {Router} from 'express';
import {
    createGym,
    getAllGyms,
    getGymById,
    updateGym,
    deleteGym
} from '../services/db/gyms.service';

const router = Router();

router.post('/', async (req, res) => {
    try {
        const gymData = req.body;

        if (!gymData.manager_id || !gymData.name) {
            return res.status(400).json({error: 'manager_id та name є обов\'язковими'});
        }

        if (!gymData.schedule) {
            gymData.schedule = {};
        }

        const newGym = await createGym(gymData);

        if (!newGym) {
            return res.status(400).json({error: 'Не вдалося створити зал'});
        }

        res.status(201).json(newGym);
    } catch (error) {
        console.error("Route Error (Create Gym):", error);
        res.status(500).json({error: 'Internal server error'});
    }
});

router.get('/', async (req, res) => {
    try {
        const gyms = await getAllGyms();
        res.json(gyms);
    } catch (error) {
        console.error("Route Error (Get Gyms):", error);
        res.status(500).json({error: 'Internal server error'});
    }
});

router.get('/:id', async (req, res) => {
    try {
        const {id} = req.params;
        const gym = await getGymById(id);

        if (!gym) {
            return res.status(404).json({error: 'Зал не знайдено'});
        }

        res.json(gym);
    } catch (error) {
        console.error("Route Error (Get Gym By Id):", error);
        res.status(500).json({error: 'Internal server error'});
    }
});

router.put('/:id', async (req, res) => {
    try {
        const {id} = req.params;
        const updates = req.body;

        if (updates.total_score !== undefined) {
            delete updates.total_score;
        }
        if (updates.total_votes !== undefined) {
            delete updates.total_votes;
        }

        const updatedGym = await updateGym(id, updates);

        if (!updatedGym) {
            return res.status(400).json({error: 'Не вдалося оновити зал'});
        }

        res.json(updatedGym);
    } catch (error) {
        console.error("Route Error (Update Gym):", error);
        res.status(500).json({error: 'Internal server error'});
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const {id} = req.params;
        const success = await deleteGym(id);

        if (!success) {
            return res.status(400).json({error: 'Не вдалося видалити зал'});
        }

        res.json({message: 'Зал успішно видалено'});
    } catch (error) {
        console.error("Route Error (Delete Gym):", error);
        res.status(500).json({error: 'Internal server error'});
    }
});

export default router;
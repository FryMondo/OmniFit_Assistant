import {Router} from 'express';
import {getProfileById, getProfileByUsername, updateProfile} from "../services/db/profile.service";

const router = Router();

router.get('/search/:username', async (req, res) => {
    try {
        const username = req.params.username;
        const profile = await getProfileByUsername(username);

        if (!profile) {
            return res.status(404).json({error: 'Користувача з таким username не знайдено'});
        }

        res.json(profile);
    } catch (error) {
        res.status(500).json({error: 'Internal server error'});
    }
});

router.get('/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const profile = await getProfileById(userId);

        if (!profile) {
            return res.status(404).json({error: 'Профіль не знайдено'});
        }

        res.json(profile);
    } catch (error) {
        res.status(500).json({error: 'Internal server error'});
    }
});

router.put('/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const updates = req.body;

        const updatedProfile = await updateProfile(userId, updates);

        if (!updatedProfile) {
            return res.status(400).json({error: 'Не вдалося оновити профіль'});
        }

        res.json(updatedProfile);
    } catch (error) {
        res.status(500).json({error: 'Internal server error'});
    }
});

export default router;
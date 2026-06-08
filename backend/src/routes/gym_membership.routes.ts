import {Router} from 'express';
import {
    joinGym,
    getMembersByGymId,
    getPendingStaffRequests,
    getGymsByUserId,
    updateMembershipType,
    updateMembershipStatus,
    leaveGym
} from '../services/db/gym_membership.service';

const router = Router();

router.post('/', async (req, res) => {
    try {
        const {gym_id, user_id, user_type, status} = req.body;

        if (!gym_id || !user_id || !user_type) {
            return res.status(400).json({error: 'gym_id, user_id та user_type є обов\'язковими'});
        }

        if (!['staff', 'client'].includes(user_type)) {
            return res.status(400).json({error: 'user_type має бути staff або client'});
        }

        if (status && !['pending', 'active', 'rejected'].includes(status)) {
            return res.status(400).json({error: 'Недійсний статус заявки'});
        }

        const newMembership = await joinGym(gym_id, user_id, user_type, status);

        if (!newMembership) {
            return res.status(400).json({error: 'Не вдалося додати користувача до залу (можливо, він вже там є)'});
        }

        res.status(201).json(newMembership);
    } catch (error) {
        console.error("Route Error (Join Gym):", error);
        res.status(500).json({error: 'Internal server error'});
    }
});

router.get('/gym/:gymId', async (req, res) => {
    try {
        const {gymId} = req.params;
        const members = await getMembersByGymId(gymId);
        res.json(members);
    } catch (error) {
        console.error("Route Error (Get Gym Members):", error);
        res.status(500).json({error: 'Internal server error'});
    }
});

router.get('/gym/:gymId/requests', async (req, res) => {
    try {
        const {gymId} = req.params;
        const requests = await getPendingStaffRequests(gymId);
        res.json(requests);
    } catch (error) {
        console.error("Route Error (Get Pending Staff Requests):", error);
        res.status(500).json({error: 'Internal server error'});
    }
});

router.get('/user/:userId', async (req, res) => {
    try {
        const {userId} = req.params;
        const gyms = await getGymsByUserId(userId);
        res.json(gyms);
    } catch (error) {
        console.error("Route Error (Get User Gyms):", error);
        res.status(500).json({error: 'Internal server error'});
    }
});

router.patch('/:id/type', async (req, res) => {
    try {
        const {id} = req.params;
        const {user_type} = req.body;

        if (!['staff', 'client'].includes(user_type)) {
            return res.status(400).json({error: 'user_type має бути staff або client'});
        }

        const updatedMembership = await updateMembershipType(id, user_type);

        if (!updatedMembership) {
            return res.status(400).json({error: 'Не вдалося оновити роль у залі'});
        }

        res.json(updatedMembership);
    } catch (error) {
        console.error("Route Error (Update Membership Type):", error);
        res.status(500).json({error: 'Internal server error'});
    }
});

router.patch('/:id/status', async (req, res) => {
    try {
        const {id} = req.params;
        const {status} = req.body;

        if (!['pending', 'active', 'rejected'].includes(status)) {
            return res.status(400).json({error: 'Недійсний статус'});
        }

        const updatedMembership = await updateMembershipStatus(id, status);

        if (!updatedMembership) {
            return res.status(400).json({error: 'Не вдалося оновити статус заявки'});
        }

        res.json(updatedMembership);
    } catch (error) {
        console.error("Route Error (Update Membership Status):", error);
        res.status(500).json({error: 'Internal server error'});
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const {id} = req.params;
        const success = await leaveGym(id);

        if (!success) {
            return res.status(400).json({error: 'Не вдалося видалити користувача із залу'});
        }

        res.json({message: 'Користувача успішно видалено із залу'});
    } catch (error) {
        console.error("Route Error (Leave Gym):", error);
        res.status(500).json({error: 'Internal server error'});
    }
});

export default router;
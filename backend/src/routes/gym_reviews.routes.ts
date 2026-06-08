import {Router} from 'express';
import {
    addReview,
    getReviewsByGymId,
    getUserReviewForGym
} from '../services/db/gym_reviews.service';

const router = Router();

router.post('/', async (req, res) => {
    try {
        const {gym_id, user_id, score} = req.body;

        if (!gym_id || !user_id || score === undefined) {
            return res.status(400).json({error: 'gym_id, user_id та score є обов\'язковими'});
        }

        if (typeof score !== 'number' || score < 1 || score > 5) {
            return res.status(400).json({error: 'Оцінка має бути числом від 1 до 5'});
        }

        const {review, error} = await addReview(gym_id, user_id, score);

        if (error) {
            if (error.includes('вже залишали')) {
                return res.status(409).json({error});
            }
            return res.status(400).json({error});
        }

        res.status(201).json(review);
    } catch (error) {
        console.error("Route Error (Add Review):", error);
        res.status(500).json({error: 'Internal server error'});
    }
});

router.get('/gym/:gym_id', async (req, res) => {
    try {
        const {gym_id} = req.params;
        const reviews = await getReviewsByGymId(gym_id);
        res.json(reviews);
    } catch (error) {
        console.error("Route Error (Get Gym Reviews):", error);
        res.status(500).json({error: 'Internal server error'});
    }
});

router.get('/check/:gym_id/:user_id', async (req, res) => {
    try {
        const {gym_id, user_id} = req.params;
        const review = await getUserReviewForGym(gym_id, user_id);

        if (review) {
            res.json({hasVoted: true, score: review.score});
        } else {
            res.json({hasVoted: false});
        }
    } catch (error) {
        console.error("Route Error (Check User Review):", error);
        res.status(500).json({error: 'Internal server error'});
    }
});

export default router;
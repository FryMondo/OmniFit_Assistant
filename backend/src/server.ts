import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';

import profileRoutes from "./routes/profile.routes";
import nutritionRoutes from "./routes/nutrition.routes";
import workoutRoutes from "./routes/workout.routes";
import metricRoutes from "./routes/athlete_metrics.routes";
import gymRoutes from "./routes/gyms.routes";
import equipmentRoutes from "./routes/gym_equipment.routes";
import relationRoutes from "./routes/coach_athlete.routes";
import membershipRoutes from "./routes/gym_membership.routes";
import customMealRoutes from "./routes/custom_meals.routes";
import exerciseLogRotes from "./routes/exercise_logs.routes";
import authRoutes from "./routes/auth.routes";
import gymReviewsRoutes from "./routes/gym_reviews.routes";

dotenv.config();

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/nutrition', nutritionRoutes);
app.use('/api/gym-reviews', gymReviewsRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/metrics', metricRoutes);
app.use('/api/gyms', gymRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/relations', relationRoutes);
app.use('/api/memberships', membershipRoutes);
app.use('/api/custom-meals', customMealRoutes);
app.use('/api/exercise-logs', exerciseLogRotes);

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Сервер запущено на http://localhost:${PORT}`);
});
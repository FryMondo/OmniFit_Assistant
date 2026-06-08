import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export async function generateNutritionFromText(text: string) {
    try {
        const response = await apiClient.post('/nutrition/calculate', {text});
        return response.data;
    } catch (error: any) {
        handleApiError(error, 'nutrition');
    }
}

export async function generateWorkoutFromText(text: string) {
    try {
        const response = await apiClient.post('/workouts/generate', {text});
        return response.data;
    } catch (error: any) {
        handleApiError(error, 'workout');
    }
}

export async function registerUser(userData: any) {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
}

export async function loginUser(credentials: any) {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
}

function handleApiError(error: any, context: string) {
    if (error.response && error.response.data && error.response.data.message) {
        throw new Error(error.response.data.message);
    }
    console.error(`Помилка API (${context}):`, error);
    throw new Error("Не вдалося отримати відповідь від сервера. Перевірте, чи запущено бекенд.");
}
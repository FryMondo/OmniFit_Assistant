import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

export async function processVoiceRequest(mode: 'nutrition' | 'workout', text: string) {
    try {
        const response = await axios.post(`${API_BASE_URL}/${mode}`, {text});
        return response.data;
    } catch (error: any) {
        if (error.response && error.response.data && error.response.data.message) {
            throw new Error(error.response.data.message);
        }

        console.error(`Помилка API (${mode}):`, error);
        throw new Error("Не вдалося отримати відповідь від сервера. Перевірте, чи запущено бекенд.");
    }
}
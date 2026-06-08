import React, {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {useAuth} from '../../context/AuthContext';
import './MacroCalculator.css';

const MacroCalculator: React.FC = () => {
    const navigate = useNavigate();
    const {user, session} = useAuth();
    const API_BASE_URL = import.meta.env.VITE_API_URL;

    const [gender, setGender] = useState<'male' | 'female'>('male');
    const [dob, setDob] = useState<string>('');
    const [weight, setWeight] = useState<number | ''>('');
    const [height, setHeight] = useState<number | ''>('');

    const [activity, setActivity] = useState<number>(1.2);
    const [goal, setGoal] = useState<'lose' | 'maintain' | 'gain'>('maintain');

    const [results, setResults] = useState<{
        calories: number;
        protein: number;
        fat: number;
        carbs: number
    } | null>(null);

    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!user || !session) return;

        const fetchMetrics = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/metrics/${user.id}`, {
                    headers: {'Authorization': `Bearer ${session.access_token}`}
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data.gender) setGender(data.gender);
                    if (data.date_of_birth) setDob(data.date_of_birth);
                    if (data.weight_kg) setWeight(data.weight_kg);
                    if (data.height_cm) setHeight(data.height_cm);

                    if (data.target_calories) {
                        setResults({
                            calories: Math.round(data.target_calories),
                            protein: Math.round(data.target_protein),
                            fat: Math.round(data.target_fat),
                            carbs: Math.round(data.target_carbs)
                        });
                    }
                }
            } catch (error) {
                console.error("Помилка завантаження метрик:", error);
            }
        };

        fetchMetrics();
    }, [user, session, API_BASE_URL]);

    const handleCalculateAndSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !session || !dob || !weight || !height) return;

        setIsSaving(true);

        try {
            const res = await fetch(`${API_BASE_URL}/metrics/${user.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    gender,
                    date_of_birth: dob,
                    weight_kg: weight,
                    height_cm: height,
                    activity,
                    goal
                })
            });

            if (!res.ok) throw new Error('Помилка розрахунку та збереження');

            const updatedMetrics = await res.json();

            setResults({
                calories: Math.round(updatedMetrics.target_calories),
                protein: Math.round(updatedMetrics.target_protein),
                fat: Math.round(updatedMetrics.target_fat),
                carbs: Math.round(updatedMetrics.target_carbs)
            });

            alert('Ваша норма успішно розрахована та збережена в профілі!');
        } catch (error) {
            console.error("Помилка:", error);
            alert("Не вдалося розрахувати та зберегти дані.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="calculator-page">
            <div className="calc-content">
                <header className="calc-header">
                    <button className="back-btn" onClick={() => navigate('/nutrition')}>‹ Назад</button>
                    <h1>Розрахунок КБЖВ</h1>
                    <div className="header-spacer"></div>
                </header>

                <form className="calc-form" onSubmit={handleCalculateAndSave}>

                    <div className="input-group">
                        <label>Стать</label>
                        <div className="radio-group">
                            <label className={`radio-btn ${gender === 'male' ? 'active' : ''}`}>
                                <input type="radio" name="gender" checked={gender === 'male'}
                                       onChange={() => setGender('male')}/>
                                Чоловік
                            </label>
                            <label className={`radio-btn ${gender === 'female' ? 'active' : ''}`}>
                                <input type="radio" name="gender" checked={gender === 'female'}
                                       onChange={() => setGender('female')}/>
                                Жінка
                            </label>
                        </div>
                    </div>

                    <div className="input-row">
                        <div className="input-group">
                            <label>Дата народження</label>
                            <input type="date" required value={dob}
                                   onChange={(e) => setDob(e.target.value)}/>
                        </div>
                        <div className="input-group">
                            <label>Вага (кг)</label>
                            <input type="number" min="30" max="300" required value={weight}
                                   onChange={(e) => setWeight(Number(e.target.value) || '')}/>
                        </div>
                        <div className="input-group">
                            <label>Зріст (см)</label>
                            <input type="number" min="100" max="250" required value={height}
                                   onChange={(e) => setHeight(Number(e.target.value) || '')}/>
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Рівень активності</label>
                        <select value={activity} onChange={(e) => setActivity(Number(e.target.value))}>
                            <option value={1.2}>Сидячий (мінімум руху)</option>
                            <option value={1.375}>Легка (тренування 1-3 рази/тиждень)</option>
                            <option value={1.55}>Помірна (тренування 3-5 разів/тиждень)</option>
                            <option value={1.725}>Висока (тренування 6-7 разів/тиждень)</option>
                            <option value={1.9}>Екстремальна (важка фіз. робота)</option>
                        </select>
                    </div>

                    <div className="input-group">
                        <label>Ваша мета</label>
                        <select value={goal} onChange={(e) => setGoal(e.target.value as any)}>
                            <option value="lose">Схуднення</option>
                            <option value="maintain">Підтримка ваги</option>
                            <option value="gain">Набір маси</option>
                        </select>
                    </div>

                    <button type="submit" className="calculate-btn" disabled={isSaving}>
                        {isSaving ? 'Обробка...' : 'Розрахувати та зберегти'}
                    </button>
                </form>

                {results && (
                    <div className="calc-results">
                        <h2>Ваша добова норма</h2>
                        <div className="results-grid">
                            <div className="result-card highlight">
                                <span className="res-value">{results.calories}</span>
                                <span className="res-label">Ккал</span>
                            </div>
                            <div className="result-card">
                                <span className="res-value">{results.protein} г</span>
                                <span className="res-label">Білки</span>
                            </div>
                            <div className="result-card">
                                <span className="res-value">{results.fat} г</span>
                                <span className="res-label">Жири</span>
                            </div>
                            <div className="result-card">
                                <span className="res-value">{results.carbs} г</span>
                                <span className="res-label">Вуглеводи</span>
                            </div>
                        </div>

                        <button
                            className="save-btn"
                            onClick={() => navigate('/nutrition')}
                        >
                            Повернутися до щоденника
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MacroCalculator;
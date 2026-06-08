import React, {useState, useEffect, useRef} from 'react';
import {useNavigate} from 'react-router-dom';
import {useAuth} from '../../context/AuthContext';
import './ProgramGenerator.css';

import micIcon from '../../assets/mic-icon.png';

const ProgramGenerator: React.FC = () => {
    const navigate = useNavigate();
    const {user, session} = useAuth();
    const API_BASE_URL = import.meta.env.VITE_API_URL;

    const [quickPrompt, setQuickPrompt] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const recognitionRef = useRef<any>(null);

    const [goal, setGoal] = useState('muscle_gain');
    const [experience, setExperience] = useState('intermediate');
    const [daysPerWeek, setDaysPerWeek] = useState(3);
    const [location, setLocation] = useState('gym');
    const [equipment, setEquipment] = useState('');
    const [injuries, setInjuries] = useState('');
    const [extraInfo, setExtraInfo] = useState('');

    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        if (!user || !session) return;

        const fetchUserData = async () => {
            const headers = {'Authorization': `Bearer ${session.access_token}`};

            try {
                const metricsRes = await fetch(`${API_BASE_URL}/metrics/${user.id}`, {headers});
                if (metricsRes.ok) {
                    const metrics = await metricsRes.json();
                    if (metrics.experience_level) setExperience(metrics.experience_level);
                    if (metrics.injuries && metrics.injuries.length > 0) {
                        setInjuries(metrics.injuries.join(', '));
                    }
                }

                const membershipsRes = await fetch(`${API_BASE_URL}/memberships/user/${user.id}`, {headers});
                if (membershipsRes.ok) {
                    const memberships = await membershipsRes.json();
                    const activeGym = memberships.find((m: any) => m.status === 'active');

                    if (activeGym) {
                        setLocation('gym');
                        const eqRes = await fetch(`${API_BASE_URL}/equipment/gym/${activeGym.gym_id}`, {headers});
                        if (eqRes.ok) {
                            const eqList = await eqRes.json();
                            if (eqList.length > 0) {
                                const eqString = eqList.map((eq: any) => eq.equipment_name).join(', ');
                                setEquipment(eqString);
                            }
                        }
                    }
                }
            } catch (error) {
                console.error("Помилка автозаповнення даних:", error);
            }
        };

        fetchUserData();
    }, [user, session, API_BASE_URL]);

    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'uk-UA';

            recognitionRef.current.onresult = (event: any) => {
                let currentTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    currentTranscript += event.results[i][0].transcript;
                }
                setQuickPrompt(currentTranscript);
            };

            recognitionRef.current.onerror = () => setIsRecording(false);
        }
    }, []);

    const startRecording = () => {
        if (recognitionRef.current) {
            setQuickPrompt('');
            setIsRecording(true);
            recognitionRef.current.start();
        }
    };

    const stopRecording = () => {
        if (recognitionRef.current && isRecording) {
            setIsRecording(false);
            recognitionRef.current.stop();
        }
    };

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !session) return;
        setIsGenerating(true);

        let finalPrompt = quickPrompt.trim();

        if (!finalPrompt) {
            finalPrompt = `Створи програму тренувань. Ціль: ${goal}. Досвід: ${experience}. Днів на тиждень: ${daysPerWeek}. Локація: ${location}. `;
            if (equipment) finalPrompt += `Доступний інвентар: ${equipment}. `;
            if (injuries) finalPrompt += `Мої травми/обмеження: ${injuries}. `;
            else finalPrompt += `Травм немає. `;
            if (extraInfo) finalPrompt += `Додаткові побажання: ${extraInfo}.`;
        }

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
        };

        try {
            const genRes = await fetch(`${API_BASE_URL}/workouts/generate`, {
                method: 'POST',
                headers,
                body: JSON.stringify({text: finalPrompt})
            });

            if (!genRes.ok) {
                const errorData = await genRes.json();
                throw new Error(errorData.message || 'Помилка генерації плану');
            }

            const generatedPlan = await genRes.json();

            const saveRes = await fetch(`${API_BASE_URL}/workouts`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    athlete_id: user.id,
                    plan_name: generatedPlan.plan_name || 'Нова програма тренувань',
                    workout_data: generatedPlan
                })
            });

            if (!saveRes.ok) throw new Error('Не вдалося зберегти програму');

            navigate('/workouts');

        } catch (error: any) {
            console.error("Помилка:", error);
            alert(error.message || "Сталася помилка під час генерації.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="generator-page">
            <div className="generator-content">

                <header className="gen-header">
                    <button className="back-btn" onClick={() => navigate(-1)}>‹ Назад</button>
                    <h1>Генератор програм</h1>
                    <div className="header-spacer"></div>
                </header>

                <section className="quick-prompt-section">
                    <p className="section-subtitle">Опишіть ваше ідеальне тренування довільно:</p>
                    <div
                        className={`input-capsule ${isRecording ? 'recording-active' : ''} ${isGenerating ? 'processing' : ''}`}>
                        <input
                            type="text"
                            className="capsule-input"
                            placeholder={isGenerating ? "Gemini створює магію..." : (isRecording ? "Слухаю..." : "Напр: Напиши план на турніках на 3 дні...")}
                            value={quickPrompt}
                            onChange={(e) => setQuickPrompt(e.target.value)}
                            disabled={isGenerating}
                        />
                        <button
                            className={`capsule-mic-btn ${isRecording ? 'recording' : ''}`}
                            onMouseDown={startRecording}
                            onMouseUp={stopRecording}
                            onMouseLeave={stopRecording}
                            onTouchStart={startRecording}
                            onTouchEnd={stopRecording}
                            disabled={isGenerating}
                        >
                            <img src={micIcon} alt="Голосовий ввід"/>
                        </button>
                    </div>
                </section>

                <div className="divider-container">
                    <span className="divider-line"></span>
                    <span className="divider-text">АБО ДЕТАЛЬНЕ НАЛАШТУВАННЯ</span>
                    <span className="divider-line"></span>
                </div>

                <form className="detailed-form" onSubmit={handleGenerate}>

                    <div className="input-row">
                        <div className="input-group">
                            <label>Ваша ціль</label>
                            <select value={goal} onChange={(e) => setGoal(e.target.value)} disabled={isGenerating}>
                                <option value="weight_loss">Схуднення / Рельєф</option>
                                <option value="muscle_gain">Набір м'язової маси</option>
                                <option value="maintenance">Підтримка форми</option>
                                <option value="strength">Розвиток сили</option>
                            </select>
                        </div>
                        <div className="input-group">
                            <label>Досвід тренувань</label>
                            <select value={experience} onChange={(e) => setExperience(e.target.value)}
                                    disabled={isGenerating}>
                                <option value="beginner">Новачок (до 1 року)</option>
                                <option value="intermediate">Середній (1-3 роки)</option>
                                <option value="advanced">Просунутий (3+ роки)</option>
                            </select>
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Кількість днів на тиждень: <strong>{daysPerWeek}</strong></label>
                        <div className="days-selector">
                            {[1, 2, 3, 4, 5, 6, 7].map(day => (
                                <button
                                    key={day}
                                    type="button"
                                    className={`day-btn ${daysPerWeek === day ? 'active' : ''}`}
                                    onClick={() => setDaysPerWeek(day)}
                                    disabled={isGenerating}
                                >
                                    {day}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Локація</label>
                        <select value={location} onChange={(e) => setLocation(e.target.value)} disabled={isGenerating}>
                            <option value="gym">Тренажерний зал</option>
                            <option value="home">Вдома</option>
                            <option value="street">Вулиця (Воркаут)</option>
                        </select>
                    </div>

                    <div className="input-group">
                        <label>Наявне спорядження (необов'язково)</label>
                        <input
                            type="text"
                            placeholder="Напр: Тільки гантелі по 10 кг, резинки..."
                            value={equipment}
                            onChange={(e) => setEquipment(e.target.value)}
                            disabled={isGenerating}
                        />
                    </div>

                    <div className="input-group">
                        <label>Травми та обмеження</label>
                        <textarea
                            rows={2}
                            placeholder="Відсутні"
                            value={injuries}
                            onChange={(e) => setInjuries(e.target.value)}
                            disabled={isGenerating}
                        ></textarea>
                    </div>

                    <div className="input-group">
                        <label>Додаткові побажання (необов'язково)</label>
                        <textarea
                            rows={2}
                            placeholder="Напр: Більше уваги на плечі, без кардіо..."
                            value={extraInfo}
                            onChange={(e) => setExtraInfo(e.target.value)}
                            disabled={isGenerating}
                        ></textarea>
                    </div>

                    <button type="submit" className="generate-submit-btn" disabled={isGenerating}>
                        {isGenerating ? 'План генерується... ' : 'Згенерувати план'}
                    </button>
                </form>

            </div>
        </div>
    );
};

export default ProgramGenerator;
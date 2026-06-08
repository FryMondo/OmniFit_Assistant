import React, {useState, useEffect, useRef} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {useAuth} from '../../context/AuthContext';
import './Nutrition.css';

import menuIcon from '../../assets/menu-icon.png';
import micIcon from '../../assets/mic-icon.png';

interface Meal {
    id: string;
    name: string;
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
}

const Nutrition: React.FC = () => {
    const {userId} = useParams<{ userId?: string }>();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const navigate = useNavigate();

    const {user, session, logout} = useAuth();

    const targetAthleteId = userId || user?.id;
    const isCoachView = !!userId;

    const [foodInput, setFoodInput] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const recognitionRef = useRef<any>(null);

    const [targets, setTargets] = useState({calories: 2000, protein: 140, fat: 70, carbs: 400});

    const [currentMacros, setCurrentMacros] = useState({calories: 0, protein: 0, fat: 0, carbs: 0});
    const [meals, setMeals] = useState<Meal[]>([]);

    const API_BASE_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        if (!targetAthleteId || !session) return;

        const fetchData = async () => {
            const headers = {'Authorization': `Bearer ${session.access_token}`};

            try {
                const mealsRes = await fetch(`${API_BASE_URL}/nutrition/athlete/${targetAthleteId}`, {headers});
                if (mealsRes.ok) {
                    const logs = await mealsRes.json();

                    const today = new Date().toISOString().split('T')[0];
                    const todayLogs = logs.filter((log: any) => log.logged_at && log.logged_at.startsWith(today));

                    let totalCal = 0, totalPro = 0, totalFat = 0, totalCarb = 0;

                    const formattedMeals: Meal[] = todayLogs.map((log: any) => {
                        const mealData = log.meal_data || {};
                        totalCal += log.total_calories || 0;
                        totalPro += mealData.protein_g || mealData.protein || 0;
                        totalFat += mealData.fat_g || mealData.fat || 0;
                        totalCarb += mealData.carbs_g || mealData.carbs || 0;

                        return {
                            id: log.id,
                            name: mealData.original_name || mealData.name || 'Продукт',
                            calories: log.total_calories || 0,
                            protein: mealData.protein_g || mealData.protein || 0,
                            fat: mealData.fat_g || mealData.fat || 0,
                            carbs: mealData.carbs_g || mealData.carbs || 0
                        };
                    });

                    setMeals(formattedMeals);
                    setCurrentMacros({
                        calories: Math.round(totalCal),
                        protein: Math.round(totalPro),
                        fat: Math.round(totalFat),
                        carbs: Math.round(totalCarb)
                    });
                }

                const metricsRes = await fetch(`${API_BASE_URL}/metrics/${targetAthleteId}`, {headers});
                if (metricsRes.ok) {
                    const metrics = await metricsRes.json();

                    if (metrics && metrics.target_calories) {
                        setTargets({
                            calories: Math.round(metrics.target_calories),
                            protein: Math.round(metrics.target_protein || 140),
                            fat: Math.round(metrics.target_fat || 70),
                            carbs: Math.round(metrics.target_carbs || 400)
                        });
                    }
                }

            } catch (error) {
                console.error('Помилка завантаження даних:', error);
            }
        };

        fetchData();
    }, [targetAthleteId, session, API_BASE_URL]);

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
                setFoodInput(currentTranscript);
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error("Помилка розпізнавання голосу:", event.error);
                setIsRecording(false);
            };
        } else {
            console.warn("Ваш браузер не підтримує Web Speech API");
        }
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (document.activeElement?.tagName === 'INPUT') return;
            if (e.key === 'ArrowRight' || e.key === 'Escape') {
                if (isCoachView) navigate(-1);
                else goToDashboard();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [navigate, isCoachView]);

    const startRecording = () => {
        if (recognitionRef.current) {
            setFoodInput('');
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

    const handleAddFood = async () => {
        if (!foodInput.trim() || !targetAthleteId || !session) return;

        setIsProcessing(true);
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
        };

        try {
            const calcRes = await fetch(`${API_BASE_URL}/nutrition/calculate`, {
                method: 'POST',
                headers,
                body: JSON.stringify({text: foodInput, athlete_id: targetAthleteId})
            });

            if (!calcRes.ok) throw new Error('Помилка розпізнавання їжі');
            const calculatedData = await calcRes.json();

            if (calculatedData.errors && calculatedData.errors.length > 0) {
                alert(`Увага: ${calculatedData.errors.join('\n')}`);
            }

            if (!calculatedData.items || calculatedData.items.length === 0) {
                setFoodInput('');
                setIsProcessing(false);
                return;
            }

            const saveRes = await fetch(`${API_BASE_URL}/nutrition`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    athlete_id: targetAthleteId,
                    meal_category: 'Snack',
                    items: calculatedData.items
                })
            });

            if (!saveRes.ok) throw new Error('Помилка збереження в БД');
            const savedLogs = await saveRes.json();

            const newMeals: Meal[] = savedLogs.map((log: any) => ({
                id: log.id,
                name: log.meal_data.original_name || log.meal_data.name,
                calories: log.total_calories,
                protein: log.meal_data.protein_g || log.meal_data.protein,
                fat: log.meal_data.fat_g || log.meal_data.fat,
                carbs: log.meal_data.carbs_g || log.meal_data.carbs
            }));

            setMeals(prev => [...newMeals, ...prev]);

            setCurrentMacros(prev => ({
                calories: prev.calories + calculatedData.totals.calories,
                protein: prev.protein + calculatedData.totals.protein_g,
                fat: prev.fat + calculatedData.totals.fat_g,
                carbs: prev.carbs + calculatedData.totals.carbs_g
            }));

            setFoodInput('');
        } catch (error) {
            console.error("Помилка додавання їжі:", error);
            alert("Не вдалося розпізнати або зберегти їжу.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddFood();
        }
    };

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
    const closeSidebar = () => setIsSidebarOpen(false);
    const goToDashboard = () => navigate('/dashboard');

    const handleLogout = async () => {
        await logout();
        navigate('/auth');
    };

    const safeTarget = (val: number) => val > 0 ? val : 1;

    const calPercent = Math.min((currentMacros.calories / safeTarget(targets.calories)) * 100, 100);
    const proPercent = Math.min((currentMacros.protein / safeTarget(targets.protein)) * 100, 100);
    const fatPercent = Math.min((currentMacros.fat / safeTarget(targets.fat)) * 100, 100);
    const carbPercent = Math.min((currentMacros.carbs / safeTarget(targets.carbs)) * 100, 100);

    return (
        <div className="nutrition-page">
            {!isCoachView && (
                <div className="edge-controller edge-right" onClick={goToDashboard}>
                    <span className="arrow">›</span>
                </div>
            )}

            <div className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`} onClick={closeSidebar}></div>

            {!isCoachView && (
                <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
                    <div className="sidebar-header">
                        <h2>Меню</h2>
                        <button className="close-btn" onClick={closeSidebar}>✕</button>
                    </div>
                    <nav className="sidebar-nav">
                        <ul>
                            <li>
                                <button onClick={() => navigate('/calculator')}>Розрахунок КБЖВ</button>
                            </li>
                            <li>
                                <button onClick={() => navigate('/meals')}>Мої страви</button>
                            </li>
                            <li>
                                <button onClick={() => navigate('/profile')}>Профіль та Метрики</button>
                            </li>
                            <li>
                                <button>FAQ</button>
                            </li>
                            <hr className="sidebar-divider"/>
                            <li>
                                <button className="logout-btn" onClick={handleLogout}>Вийти</button>
                            </li>
                        </ul>
                    </nav>
                </aside>
            )}

            <div className="nutrition-content">
                <header className="nutri-header">
                    {isCoachView ? (
                        <button className="back-btn" onClick={() => navigate(-1)} style={{
                            background: 'none',
                            border: 'none',
                            color: '#aaa',
                            cursor: 'pointer',
                            fontSize: '16px'
                        }}>‹ Назад</button>
                    ) : (
                        <button className="icon-btn" onClick={toggleSidebar}>
                            <img src={menuIcon} alt="Меню"/>
                        </button>
                    )}

                    <div className="date-navigation">
                        <button className="date-arrow" style={{visibility: isCoachView ? 'hidden' : 'visible'}}>‹
                        </button>
                        <h1>{isCoachView ? 'Харчування клієнта' : 'Сьогодні'}</h1>
                        <button className="date-arrow" style={{visibility: 'hidden'}}>›</button>
                    </div>

                    <div style={{width: '28px'}}></div>
                </header>

                <section className="macros-section">
                    <div className="calories-circle-wrapper">
                        <div
                            className="calories-circle"
                            style={{background: `conic-gradient(#27ae60 ${calPercent}%, rgba(255,255,255,0.1) 0)`}}
                        >
                            <div className="circle-inner">
                                <span className="cal-current">{Math.round(currentMacros.calories)}</span>
                                <span className="cal-target">/ {targets.calories} ккал</span>
                            </div>
                        </div>
                    </div>

                    <div className="macro-bars">
                        <div className="macro-item">
                            <div className="macro-labels">
                                <span>Білки</span>
                                <span>{Math.round(currentMacros.protein)} / {targets.protein} г</span>
                            </div>
                            <div className="progress-track">
                                <div className="progress-fill protein-fill" style={{width: `${proPercent}%`}}></div>
                            </div>
                        </div>

                        <div className="macro-item">
                            <div className="macro-labels">
                                <span>Жири</span>
                                <span>{Math.round(currentMacros.fat)} / {targets.fat} г</span>
                            </div>
                            <div className="progress-track">
                                <div className="progress-fill fat-fill" style={{width: `${fatPercent}%`}}></div>
                            </div>
                        </div>

                        <div className="macro-item">
                            <div className="macro-labels">
                                <span>Вуглеводи</span>
                                <span>{Math.round(currentMacros.carbs)} / {targets.carbs} г</span>
                            </div>
                            <div className="progress-track">
                                <div className="progress-fill carbs-fill" style={{width: `${carbPercent}%`}}></div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="input-section">
                    <div
                        className={`input-capsule ${isRecording ? 'recording-active' : ''} ${isProcessing ? 'processing' : ''}`}>
                        <input
                            type="text"
                            className="capsule-input"
                            placeholder={isProcessing ? "Рахую калорії..." : (isRecording ? "Слухаю..." : isCoachView ? "Додати клієнту страву..." : "Що ви з'їли?")}
                            value={foodInput}
                            onChange={(e) => setFoodInput(e.target.value)}
                            onKeyDown={handleInputKeyDown}
                            disabled={isProcessing}
                        />
                        <button
                            className={`capsule-mic-btn ${isRecording ? 'recording' : ''}`}
                            onMouseDown={startRecording}
                            onMouseUp={stopRecording}
                            onMouseLeave={stopRecording}
                            onTouchStart={startRecording}
                            onTouchEnd={stopRecording}
                            disabled={isProcessing}
                        >
                            <img src={micIcon} alt="Голосовий ввід"/>
                        </button>
                    </div>
                </section>

                <section className="history-section">
                    <h2>Спожито сьогодні</h2>
                    {meals.length > 0 ? (
                        <div className="meal-list">
                            {meals.map((meal) => (
                                <div className="meal-card" key={meal.id}>
                                    <span className="meal-name" style={{textTransform: 'capitalize'}}>
                                        {meal.name}
                                    </span>
                                    <span className="meal-cal">{meal.calories} ккал</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="empty-state">{isCoachView ? 'Клієнт ще нічого не додав сьогодні.' : 'Ви ще нічого не додали за сьогодні.'}</p>
                    )}
                </section>
            </div>
        </div>
    );
};

export default Nutrition;
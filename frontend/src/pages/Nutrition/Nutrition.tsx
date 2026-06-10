import React, {useState, useEffect, useRef} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {useAuth} from '../../context/AuthContext';
import './Nutrition.css';

import menuIcon from '../../assets/menu-icon.png';
import micIcon from '../../assets/mic-icon.png';

interface Meal {
    id: string;
    name: string;
    category?: string;
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

    const [currentDate, setCurrentDate] = useState(new Date());
    const [foodInput, setFoodInput] = useState('');
    const foodInputRef = useRef('');

    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const recognitionRef = useRef<any>(null);

    const [targets, setTargets] = useState({calories: 2000, protein: 140, fat: 70, carbs: 400});
    const [currentMacros, setCurrentMacros] = useState({calories: 0, protein: 0, fat: 0, carbs: 0});
    const [meals, setMeals] = useState<Meal[]>([]);

    const [currentPage, setCurrentPage] = useState(1);
    const mealsPerPage = 4;
    const [expandedMealId, setExpandedMealId] = useState<string | null>(null);

    const API_BASE_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        foodInputRef.current = foodInput;
    }, [foodInput]);

    useEffect(() => {
        if (!targetAthleteId || !session) return;

        const fetchData = async () => {
            const headers = {'Authorization': `Bearer ${session.access_token}`};

            try {
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

                const mealsRes = await fetch(`${API_BASE_URL}/nutrition/athlete/${targetAthleteId}`, {headers});
                if (mealsRes.ok) {
                    const logs = await mealsRes.json();

                    const dailyLogs = logs.filter((log: any) => {
                        if (!log.logged_at) return false;
                        const logDate = new Date(log.logged_at);

                        return logDate.getDate() === currentDate.getDate() &&
                            logDate.getMonth() === currentDate.getMonth() &&
                            logDate.getFullYear() === currentDate.getFullYear();
                    });

                    let totalCal = 0, totalPro = 0, totalFat = 0, totalCarb = 0;

                    const formattedMeals: Meal[] = dailyLogs.map((log: any) => {
                        const mealData = log.meal_data || {};
                        totalCal += log.total_calories || 0;
                        totalPro += mealData.protein_g || mealData.protein || 0;
                        totalFat += mealData.fat_g || mealData.fat || 0;
                        totalCarb += mealData.carbs_g || mealData.carbs || 0;

                        return {
                            id: log.id,
                            name: mealData.original_name || mealData.name || 'Продукт',
                            category: log.meal_category,
                            calories: Math.round(log.total_calories || 0),
                            protein: Math.round(mealData.protein_g || mealData.protein || 0),
                            fat: Math.round(mealData.fat_g || mealData.fat || 0),
                            carbs: Math.round(mealData.carbs_g || mealData.carbs || 0)
                        };
                    });

                    setMeals(formattedMeals.reverse());
                    setCurrentPage(1);
                    setCurrentMacros({
                        calories: Math.round(totalCal),
                        protein: Math.round(totalPro),
                        fat: Math.round(totalFat),
                        carbs: Math.round(totalCarb)
                    });
                }
            } catch (error) {
                console.error('Помилка завантаження даних:', error);
            }
        };

        fetchData();
    }, [targetAthleteId, session, API_BASE_URL, currentDate]);

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

            recognitionRef.current.onerror = () => setIsRecording(false);
        }
    }, []);

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
            setTimeout(() => {
                if (foodInputRef.current.trim().length > 0) {
                    handleAddFood(foodInputRef.current);
                }
            }, 600);
        }
    };

    const getMealCategoryByTime = () => {
        const hour = new Date().getHours();
        if (hour >= 6 && hour < 11) return 'breakfast';
        if (hour >= 11 && hour < 16) return 'lunch';
        if (hour >= 16 && hour < 19) return 'snack';
        if (hour >= 19 && hour < 24) return 'dinner';
        return 'snack';
    };

    const translateCategory = (cat?: string) => {
        switch (cat) {
            case 'breakfast':
                return 'Сніданок';
            case 'lunch':
                return 'Обід';
            case 'dinner':
                return 'Вечеря';
            case 'snack':
                return 'Перекус';
            default:
                return 'Перекус';
        }
    };

    const handleAddFood = async (textToSubmit?: string) => {
        const text = textToSubmit || foodInput;
        if (!text.trim() || !targetAthleteId || !session) return;

        setIsProcessing(true);
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
        };

        try {
            const calcRes = await fetch(`${API_BASE_URL}/nutrition/calculate`, {
                method: 'POST',
                headers,
                body: JSON.stringify({text: text, athlete_id: targetAthleteId})
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

            const currentCategory = getMealCategoryByTime();

            const saveRes = await fetch(`${API_BASE_URL}/nutrition`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    athlete_id: targetAthleteId,
                    meal_category: currentCategory,
                    items: calculatedData.items
                })
            });

            if (!saveRes.ok) throw new Error('Помилка збереження в БД');
            const savedLogs = await saveRes.json();

            const newMeals: Meal[] = savedLogs.map((log: any) => ({
                id: log.id,
                name: log.meal_data.original_name || log.meal_data.name,
                category: currentCategory,
                calories: Math.round(log.total_calories),
                protein: Math.round(log.meal_data.protein_g || log.meal_data.protein),
                fat: Math.round(log.meal_data.fat_g || log.meal_data.fat),
                carbs: Math.round(log.meal_data.carbs_g || log.meal_data.carbs)
            }));

            const todayStr = new Date().toDateString();
            if (currentDate.toDateString() !== todayStr) {
                setCurrentDate(new Date());
            } else {
                setMeals(prev => [...newMeals, ...prev]);
                setCurrentMacros(prev => ({
                    calories: prev.calories + calculatedData.totals.calories,
                    protein: prev.protein + calculatedData.totals.protein_g,
                    fat: prev.fat + calculatedData.totals.fat_g,
                    carbs: prev.carbs + calculatedData.totals.carbs_g
                }));
            }

            setFoodInput('');
        } catch (error) {
            console.error("Помилка додавання їжі:", error);
            alert("Не вдалося розпізнати або зберегти їжу.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDeleteMeal = async (id: string, meal: Meal, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!session || !window.confirm('Видалити цей прийом їжі?')) return;

        try {
            const res = await fetch(`${API_BASE_URL}/nutrition/${id}`, {
                method: 'DELETE',
                headers: {'Authorization': `Bearer ${session.access_token}`}
            });

            if (res.ok) {
                setMeals(prev => prev.filter(m => m.id !== id));
                setCurrentMacros(prev => ({
                    calories: Math.max(0, prev.calories - meal.calories),
                    protein: Math.max(0, prev.protein - meal.protein),
                    fat: Math.max(0, prev.fat - meal.fat),
                    carbs: Math.max(0, prev.carbs - meal.carbs)
                }));
            }
        } catch (error) {
            console.error(error);
        }
    };

    const changeDate = (days: number) => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + days);
        setCurrentDate(newDate);
    };

    const isToday = currentDate.toDateString() === new Date().toDateString();
    const displayDateStr = isToday ? 'Сьогодні' : currentDate.toLocaleDateString('uk-UA', {
        day: 'numeric',
        month: 'long'
    });

    const indexOfLastMeal = currentPage * mealsPerPage;
    const indexOfFirstMeal = indexOfLastMeal - mealsPerPage;
    const currentMealsList = meals.slice(indexOfFirstMeal, indexOfLastMeal);
    const totalPages = Math.ceil(meals.length / mealsPerPage);

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
                        <button className="back-btn" onClick={() => navigate(-1)}>‹ Назад</button>) : (
                        <button className="icon-btn" onClick={toggleSidebar}>
                            <img src={menuIcon} alt="Меню"/>
                        </button>)}

                    <div className="date-navigation">
                        <button className="date-arrow" onClick={() => changeDate(-1)}>‹</button>
                        <h1 style={{textTransform: 'capitalize'}}>{isCoachView ? `Клієнт: ${displayDateStr}` : displayDateStr}</h1>
                        <button className="date-arrow" onClick={() => changeDate(1)}
                                style={{visibility: isToday ? 'hidden' : 'visible'}}>›
                        </button>
                    </div>

                    <div style={{width: '28px'}}></div>
                </header>

                <section className="macros-section">
                    <div className="calories-circle-wrapper">
                        <div
                            className="calories-circle"
                            style={{background: `conic-gradient(#27ae60 ${calPercent}%, rgba(255,255,255,0.1) 0)`}}>
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
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleAddFood();
                            }}
                            disabled={isProcessing}/>
                        <div className="capsule-actions">
                            <button
                                className={`capsule-submit-btn ${foodInput.trim() ? 'active' : 'disabled'}`}
                                onClick={() => handleAddFood()}
                                disabled={isProcessing || !foodInput.trim()}>
                                ➤
                            </button>
                            <button
                                className={`capsule-mic-btn ${isRecording ? 'recording' : ''}`}
                                onMouseDown={startRecording}
                                onMouseUp={stopRecording}
                                onMouseLeave={stopRecording}
                                onTouchStart={startRecording}
                                onTouchEnd={stopRecording}
                                disabled={isProcessing}>
                                <img src={micIcon} alt="Голосовий ввід"/>
                            </button>
                        </div>
                    </div>
                </section>
                <section className="history-section">
                    <h2>Спожито {isToday ? 'сьогодні' : displayDateStr}</h2>
                    {meals.length > 0 ? (
                        <>
                            <div className="meal-list">
                                {currentMealsList.map((meal) => {
                                    const isExpanded = expandedMealId === meal.id;
                                    return (
                                        <div className="meal-card" key={meal.id}
                                             onClick={() => setExpandedMealId(isExpanded ? null : meal.id)}>
                                            <div className="meal-card-header">
                                                <div className="meal-info">
                                                    <span className="meal-name"
                                                          style={{textTransform: 'capitalize'}}>{meal.name}</span>
                                                    <span
                                                        className="meal-category-badge">{translateCategory(meal.category)}</span>
                                                </div>
                                                <div className="meal-actions">
                                                    <span className="meal-cal">{meal.calories} ккал</span>
                                                    <button className="delete-meal-btn"
                                                            onClick={(e) => handleDeleteMeal(meal.id, meal, e)}>✕
                                                    </button>
                                                </div>
                                            </div>

                                            {isExpanded && (
                                                <div className="meal-macros-details">
                                                    <span>Б: <strong>{meal.protein}г</strong></span>
                                                    <span>Ж: <strong>{meal.fat}г</strong></span>
                                                    <span>В: <strong>{meal.carbs}г</strong></span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {totalPages > 1 && (
                                <div className="pagination">
                                    <button className="page-btn" disabled={currentPage === 1}
                                            onClick={() => setCurrentPage(prev => prev - 1)}>
                                        ‹
                                    </button>

                                    {Array.from({length: totalPages}, (_, i) => i + 1).map(number => (
                                        <button
                                            key={number}
                                            className={`page-btn ${currentPage === number ? 'active' : ''}`}
                                            onClick={() => setCurrentPage(number)}>
                                            {number}
                                        </button>
                                    ))}

                                    <button className="page-btn" disabled={currentPage === totalPages}
                                            onClick={() => setCurrentPage(prev => prev + 1)}>
                                        ›
                                    </button>
                                </div>
                            )}
                        </>) : (
                        <p className="empty-state">{isCoachView ? 'Клієнт не додав страв за цей день.' : 'Ви ще нічого не додали за цей день.'}</p>)}
                </section>
            </div>
        </div>
    );
};

export default Nutrition;
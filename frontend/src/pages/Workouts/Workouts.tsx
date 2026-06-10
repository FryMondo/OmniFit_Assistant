import React, {useEffect, useState} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {useAuth} from '../../context/AuthContext';
import './Workouts.css';

import menuIcon from '../../assets/menu-icon.png';

interface WorkoutSet {
    id: string;
    setIndex: number;
    reps: string | number;
    completed: boolean;
}

interface Exercise {
    id: string;
    dbIndex: number;
    name: string;
    rest_seconds: number;
    sets: WorkoutSet[];
}

const Workouts: React.FC = () => {
    const {userId} = useParams<{ userId?: string }>();
    const navigate = useNavigate();
    const {user, session, logout} = useAuth();
    const API_BASE_URL = import.meta.env.VITE_API_URL;

    const targetAthleteId = userId || user?.id;
    const isCoachView = !!userId;

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [restTimer, setRestTimer] = useState<number | null>(null);
    const [expandedExercises, setExpandedExercises] = useState<string[]>([]);

    const [currentWorkoutId, setCurrentWorkoutId] = useState<string | null>(null);
    const [fullWorkout, setFullWorkout] = useState<any>(null);
    const [programName, setProgramName] = useState('Немає активного плану');

    const [currentDayIndex, setCurrentDayIndex] = useState(0);

    const timerKey = targetAthleteId ? `workoutTimerEnd_${targetAthleteId}` : 'workoutTimerEnd_temp';

    const getMonday = (d: Date) => {
        const date = new Date(d);
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(date.setDate(diff)).setHours(0, 0, 0, 0);
    };

    useEffect(() => {
        if (!targetAthleteId || !session) return;

        const fetchWorkout = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/workouts/athlete/${targetAthleteId}`, {
                    headers: {'Authorization': `Bearer ${session.access_token}`}
                });

                if (res.ok) {
                    const workouts = await res.json();

                    if (workouts && workouts.length > 0) {
                        const latestPlan = workouts[workouts.length - 1];
                        setCurrentWorkoutId(latestPlan.id);
                        setProgramName(latestPlan.plan_name || 'Мій план тренувань');

                        let data = latestPlan.workout_data;
                        let daysArray = Array.isArray(data) ? data : (data.days || [data]);

                        const now = new Date();
                        const lastReset = data.last_progress_reset ? new Date(data.last_progress_reset) : new Date(0);

                        let needsReset = false;
                        if (!data.last_progress_reset || getMonday(now) > getMonday(lastReset)) {
                            needsReset = true;
                        }

                        if (needsReset && !isCoachView) {
                            daysArray = daysArray.map((day: any) => ({
                                ...day,
                                exercises: (day.exercises || []).map((ex: any) => ({
                                    ...ex,
                                    completed_sets: []
                                }))
                            }));
                            data.last_progress_reset = now.toISOString();
                            data.days = daysArray;

                            fetch(`${API_BASE_URL}/workouts/${latestPlan.id}`, {
                                method: 'PUT',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${session.access_token}`
                                },
                                body: JSON.stringify({plan_name: latestPlan.plan_name, workout_data: data})
                            }).catch(e => console.error("Помилка автоскидання прогресу:", e));
                        }

                        setFullWorkout(data);
                    }
                }
            } catch (error) {
                console.error("Помилка завантаження тренувань:", error);
            }
        };

        fetchWorkout();
    }, [targetAthleteId, session, API_BASE_URL, isCoachView]);

    useEffect(() => {
        if (!targetAthleteId) return;
        const savedEndTime = localStorage.getItem(timerKey);
        if (savedEndTime) {
            const endTime = parseInt(savedEndTime, 10);
            const now = Date.now();
            if (endTime > now) {
                setRestTimer(Math.ceil((endTime - now) / 1000));
            } else {
                localStorage.removeItem(timerKey);
            }
        }
    }, [targetAthleteId, timerKey]);

    useEffect(() => {
        let interval: number;
        if (restTimer !== null && restTimer > 0) {
            interval = window.setInterval(() => {
                const savedEndTime = localStorage.getItem(timerKey);
                if (savedEndTime) {
                    const endTime = parseInt(savedEndTime, 10);
                    const now = Date.now();
                    if (endTime > now) {
                        setRestTimer(Math.ceil((endTime - now) / 1000));
                    } else {
                        setRestTimer(null);
                        localStorage.removeItem(timerKey);
                    }
                } else {
                    setRestTimer(null);
                }
            }, 1000);
        } else if (restTimer === 0) {
            setRestTimer(null);
            localStorage.removeItem(timerKey);
        }
        return () => window.clearInterval(interval);
    }, [restTimer, timerKey]);

    const skipTimer = () => {
        setRestTimer(null);
        localStorage.removeItem(timerKey);
    };

    const toggleSetComplete = async (_exerciseId: string, _setId: string, dbIndex: number, setIndex: number) => {
        if (isCoachView) return;

        const newWorkout = {...fullWorkout};
        const dayToUpdate = newWorkout.days ? newWorkout.days[currentDayIndex] : newWorkout[currentDayIndex];
        const exToUpdate = dayToUpdate.exercises[dbIndex];

        const numSets = parseInt(exToUpdate.sets) || 3;
        if (!exToUpdate.completed_sets) {
            exToUpdate.completed_sets = Array(numSets).fill(false);
        }

        const isCurrentlyCompleted = !!exToUpdate.completed_sets[setIndex];
        exToUpdate.completed_sets[setIndex] = !isCurrentlyCompleted;

        setFullWorkout(newWorkout);

        if (!isCurrentlyCompleted) {
            const duration = parseInt(exToUpdate.rest_seconds) || 60;
            const endTime = Date.now() + duration * 1000;
            localStorage.setItem(timerKey, endTime.toString());
            setRestTimer(duration);
        }

        if (currentWorkoutId && session) {
            try {
                await fetch(`${API_BASE_URL}/workouts/${currentWorkoutId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`
                    },
                    body: JSON.stringify({
                        plan_name: programName,
                        workout_data: newWorkout
                    })
                });
            } catch (e) {
                console.error('Помилка синхронізації прогресу з БД', e);
            }
        }
    };

    const toggleExpand = (exerciseId: string) => {
        setExpandedExercises(prev =>
            prev.includes(exerciseId)
                ? prev.filter(id => id !== exerciseId)
                : [...prev, exerciseId]
        );
    };

    const daysArray = fullWorkout?.days || (Array.isArray(fullWorkout) ? fullWorkout : []);
    const currentDayData = daysArray[currentDayIndex];

    const dayFocus = currentDayData?.focus || `День ${currentDayData?.day_number || currentDayIndex + 1}`;
    const isRestDay = currentDayData?.is_rest_day === true || (!currentDayData?.exercises || currentDayData.exercises.length === 0);

    const exercises: Exercise[] = (currentDayData?.exercises || []).map((ex: any, i: number) => {
        const numSets = parseInt(ex.sets) || 3;
        const completedSetsArr = ex.completed_sets || [];
        return {
            id: `backend_ex_${currentDayIndex}_${i}`,
            dbIndex: i,
            name: ex.exercise_name || ex.name || ex.exercise || 'Вправа',
            rest_seconds: parseInt(ex.rest_seconds) || 60,
            sets: Array.from({length: numSets}).map((_, j) => ({
                id: `set_${currentDayIndex}_${i}_${j}`,
                setIndex: j,
                reps: ex.reps || 10,
                completed: !!completedSetsArr[j]
            }))
        };
    });

    const incompleteExercises = exercises.filter(ex => !ex.sets.every(s => s.completed));
    const completedExercises = exercises.filter(ex => ex.sets.every(s => s.completed));
    const sortedExercises = [...incompleteExercises, ...completedExercises];

    const todayStr = new Intl.DateTimeFormat('uk-UA', {day: 'numeric', month: 'long'}).format(new Date());

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
    const closeSidebar = () => setIsSidebarOpen(false);
    const handleLogout = async () => {
        await logout();
        navigate('/auth');
    };

    return (
        <div className="workouts-page">
            {!isCoachView && (
                <div className="edge-controller edge-left" onClick={() => navigate('/dashboard')}>
                    <span className="arrow">‹</span>
                </div>
            )}

            <div className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`} onClick={closeSidebar}></div>

            {!isCoachView && (
                <aside className={`sidebar right-sidebar ${isSidebarOpen ? 'open' : ''}`}>
                    <div className="sidebar-header">
                        <h2>Меню</h2>
                        <button className="close-btn" onClick={closeSidebar}>✕</button>
                    </div>
                    <nav className="sidebar-nav">
                        <ul>
                            <li>
                                <button onClick={() => navigate('/generator')}>Генератор програм</button>
                            </li>
                            <li>
                                <button onClick={() => navigate('/my-plan')}>Мій план тренувань</button>
                            </li>
                            <li>
                                <button onClick={() => navigate('/records')}>Особисті рекорди</button>
                            </li>
                            <li>
                                <button onClick={() => navigate('/profile')}>Профіль та Метрики</button>
                            </li>
                            <li>
                                <button onClick={() => navigate('/gyms')}>Спортзали</button>
                            </li>
                            {user?.role === 'coach' && (<li>
                                <button onClick={() => navigate('/clients')}>Клієнти</button>
                            </li>)}
                            <hr className="sidebar-divider"/>
                            <li>
                                <button className="logout-btn" onClick={handleLogout}>Вийти</button>
                            </li>
                        </ul>
                    </nav>
                </aside>
            )}

            <div className="workouts-content">
                <header className="workouts-header">
                    <div style={{width: '28px'}}></div>
                    <h1 style={{textTransform: 'capitalize'}}>{isCoachView ? 'Тренування клієнта' : `Сьогодні, ${todayStr}`}</h1>
                    {isCoachView ? (
                        <button className="back-btn" onClick={() => navigate(-1)} style={{
                            background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '16px'
                        }}>‹ Назад</button>
                    ) : (
                        <button className="icon-btn" onClick={toggleSidebar}>
                            <img src={menuIcon} alt="Меню"/>
                        </button>
                    )}
                </header>

                {restTimer !== null && (
                    <div className="floating-timer-capsule">
                        <span className="timer-icon">⏱</span>
                        <span className="timer-text">
                            Відпочинок: {Math.floor(restTimer / 60)}:{(restTimer % 60).toString().padStart(2, '0')}
                        </span>
                        <button className="skip-timer-btn" onClick={skipTimer}>✕</button>
                    </div>
                )}

                <section className="program-status-section">
                    <p className="program-name">{programName}</p>
                    <div className="day-navigation">
                        <button
                            className="day-arrow"
                            onClick={() => setCurrentDayIndex(prev => Math.max(0, prev - 1))}
                            style={{visibility: currentDayIndex === 0 ? 'hidden' : 'visible'}}
                        >
                            ‹
                        </button>
                        <h2 className="day-focus">{dayFocus}</h2>
                        <button
                            className="day-arrow"
                            onClick={() => setCurrentDayIndex(prev => Math.min(daysArray.length - 1, prev + 1))}
                            style={{visibility: (!daysArray || currentDayIndex >= daysArray.length - 1) ? 'hidden' : 'visible'}}
                        >
                            ›
                        </button>
                    </div>
                </section>

                <section className="exercises-section">
                    {isRestDay ? (
                        <div className="rest-day-message"
                             style={{textAlign: 'center', marginTop: '40px', color: '#aaa'}}>
                            <h3 style={{color: '#fff', marginBottom: '10px', fontSize: '24px'}}>Вихідний день</h3>
                            <p>Сьогодні час для відпочинку та відновлення м'язів.</p>
                        </div>
                    ) : (
                        sortedExercises.map((exercise) => {
                            const isFullyCompleted = exercise.sets.every(s => s.completed);
                            const isExpanded = expandedExercises.includes(exercise.id);
                            const isCollapsed = isFullyCompleted && !isExpanded;

                            return (
                                <div key={exercise.id}
                                     className={`exercise-card ${isFullyCompleted ? 'fully-completed' : ''}`}>
                                    <div
                                        className="exercise-header"
                                        onClick={() => isFullyCompleted && toggleExpand(exercise.id)}
                                    >
                                        <h3 className="exercise-title">{exercise.name}</h3>
                                        {isFullyCompleted && (
                                            <span className="expand-indicator">{isExpanded ? '▲' : '▼'}</span>
                                        )}
                                    </div>

                                    {!isCollapsed && (
                                        <div className="sets-list">
                                            {exercise.sets.map((set) => {
                                                const isDisabled = (restTimer !== null && restTimer > 0) || isCoachView;

                                                return (
                                                    <div key={set.id}
                                                         className={`set-row ${set.completed ? 'completed' : ''} ${isDisabled ? 'disabled' : ''}`}>
                                                        <div className="set-info">
                                                            <span
                                                                className="set-number">Підхід {set.setIndex + 1}</span>
                                                            <span className="set-target">{set.reps} повторень</span>
                                                        </div>
                                                        <button
                                                            className={`check-btn ${set.completed ? 'checked' : ''}`}
                                                            onClick={() => !isDisabled && toggleSetComplete(exercise.id, set.id, exercise.dbIndex, set.setIndex)}
                                                            disabled={isDisabled}
                                                        >
                                                            {set.completed ? '✓' : ''}
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </section>
            </div>
        </div>
    );
};

export default Workouts;
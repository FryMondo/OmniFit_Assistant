import React, {useEffect, useState} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {useAuth} from '../../context/AuthContext';
import './Workouts.css';

import menuIcon from '../../assets/menu-icon.png';

interface WorkoutSet {
    id: string;
    reps: string | number;
    completed: boolean;
}

interface Exercise {
    id: string;
    name: string;
    rest_seconds: number;
    sets: WorkoutSet[];
}

const defaultExercises: Exercise[] = [
    {
        id: 'ex1',
        name: 'Жим гантелей лежачи',
        rest_seconds: 90,
        sets: [
            {id: 'set1_1', reps: 12, completed: false},
            {id: 'set1_2', reps: 10, completed: false},
            {id: 'set1_3', reps: 8, completed: false},
        ]
    }
];

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

    const [programName, setProgramName] = useState('Немає активного плану');
    const [dayFocus, setDayFocus] = useState('Сьогоднішнє тренування');

    const [exercises, setExercises] = useState<Exercise[]>(defaultExercises);

    const progressKey = targetAthleteId ? `workoutProgress_${targetAthleteId}` : 'workoutProgress_temp';
    const timerKey = targetAthleteId ? `workoutTimerEnd_${targetAthleteId}` : 'workoutTimerEnd_temp';

    useEffect(() => {
        if (!targetAthleteId) return;
        const savedProgress = localStorage.getItem(progressKey);
        if (savedProgress) {
            setExercises(JSON.parse(savedProgress));
        } else {
            setExercises(defaultExercises);
        }
    }, [targetAthleteId, progressKey]);

    useEffect(() => {
        if (!targetAthleteId) return;
        localStorage.setItem(progressKey, JSON.stringify(exercises));
    }, [exercises, targetAthleteId, progressKey]);

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
                        setProgramName(latestPlan.plan_name || 'Мій план тренувань');

                        const data = latestPlan.workout_data;
                        let backendExercises: Exercise[] = [];
                        let focus = 'Поточне тренування';

                        let dayData = null;
                        if (Array.isArray(data)) {
                            dayData = data[0];
                        } else if (data && data.days && Array.isArray(data.days)) {
                            dayData = data.days[0];
                        } else if (data && data.exercises) {
                            dayData = data;
                        }

                        if (dayData && dayData.exercises && Array.isArray(dayData.exercises)) {
                            focus = dayData.focus || dayData.day || focus;

                            backendExercises = dayData.exercises.map((ex: any, i: number) => ({
                                id: `backend_ex_${i}`,
                                name: ex.exercise_name || ex.name || ex.exercise || 'Вправа',
                                rest_seconds: parseInt(ex.rest_seconds) || 60,
                                sets: Array.from({length: parseInt(ex.sets) || 3}).map((_, j) => ({
                                    id: `set${i}_${j}`,
                                    reps: ex.reps || 10,
                                    completed: false
                                }))
                            }));
                        }

                        setDayFocus(focus);

                        if (backendExercises.length > 0) {
                            const savedStr = localStorage.getItem(progressKey);
                            if (savedStr) {
                                const savedEx = JSON.parse(savedStr);
                                if (savedEx.length > 0 && savedEx[0].name === backendExercises[0].name) {
                                    return;
                                }
                            }
                            setExercises(backendExercises);
                        }
                    }
                }
            } catch (error) {
                console.error("Помилка завантаження тренувань:", error);
            }
        };

        fetchWorkout();
    }, [targetAthleteId, session, API_BASE_URL, progressKey]);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
    const closeSidebar = () => setIsSidebarOpen(false);

    const handleLogout = async () => {
        await logout();
        navigate('/auth');
    };

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

    const toggleSetComplete = (exerciseId: string, setId: string) => {
        setExercises(prevExercises =>
            prevExercises.map(ex => {
                if (ex.id === exerciseId) {
                    return {
                        ...ex,
                        sets: ex.sets.map(set => {
                            if (set.id === setId) {
                                const newCompletedStatus = !set.completed;
                                if (newCompletedStatus) {
                                    const duration = ex.rest_seconds || 60;
                                    const endTime = Date.now() + duration * 1000;
                                    localStorage.setItem(timerKey, endTime.toString());
                                    setRestTimer(duration);
                                }
                                return {...set, completed: newCompletedStatus};
                            }
                            return set;
                        })
                    };
                }
                return ex;
            })
        );
    };

    const toggleExpand = (exerciseId: string) => {
        setExpandedExercises(prev =>
            prev.includes(exerciseId)
                ? prev.filter(id => id !== exerciseId)
                : [...prev, exerciseId]
        );
    };

    const incompleteExercises = exercises.filter(ex => !ex.sets.every(s => s.completed));
    const completedExercises = exercises.filter(ex => ex.sets.every(s => s.completed));
    const sortedExercises = [...incompleteExercises, ...completedExercises];

    const todayStr = new Intl.DateTimeFormat('uk-UA', {day: 'numeric', month: 'long'}).format(new Date());

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
                            {user?.role === 'coach' && (
                                <li>
                                    <button onClick={() => navigate('/clients')}>Клієнти</button>
                                </li>
                            )}
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
                        <button className="day-arrow" style={{visibility: isCoachView ? 'hidden' : 'visible'}}>‹
                        </button>
                        <h2 className="day-focus">{dayFocus}</h2>
                        <button className="day-arrow" style={{visibility: isCoachView ? 'hidden' : 'visible'}}>›
                        </button>
                    </div>
                </section>

                <section className="exercises-section">
                    {sortedExercises.map((exercise) => {
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
                                        {exercise.sets.map((set, index) => {
                                            const isDisabled = restTimer !== null && restTimer > 0;

                                            return (
                                                <div key={set.id}
                                                     className={`set-row ${set.completed ? 'completed' : ''} ${isDisabled ? 'disabled' : ''}`}>
                                                    <div className="set-info">
                                                        <span className="set-number">Підхід {index + 1}</span>
                                                        <span className="set-target">{set.reps} повторень</span>
                                                    </div>
                                                    <button
                                                        className={`check-btn ${set.completed ? 'checked' : ''}`}
                                                        onClick={() => !isDisabled && toggleSetComplete(exercise.id, set.id)}
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
                    })}
                </section>
            </div>
        </div>
    );
};

export default Workouts;
import React, {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {useAuth} from '../../context/AuthContext';
import './Dashboard.css';

const Dashboard: React.FC = () => {
    const [expandedSide, setExpandedSide] = useState<'none' | 'left' | 'right'>('none');
    const navigate = useNavigate();

    const {user, session} = useAuth();

    const [consumedCalories, setConsumedCalories] = useState<number>(0);
    const [targetCalories, setTargetCalories] = useState<number>(2000);
    const [workoutTitle, setWorkoutTitle] = useState<string>('Немає активних планів');

    const triggerExpand = (side: 'left' | 'right') => {
        if (expandedSide !== 'none') return;

        setExpandedSide(side);

        setTimeout(() => {
            if (side === 'left') {
                navigate('/nutrition');
            } else {
                navigate('/workouts');
            }
        }, 600);
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (expandedSide !== 'none') return;

            if (e.key === 'ArrowLeft') {
                triggerExpand('left');
            } else if (e.key === 'ArrowRight') {
                triggerExpand('right');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [expandedSide, navigate]);

    useEffect(() => {
        if (!user || !session) return;

        const fetchData = async () => {
            const API_BASE_URL = import.meta.env.VITE_API_URL;
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
            };

            try {
                const nutritionRes = await fetch(`${API_BASE_URL}/nutrition/athlete/${user.id}`, {headers});
                if (nutritionRes.ok) {
                    const logs = await nutritionRes.json();

                    const currentDate = new Date();
                    const todayLogs = logs.filter((log: any) => {
                        if (!log.logged_at) return false;
                        const logDate = new Date(log.logged_at);

                        return logDate.getDate() === currentDate.getDate() &&
                            logDate.getMonth() === currentDate.getMonth() &&
                            logDate.getFullYear() === currentDate.getFullYear();
                    });

                    const totalToday = todayLogs.reduce((sum: number, log: any) => sum + (log.total_calories || 0), 0);
                    setConsumedCalories(Math.round(totalToday));
                }

                const metricsRes = await fetch(`${API_BASE_URL}/metrics/${user.id}`, {headers});
                if (metricsRes.ok) {
                    const metrics = await metricsRes.json();
                    if (metrics && metrics.target_calories) {
                        setTargetCalories(Math.round(metrics.target_calories));
                    }
                }

                const workoutRes = await fetch(`${API_BASE_URL}/workouts/athlete/${user.id}`, {headers});
                if (workoutRes.ok) {
                    const workouts = await workoutRes.json();
                    if (workouts && workouts.length > 0) {
                        const latestWorkout = workouts[workouts.length - 1];
                        setWorkoutTitle(latestWorkout.plan_name || 'Поточне тренування');
                    }
                }

            } catch (error) {
                console.error("Помилка завантаження даних дашборду:", error);
            }
        };

        fetchData();
    }, [user, session]);

    return (
        <div className={`dashboard-container ${expandedSide}`}>
            {expandedSide === 'none' && (
                <div className="central-controller">
                    <span className="arrow left-arrow" onClick={(e) => {
                        e.stopPropagation();
                        triggerExpand('left');
                    }}>
                        ‹
                    </span>
                    <div className="divider-line"></div>
                    <span className="arrow right-arrow" onClick={(e) => {
                        e.stopPropagation();
                        triggerExpand('right');
                    }}>
                        ›
                    </span>
                </div>
            )}

            <div
                className={`panel left-panel ${expandedSide === 'left' ? 'expanded' : ''} ${expandedSide === 'right' ? 'collapsed' : ''}`}
                onClick={() => triggerExpand('left')}
            >
                <div className="panel-content">
                    <h2 className="top-title">Щоденник Харчування</h2>
                    <div className="summary-data">
                        <p className="summary-text">Калорії: {consumedCalories} / {targetCalories}</p>
                    </div>
                </div>
            </div>

            <div
                className={`panel right-panel ${expandedSide === 'right' ? 'expanded' : ''} ${expandedSide === 'left' ? 'collapsed' : ''}`}
                onClick={() => triggerExpand('right')}
            >
                <div className="panel-content">
                    <h2 className="top-title">Тренування</h2>
                    <div className="summary-data">
                        <p className="summary-text">{workoutTitle}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
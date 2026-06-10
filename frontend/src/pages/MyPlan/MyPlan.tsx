import React, {useRef, useState, useEffect} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {useAuth} from '../../context/AuthContext';
import './MyPlan.css';

interface ExerciseRecord {
    id: string;
    name: string;
    sets: number;
    reps: string;
    rest: number;
}

interface WorkoutDay {
    id: string;
    dayNumber: number;
    focus: string;
    isRestDay: boolean;
    exercises: ExerciseRecord[];
}

const MyPlan: React.FC = () => {
    const {userId} = useParams<{ userId?: string }>();
    const navigate = useNavigate();
    const {user, session} = useAuth();
    const API_BASE_URL = import.meta.env.VITE_API_URL;

    const targetAthleteId = userId || user?.id;
    const isCoachView = !!userId;

    const [isEditing, setIsEditing] = useState(false);
    const [currentWorkoutId, setCurrentWorkoutId] = useState<string | null>(null);

    const carouselRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    const [programName, setProgramName] = useState("Завантаження...");
    const [workoutDays, setWorkoutDays] = useState<WorkoutDay[]>([]);

    const daysPerWeek = workoutDays.filter(day => !day.isRestDay).length;

    const [addingExerciseToDay, setAddingExerciseToDay] = useState<string | null>(null);
    const [newExercise, setNewExercise] = useState({name: '', sets: '', reps: '', rest: ''});

    useEffect(() => {
        if (!targetAthleteId || !session) return;

        const fetchPlan = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/workouts/athlete/${targetAthleteId}`, {
                    headers: {'Authorization': `Bearer ${session.access_token}`}
                });

                if (res.ok) {
                    const workouts = await res.json();

                    if (workouts && workouts.length > 0) {
                        const latestPlan = workouts[workouts.length - 1];
                        setCurrentWorkoutId(latestPlan.id);
                        setProgramName(latestPlan.plan_name || 'Мій план');

                        const rawData = latestPlan.workout_data;
                        const daysArray = Array.isArray(rawData) ? rawData : (rawData.days || [rawData]);

                        const mappedDays: WorkoutDay[] = daysArray.map((d: any, index: number) => ({
                            id: `d${index}_${Date.now()}`,
                            dayNumber: d.day_number || index + 1,
                            focus: d.focus || d.day || 'Тренування',
                            isRestDay: d.is_rest_day === true || (!d.exercises || d.exercises.length === 0),
                            exercises: (d.exercises || []).map((ex: any, exIdx: number) => ({
                                id: `e${index}_${exIdx}`,
                                name: ex.exercise_name || ex.name || ex.exercise || 'Вправа',
                                sets: parseInt(ex.sets) || 0,
                                reps: ex.reps?.toString() || '0',
                                rest: parseInt(ex.rest_seconds) || 60
                            }))
                        }));

                        setWorkoutDays(mappedDays);
                    } else {
                        setProgramName("План відсутній");
                    }
                }
            } catch (error) {
                console.error("Помилка завантаження плану:", error);
            }
        };

        fetchPlan();
    }, [targetAthleteId, session, API_BASE_URL]);

    const handleMoveDay = (index: number, direction: 'left' | 'right') => {
        setWorkoutDays(prevDays => {
            const newDays = [...prevDays];
            if (direction === 'left' && index > 0) {
                const temp = newDays[index - 1];
                newDays[index - 1] = newDays[index];
                newDays[index] = temp;
            } else if (direction === 'right' && index < newDays.length - 1) {
                const temp = newDays[index + 1];
                newDays[index + 1] = newDays[index];
                newDays[index] = temp;
            }
            return newDays.map((d, i) => ({...d, dayNumber: i + 1}));
        });
    };

    const handleDeleteExercise = (dayId: string, exerciseId: string) => {
        setWorkoutDays(prevDays => prevDays.map(day => {
            if (day.id === dayId) {
                return {...day, exercises: day.exercises.filter(ex => ex.id !== exerciseId)};
            }
            return day;
        }));
    };

    const handleSaveNewExercise = (dayId: string) => {
        if (!newExercise.name.trim()) return;

        const exerciseToAdd: ExerciseRecord = {
            id: `e${Date.now()}`,
            name: newExercise.name,
            sets: Number(newExercise.sets) || 0,
            reps: newExercise.reps || '0',
            rest: Number(newExercise.rest) || 0
        };

        setWorkoutDays(days => days.map(d => {
            if (d.id === dayId) {
                return {...d, exercises: [...d.exercises, exerciseToAdd]};
            }
            return d;
        }));

        setAddingExerciseToDay(null);
        setNewExercise({name: '', sets: '', reps: '', rest: ''});
    };

    const handleAddDay = () => {
        const newDayNumber = workoutDays.length + 1;
        setWorkoutDays([...workoutDays, {
            id: `d${Date.now()}`,
            dayNumber: newDayNumber,
            focus: 'Новий день',
            isRestDay: false,
            exercises: []
        }]);
        setTimeout(() => scrollCarousel(1), 100);
    };

    const toggleRestDay = (dayId: string) => {
        setWorkoutDays(days => days.map(d => {
            if (d.id === dayId) {
                return {...d, isRestDay: !d.isRestDay, exercises: []};
            }
            return d;
        }));
    };

    const handleDeleteDay = (dayId: string) => {
        setWorkoutDays(days => {
            const filtered = days.filter(d => d.id !== dayId);
            return filtered.map((d, index) => ({...d, dayNumber: index + 1}));
        });
    };

    const handleSavePlan = async () => {
        if (!currentWorkoutId || !session) return;

        const formattedDays = workoutDays.map((d, index) => ({
            day_number: index + 1,
            focus: d.focus,
            is_rest_day: d.isRestDay,
            exercises: d.isRestDay ? [] : d.exercises.map(ex => ({
                exercise_name: ex.name,
                sets: ex.sets,
                reps: ex.reps,
                rest_seconds: ex.rest
            }))
        }));

        const workoutDataToSave = {
            plan_name: programName,
            days: formattedDays
        };

        try {
            const res = await fetch(`${API_BASE_URL}/workouts/${currentWorkoutId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    plan_name: programName,
                    workout_data: workoutDataToSave
                })
            });

            if (!res.ok) throw new Error('Помилка оновлення');

            setIsEditing(false);
            setAddingExerciseToDay(null);
            alert('План успішно збережено та оновлено в базі!');
        } catch (error) {
            console.error("Помилка збереження:", error);
            alert("Не вдалося зберегти план.");
        }
    };

    const snapToNearest = () => {
        if (carouselRef.current && !isEditing) {
            const cardElement = carouselRef.current.querySelector('.day-card') as HTMLElement;
            if (cardElement) {
                const cardWidthWithGap = cardElement.offsetWidth + 20;
                const nearestCardIndex = Math.round(carouselRef.current.scrollLeft / cardWidthWithGap);
                carouselRef.current.scrollTo({left: nearestCardIndex * cardWidthWithGap, behavior: 'smooth'});
            }
        }
    };

    const scrollCarousel = (direction: number) => {
        if (carouselRef.current) {
            const cardElement = carouselRef.current.querySelector('.day-card') as HTMLElement;
            if (cardElement) {
                const cardWidthWithGap = cardElement.offsetWidth + 20;
                carouselRef.current.scrollBy({left: direction * cardWidthWithGap, behavior: 'smooth'});
            }
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isEditing) return;
            if (e.key === 'ArrowLeft') scrollCarousel(-1);
            else if (e.key === 'ArrowRight') scrollCarousel(1);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isEditing]);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!carouselRef.current || isEditing) return;
        setIsDragging(true);
        setStartX(e.pageX - carouselRef.current.offsetLeft);
        setScrollLeft(carouselRef.current.scrollLeft);
    };

    const handleMouseLeave = () => {
        if (isDragging) {
            setIsDragging(false);
            snapToNearest();
        }
    };
    const handleMouseUp = () => {
        if (isDragging) {
            setIsDragging(false);
            snapToNearest();
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !carouselRef.current || isEditing) return;
        e.preventDefault();
        const x = e.pageX - carouselRef.current.offsetLeft;
        const walk = (x - startX) * 1.5;
        carouselRef.current.scrollLeft = scrollLeft - walk;
    };

    return (
        <div className="plan-page">
            <div className="plan-content">

                <header className="plan-header">
                    <button className="back-btn" onClick={() => navigate(-1)}>‹ Назад</button>
                    <h1>{isCoachView ? 'План клієнта' : 'Мій план'}</h1>
                    {isEditing ? (
                        <button className="save-plan-btn" onClick={handleSavePlan}>Зберегти</button>
                    ) : (
                        <button className="edit-plan-btn" onClick={() => setIsEditing(true)}>Редагувати</button>
                    )}
                </header>

                <div className="program-summary">
                    {isEditing ? (
                        <input
                            type="text"
                            className="edit-program-title"
                            value={programName}
                            onChange={(e) => setProgramName(e.target.value)}
                        />
                    ) : (
                        <h2 className="program-title">{programName}</h2>
                    )}
                    <p className="program-details">{daysPerWeek} тренування на тиждень</p>
                </div>

                <div className="carousel-container">
                    <button className="carousel-arrow left-arrow" onClick={() => scrollCarousel(-1)}>‹</button>

                    <div
                        className={`days-carousel ${isDragging ? 'dragging' : ''} ${isEditing ? 'editing-mode' : ''}`}
                        ref={carouselRef}
                        onMouseDown={handleMouseDown}
                        onMouseLeave={handleMouseLeave}
                        onMouseUp={handleMouseUp}
                        onMouseMove={handleMouseMove}
                    >
                        {workoutDays.map((day, index) => (
                            <div key={day.id} className={`day-card ${day.isRestDay ? 'rest-day-card' : ''}`}>
                                <div className="day-card-header">
                                    <div className="day-header-top">
                                        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                                            {isEditing && (
                                                <button
                                                    onClick={() => handleMoveDay(index, 'left')}
                                                    disabled={index === 0}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        color: index === 0 ? '#555' : '#27ae60',
                                                        cursor: index === 0 ? 'default' : 'pointer',
                                                        fontSize: '20px',
                                                        padding: '0',
                                                        display: 'flex'
                                                    }}
                                                    title="Перемістити вліво"
                                                >
                                                    ◀
                                                </button>
                                            )}
                                            <span className="day-number">День {day.dayNumber}</span>
                                            {isEditing && (
                                                <button
                                                    onClick={() => handleMoveDay(index, 'right')}
                                                    disabled={index === workoutDays.length - 1}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        color: index === workoutDays.length - 1 ? '#555' : '#27ae60',
                                                        cursor: index === workoutDays.length - 1 ? 'default' : 'pointer',
                                                        fontSize: '20px',
                                                        padding: '0',
                                                        display: 'flex'
                                                    }}
                                                    title="Перемістити вправо"
                                                >
                                                    ▶
                                                </button>
                                            )}
                                        </div>
                                        {isEditing && (
                                            <button className="delete-day-btn"
                                                    onClick={() => handleDeleteDay(day.id)}>✕</button>
                                        )}
                                    </div>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            className="edit-day-focus"
                                            value={day.focus}
                                            onChange={(e) => {
                                                const newFocus = e.target.value;
                                                setWorkoutDays(days => days.map(d => d.id === day.id ? {
                                                    ...d,
                                                    focus: newFocus
                                                } : d));
                                            }}
                                        />
                                    ) : (
                                        <h3 className="day-focus">{day.focus}</h3>
                                    )}
                                </div>

                                {day.isRestDay ? (
                                    <div className="rest-day-content">
                                        <p>Час для відновлення м'язів</p>
                                        {isEditing && (
                                            <button className="toggle-day-btn" onClick={() => toggleRestDay(day.id)}>
                                                Зробити тренувальним
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="compact-exercises-list">
                                        {day.exercises.map((ex) => (
                                            <div key={ex.id} className="compact-exercise-row">
                                                <div className="ex-main-info">
                                                    <span className="ex-name">{ex.name}</span>
                                                    <span className="ex-sets-reps">{ex.sets} підходів × {ex.reps}</span>
                                                </div>
                                                <div className="ex-rest-info">
                                                    <span className="rest-icon-small">⏱</span>
                                                    <span>{ex.rest}с</span>
                                                </div>
                                                {isEditing && (
                                                    <button className="delete-ex-btn"
                                                            onClick={() => handleDeleteExercise(day.id, ex.id)}>✕</button>
                                                )}
                                            </div>
                                        ))}
                                        {isEditing && (
                                            addingExerciseToDay === day.id ? (
                                                <div className="inline-add-ex-form">
                                                    <input type="text" placeholder="Назва вправи..."
                                                           value={newExercise.name} onChange={e => setNewExercise({
                                                        ...newExercise,
                                                        name: e.target.value
                                                    })} className="ex-input-full"/>
                                                    <div className="ex-input-row">
                                                        <input type="number" placeholder="Підходи"
                                                               value={newExercise.sets} onChange={e => setNewExercise({
                                                            ...newExercise,
                                                            sets: e.target.value
                                                        })}/>
                                                        <input type="text" placeholder="Повторення"
                                                               value={newExercise.reps} onChange={e => setNewExercise({
                                                            ...newExercise,
                                                            reps: e.target.value
                                                        })}/>
                                                        <input type="number" placeholder="Відпочинок (с)"
                                                               value={newExercise.rest} onChange={e => setNewExercise({
                                                            ...newExercise,
                                                            rest: e.target.value
                                                        })}/>
                                                    </div>
                                                    <div className="ex-form-actions">
                                                        <button className="ex-save-btn"
                                                                onClick={() => handleSaveNewExercise(day.id)}>Зберегти
                                                        </button>
                                                        <button className="ex-cancel-btn"
                                                                onClick={() => setAddingExerciseToDay(null)}>Скасувати
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="day-actions-footer">
                                                    <button className="add-exercise-btn"
                                                            onClick={() => setAddingExerciseToDay(day.id)}>+ Додати
                                                        вправу
                                                    </button>
                                                    <button className="toggle-day-btn subtle"
                                                            onClick={() => toggleRestDay(day.id)}>Зробити вихідним
                                                    </button>
                                                </div>
                                            )
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                        {isEditing && (
                            <div className="day-card add-day-card" onClick={handleAddDay}>
                                <div className="add-day-content">
                                    <span className="add-day-icon">+</span>
                                    <p>Додати день</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <button className="carousel-arrow right-arrow" onClick={() => scrollCarousel(1)}>›</button>
                </div>

            </div>
        </div>
    );
};

export default MyPlan;
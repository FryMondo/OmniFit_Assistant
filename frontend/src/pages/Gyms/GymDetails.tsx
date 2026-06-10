import React, {useState, useEffect} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {useAuth} from '../../context/AuthContext';
import './GymDetails.css';

interface DaySchedule {
    isOpen: boolean;
    openTime: string | null;
    closeTime: string | null;
}

interface GymSchedule {
    [key: string]: DaySchedule | undefined;
}

interface Trainer {
    id: string;
    name: string;
    specialization: string;
}

interface GymFullData {
    id: string;
    name: string;
    address: string;
    city: string;
    total_score: number;
    total_votes: number;
    description: string;
    equipment: string[];
    trainers: Trainer[];
    schedule: GymSchedule;
}

const defaultSchedule: GymSchedule = {
    monday: {isOpen: true, openTime: '08:00', closeTime: '22:00'},
    tuesday: {isOpen: true, openTime: '08:00', closeTime: '22:00'},
    wednesday: {isOpen: true, openTime: '08:00', closeTime: '22:00'},
    thursday: {isOpen: true, openTime: '08:00', closeTime: '22:00'},
    friday: {isOpen: true, openTime: '08:00', closeTime: '22:00'},
    saturday: {isOpen: true, openTime: '09:00', closeTime: '20:00'},
    sunday: {isOpen: false, openTime: null, closeTime: null}
};

const dayNames: Record<string, string> = {
    monday: 'Понеділок', tuesday: 'Вівторок', wednesday: 'Середа',
    thursday: 'Четвер', friday: 'П\'ятниця', saturday: 'Субота', sunday: 'Неділя'
};

const GymDetails: React.FC = () => {
    const {id} = useParams<{ id: string }>();
    const navigate = useNavigate();
    const {user, session} = useAuth();
    const API_BASE_URL = import.meta.env.VITE_API_URL;

    const [gymData, setGymData] = useState<GymFullData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());

    const [userRating, setUserRating] = useState<number>(0);
    const [hasVoted, setHasVoted] = useState(false);
    const [hoverRating, setHoverRating] = useState<number>(0);

    const [membershipStatus, setMembershipStatus] = useState<'pending' | 'active' | 'rejected' | null>(null);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (!id || !user || !session) return;

        const fetchAllData = async () => {
            setIsLoading(true);
            const headers = {'Authorization': `Bearer ${session.access_token}`};

            try {
                const gymRes = await fetch(`${API_BASE_URL}/gyms/${id}`, {headers});
                if (!gymRes.ok) throw new Error("Спортзал не знайдено");
                const gym = await gymRes.json();

                const eqRes = await fetch(`${API_BASE_URL}/equipment/gym/${id}`, {headers});
                const equipmentData = eqRes.ok ? await eqRes.json() : [];
                const equipmentList = equipmentData.map((e: any) => e.equipment_name);

                const membersRes = await fetch(`${API_BASE_URL}/memberships/gym/${id}`, {headers});
                let trainersList: Trainer[] = [];
                if (membersRes.ok) {
                    const members = await membersRes.json();
                    const staff = members.filter((m: any) => m.user_type === 'staff' && m.status === 'active');

                    trainersList = await Promise.all(
                        staff.map(async (s: any) => {
                            let name = s.profiles ? `${s.profiles.first_name} ${s.profiles.last_name}` : 'Тренер залу';
                            let specialization = s.profiles?.specialization || 'Фітнес інструктор';

                            if (!s.profiles && s.user_id) {
                                try {
                                    const profileRes = await fetch(`${API_BASE_URL}/profiles/${s.user_id}`, {headers});
                                    if (profileRes.ok) {
                                        const profileData = await profileRes.json();
                                        name = `${profileData.first_name} ${profileData.last_name}`;
                                        specialization = profileData.specialization || specialization;
                                    }
                                } catch (e) {
                                    console.error(`Не вдалося завантажити профіль тренера ${s.user_id}`, e);
                                }
                            }

                            return {
                                id: s.user_id,
                                name,
                                specialization
                            };
                        })
                    );
                }

                const userGymsRes = await fetch(`${API_BASE_URL}/memberships/user/${user.id}`, {headers});
                if (userGymsRes.ok) {
                    const userGyms = await userGymsRes.json();
                    const currentMembership = userGyms.find((m: any) => m.gym_id === id);
                    if (currentMembership) {
                        setMembershipStatus(currentMembership.status);
                    }
                }

                const reviewRes = await fetch(`${API_BASE_URL}/gym-reviews/check/${id}/${user.id}`, {headers});
                if (reviewRes.ok) {
                    const reviewData = await reviewRes.json();
                    if (reviewData.hasVoted) {
                        setHasVoted(true);
                        setUserRating(reviewData.score);
                    }
                }

                setGymData({
                    id: gym.id,
                    name: gym.name,
                    address: gym.address || 'Адресу не вказано',
                    city: gym.address ? gym.address.split(',')[0] : 'Локація',
                    total_score: gym.total_score || 0,
                    total_votes: gym.total_votes || 0,
                    description: gym.description || 'Опис цього залу ще не додано.',
                    schedule: gym.schedule || defaultSchedule,
                    equipment: equipmentList,
                    trainers: trainersList
                });

            } catch (error) {
                console.error(error);
                setGymData(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAllData();
    }, [id, user, session, API_BASE_URL]);

    const isGymOpenNow = (schedule: DaySchedule | undefined): boolean => {
        if (!schedule || !schedule.isOpen || !schedule.openTime || !schedule.closeTime) return false;
        const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
        const parseTime = (timeStr: string) => {
            const [hours, minutes] = timeStr.split(':').map(Number);
            return hours * 60 + minutes;
        };
        const openMinutes = parseTime(schedule.openTime);
        const closeMinutes = parseTime(schedule.closeTime);

        if (openMinutes <= closeMinutes) return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
        return currentMinutes >= openMinutes || currentMinutes < closeMinutes;
    };

    const handleRate = async (rating: number) => {
        if (hasVoted || !user || !session) return;

        try {
            const res = await fetch(`${API_BASE_URL}/gym-reviews`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({gym_id: id, user_id: user.id, score: rating})
            });

            if (res.ok) {
                setUserRating(rating);
                setHasVoted(true);
                setGymData(prev => prev ? {
                    ...prev,
                    total_score: prev.total_score + rating,
                    total_votes: prev.total_votes + 1
                } : null);
            } else {
                const data = await res.json();
                if (data.error && data.error.includes('вже залишали')) {
                    setHasVoted(true);
                } else {
                    alert("Не вдалося відправити відгук.");
                }
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleApplyToGym = async () => {
        if (membershipStatus || !user || !session) return;

        try {
            const res = await fetch(`${API_BASE_URL}/memberships`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    gym_id: id,
                    user_id: user.id,
                    user_type: user.role === 'coach' ? 'staff' : 'client',
                    status: 'pending'
                })
            });

            if (res.ok) {
                setMembershipStatus('pending');
                alert(`Вашу заявку успішно відправлено! Менеджер залу розгляне її найближчим часом.`);
            } else {
                alert('Не вдалося відправити заявку. Спробуйте пізніше.');
            }
        } catch (error) {
            console.error(error);
        }
    };

    if (isLoading) return <div className="loading-screen"
                               style={{color: 'white', textAlign: 'center', marginTop: '50px'}}>Завантаження даних
        спортзалу...</div>;
    if (!gymData) return <div className="error-screen"
                              style={{color: '#e74c3c', textAlign: 'center', marginTop: '50px'}}>Зал не знайдено</div>;

    const currentDayKey = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][currentTime.getDay()];
    const todaySchedule = gymData.schedule[currentDayKey];
    const isCurrentlyOpen = isGymOpenNow(todaySchedule);
    const averageRating = gymData.total_votes === 0 ? '0.0' : (gymData.total_score / gymData.total_votes).toFixed(1);

    return (
        <div className="gym-details-page">
            <div className="gym-details-content">

                <header className="gym-details-header">
                    <button className="back-btn" onClick={() => navigate(-1)}>‹ Назад</button>
                    <h1>Деталі спортзалу</h1>
                    <div className="header-spacer"></div>
                </header>

                <div className="gym-hero-section">
                    <div className="gym-title-row">
                        <h2 className="gym-full-name">{gymData.name}</h2>
                        <span className="gym-rating">⭐ {averageRating}</span>
                    </div>

                    <div className="gym-location-info">
                        <span className="city-tag">{gymData.city}</span>
                        <span className="address-text">{gymData.address}</span>
                    </div>

                    <div className={`status-banner ${isCurrentlyOpen ? 'open' : 'closed'}`}>
                        {isCurrentlyOpen ? '🟢 Зараз відчинено' : '🔴 Зараз зачинено'}
                    </div>

                    <div className="schedule-card">
                        {Object.keys(dayNames).map(dayKey => {
                            const dayData = gymData.schedule[dayKey];
                            const isToday = dayKey === currentDayKey;

                            return (
                                <div key={dayKey} className={`schedule-row ${isToday ? 'is-today' : ''}`}>
                                    <span className="day-name">{dayNames[dayKey]} {isToday && '(Сьогодні)'}</span>
                                    <span className={`day-hours ${!dayData?.isOpen ? 'closed-text' : ''}`}>
                                        {dayData?.isOpen ? `${dayData.openTime} - ${dayData.closeTime}` : 'Вихідний'}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="info-block">
                    <h3>Про зал</h3>
                    <p className="full-description">{gymData.description}</p>
                </div>

                <div className="info-block">
                    <h3>Наявне спорядження</h3>
                    <div className="equipment-tags">
                        {gymData.equipment.length > 0 ? (
                            gymData.equipment.map((item, index) => (
                                <span key={index} className="equipment-tag">{item}</span>
                            ))
                        ) : (
                            <span className="equipment-tag">Інформація щодо спорядження відсутня</span>
                        )}
                    </div>
                </div>

                <div className="info-block">
                    <h3>Тренерський штаб</h3>
                    <div className="trainers-list">
                        {gymData.trainers.length > 0 ? (
                            gymData.trainers.map(trainer => (
                                <div key={trainer.id} className="trainer-card">
                                    <div className="trainer-avatar">{trainer.name.charAt(0)}</div>
                                    <div className="trainer-info">
                                        <span className="trainer-name">{trainer.name}</span>
                                        <span className="trainer-spec">{trainer.specialization}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p style={{color: '#aaa', fontSize: '14px'}}>У цьому залі поки немає доданих тренерів.</p>
                        )}
                    </div>
                </div>

                <div className="apply-section">
                    <button
                        className={`apply-gym-btn ${membershipStatus ? 'disabled' : ''}`}
                        onClick={handleApplyToGym}
                        disabled={membershipStatus !== null}
                    >
                        {membershipStatus === 'active' ? '✓ Ви є учасником цього залу' :
                            membershipStatus === 'pending' ? 'Заявка в очікуванні...' :
                                membershipStatus === 'rejected' ? 'Заявку відхилено' :
                                    user?.role === 'coach' ? 'Подати заявку на роботу' :
                                        'Стати клієнтом залу'}
                    </button>
                </div>

                <div className="info-block rating-block">
                    <h3>{hasVoted ? 'Ваша оцінка' : 'Оцініть цей зал'}</h3>
                    <div className="stars-container">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                className={`star-btn ${star <= (hoverRating || userRating) ? 'active' : ''} ${hasVoted ? 'disabled' : ''}`}
                                onMouseEnter={() => !hasVoted && setHoverRating(star)}
                                onMouseLeave={() => !hasVoted && setHoverRating(0)}
                                onClick={() => handleRate(star)}
                                disabled={hasVoted}
                            >
                                ★
                            </button>
                        ))}
                    </div>
                    {hasVoted && <p className="thank-you-text">Дякуємо за ваш відгук!</p>}
                </div>

            </div>
        </div>
    );
};

export default GymDetails;
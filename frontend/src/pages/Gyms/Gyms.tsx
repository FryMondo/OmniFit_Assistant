import React, {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {useAuth} from '../../context/AuthContext';
import './Gyms.css';

export interface DaySchedule {
    isOpen: boolean;
    openTime: string | null;
    closeTime: string | null;
}

export interface GymSchedule {
    monday?: DaySchedule;
    tuesday?: DaySchedule;
    wednesday?: DaySchedule;
    thursday?: DaySchedule;
    friday?: DaySchedule;
    saturday?: DaySchedule;
    sunday?: DaySchedule;

    [key: string]: DaySchedule | undefined;
}

export interface Gym {
    id: string;
    manager_id: string;
    name: string;
    address: string | null;
    description: string | null;
    total_score: number;
    total_votes: number;
    schedule?: GymSchedule;
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

const Gyms: React.FC = () => {
    const navigate = useNavigate();
    const {session} = useAuth();
    const API_BASE_URL = import.meta.env.VITE_API_URL;

    const [allGyms, setAllGyms] = useState<Gym[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const gymsPerPage = 5;

    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const fetchGyms = async () => {
            setIsLoading(true);
            try {
                const headers = session ? {'Authorization': `Bearer ${session.access_token}`} : {};

                const res = await fetch(`${API_BASE_URL}/gyms`, {headers});

                if (res.ok) {
                    const data = await res.json();
                    setAllGyms(data);
                }
            } catch (error) {
                console.error("Помилка завантаження спортзалів:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchGyms();
    }, [session, API_BASE_URL]);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const filteredGyms = allGyms.filter(gym => {
        const query = searchQuery.toLowerCase();
        const matchName = gym.name.toLowerCase().includes(query);
        const matchAddress = gym.address ? gym.address.toLowerCase().includes(query) : false;
        return matchName || matchAddress;
    });

    const indexOfLastGym = currentPage * gymsPerPage;
    const indexOfFirstGym = indexOfLastGym - gymsPerPage;
    const currentGyms = filteredGyms.slice(indexOfFirstGym, indexOfLastGym);
    const totalPages = Math.ceil(filteredGyms.length / gymsPerPage);

    const handleSearchSelect = (query: string) => {
        setSearchQuery(query);
        setCurrentPage(1);
    };

    const calculateRating = (score?: number, votes?: number): string => {
        if (!score || !votes || votes === 0) return '0.0';
        return (score / votes).toFixed(1);
    };

    const getTodaySchedule = (schedule?: GymSchedule): DaySchedule | undefined => {
        const activeSchedule = (schedule && Object.keys(schedule).length > 0) ? schedule : defaultSchedule;
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const today = days[currentTime.getDay()];
        return activeSchedule[today];
    };

    const isGymOpenNow = (schedule: DaySchedule | undefined): boolean => {
        if (!schedule || !schedule.isOpen || !schedule.openTime || !schedule.closeTime) {
            return false;
        }

        const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

        const parseTime = (timeStr: string) => {
            const [hours, minutes] = timeStr.split(':').map(Number);
            return hours * 60 + minutes;
        };

        const openMinutes = parseTime(schedule.openTime);
        const closeMinutes = parseTime(schedule.closeTime);

        if (openMinutes <= closeMinutes) {
            return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
        } else {
            return currentMinutes >= openMinutes || currentMinutes < closeMinutes;
        }
    };

    return (
        <div className="gyms-page">
            <div className="gyms-content">

                <header className="gyms-header">
                    <button className="back-btn" onClick={() => navigate(-1)}>‹ Назад</button>
                    <h1>Спортзали</h1>
                    <div className="header-spacer"></div>
                </header>

                <div className="search-section">
                    <div className="search-input-wrapper">
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            placeholder="Пошук за назвою або адресою..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>
                </div>

                <div className="gyms-list">
                    {isLoading ? (
                        <p style={{textAlign: 'center', color: '#888'}}>Завантаження залів...</p>
                    ) : currentGyms.length > 0 ? (
                        currentGyms.map(gym => {
                            const todaySchedule = getTodaySchedule(gym.schedule);
                            const rating = calculateRating(gym.total_score, gym.total_votes);
                            const isCurrentlyOpen = isGymOpenNow(todaySchedule);

                            const cityTag = gym.address ? gym.address.split(',')[0] : 'Локація';

                            return (
                                <div key={gym.id} className="gym-card" onClick={() => navigate(`/gyms/${gym.id}`)}>
                                    <div className="gym-card-header">
                                        <h3 className="gym-name">{gym.name}</h3>
                                        <span className="gym-rating">⭐ {rating}</span>
                                    </div>

                                    <div className="gym-location-container">
                                        <div className="gym-location">
                                            <span className="city-tag">{cityTag}</span>
                                            <span className="address-text">{gym.address || 'Адресу не вказано'}</span>
                                        </div>
                                        <div className="gym-hours">
                                            <span className="hours-icon">🕒</span>
                                            <span className="hours-text">
                                                {todaySchedule?.isOpen
                                                    ? `Графік: ${todaySchedule.openTime} - ${todaySchedule.closeTime}`
                                                    : 'Сьогодні: Вихідний'}
                                            </span>
                                        </div>
                                    </div>

                                    <p className="gym-description">{gym.description || 'Опис відсутній.'}</p>

                                    <div className="gym-card-footer">
                                        <span className={`status-badge ${isCurrentlyOpen ? 'open' : 'closed'}`}>
                                            {isCurrentlyOpen ? 'Зараз відчинено' : 'Зараз зачинено'}
                                        </span>
                                        <span className="details-link">Детальніше ›</span>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="no-results">
                            <p>За вашим запитом нічого не знайдено 😔</p>
                            <button className="reset-search-btn" onClick={() => handleSearchSelect('')}>
                                Показати всі зали
                            </button>
                        </div>
                    )}
                </div>

                {totalPages > 1 && (
                    <div className="pagination">
                        <button
                            className="page-btn nav-btn"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => prev - 1)}
                        >
                            ‹
                        </button>

                        {Array.from({length: totalPages}, (_, i) => i + 1).map(number => (
                            <button
                                key={number}
                                className={`page-btn ${currentPage === number ? 'active' : ''}`}
                                onClick={() => setCurrentPage(number)}
                            >
                                {number}
                            </button>
                        ))}

                        <button
                            className="page-btn nav-btn"
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(prev => prev + 1)}
                        >
                            ›
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
};

export default Gyms;
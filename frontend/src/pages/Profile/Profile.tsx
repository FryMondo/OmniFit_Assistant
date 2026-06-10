import React, {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {useAuth} from '../../context/AuthContext';
import './Profile.css';

interface UserProfile {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
    role: 'athlete' | 'coach' | 'manager';
}

interface ConnectionRequest {
    id: string;
    targetUser: UserProfile;
    status: 'pending' | 'active' | 'rejected';
}

interface GymInfo {
    id: string;
    name: string;
}

const Profile: React.FC = () => {
    const navigate = useNavigate();
    const {user, session} = useAuth();
    const API_BASE_URL = import.meta.env.VITE_API_URL;

    const [activeTab, setActiveTab] = useState<'metrics' | 'network' | 'settings'>('metrics');

    const [profileData, setProfileData] = useState<UserProfile | null>(null);
    const [editForm, setEditForm] = useState({
        firstName: '',
        lastName: '',
        gender: 'male',
        dob: '',
        weight: 0,
        height: 0,
        experienceLevel: 'beginner',
        goal: 'muscle_gain',
        injuries: ''
    });

    const [isLoading, setIsLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResult, setSearchResult] = useState<UserProfile | null>(null);
    const [searchError, setSearchError] = useState('');
    const [activeConnections, setActiveConnections] = useState<ConnectionRequest[]>([]);
    const [pendingRequests, setPendingRequests] = useState<ConnectionRequest[]>([]);
    const [myGyms, setMyGyms] = useState<GymInfo[]>([]);

    useEffect(() => {
        if (!user || !session) return;

        const fetchAllData = async () => {
            setIsLoading(true);
            const headers = {'Authorization': `Bearer ${session.access_token}`};

            try {
                const profileRes = await fetch(`${API_BASE_URL}/profiles/${user.id}`, {headers});
                let fetchedProfile = null;
                if (profileRes.ok) {
                    fetchedProfile = await profileRes.json();
                    setProfileData(fetchedProfile);
                }

                const metricsRes = await fetch(`${API_BASE_URL}/metrics/${user.id}`, {headers});
                let metrics: any = {};
                if (metricsRes.ok) {
                    metrics = await metricsRes.json();
                }

                setEditForm({
                    firstName: fetchedProfile?.first_name || user.firstName || '',
                    lastName: fetchedProfile?.last_name || user.lastName || '',
                    gender: metrics.gender || 'male',
                    dob: metrics.date_of_birth || '',
                    weight: metrics.weight_kg || 0,
                    height: metrics.height_cm || 0,
                    experienceLevel: metrics.experience_level || 'beginner',
                    goal: metrics.goal || 'muscle_gain',
                    injuries: (metrics.injuries && metrics.injuries.length > 0) ? metrics.injuries[0] : ''
                });

                if (user.role !== 'manager') {
                    const roleEndpoint = user.role === 'coach' ? `coach/${user.id}` : `athlete/${user.id}`;
                    const relationsRes = await fetch(`${API_BASE_URL}/relations/${roleEndpoint}`, {headers});

                    if (relationsRes.ok) {
                        const relationsData = await relationsRes.json();

                        const formattedRelations: ConnectionRequest[] = await Promise.all(
                            relationsData.map(async (rel: any) => {
                                const target = user.role === 'athlete' ? rel.coach : rel.athlete;
                                const targetId = target?.id || (user.role === 'athlete' ? rel.coach_id : rel.athlete_id);

                                let fName = target?.first_name || target?.profiles?.first_name || 'Ім\'я';
                                let lName = target?.last_name || target?.profiles?.last_name || 'Невідомо';
                                let uname = target?.username || 'user';
                                let urole = target?.role || (user.role === 'athlete' ? 'coach' : 'athlete');

                                if ((fName === 'Ім\'я' || lName === 'Невідомо') && targetId) {
                                    try {
                                        const profRes = await fetch(`${API_BASE_URL}/profiles/${targetId}`, {headers});
                                        if (profRes.ok) {
                                            const pData = await profRes.json();
                                            fName = pData.first_name || fName;
                                            lName = pData.last_name || lName;
                                            uname = pData.username || uname;
                                            urole = pData.role || urole;
                                        }
                                    } catch (e) {
                                        console.error('Не вдалося завантажити профіль', e);
                                    }
                                }

                                return {
                                    id: rel.id,
                                    status: rel.status,
                                    targetUser: {
                                        id: targetId,
                                        username: uname,
                                        first_name: fName,
                                        last_name: lName,
                                        role: urole
                                    }
                                };
                            })
                        );

                        setActiveConnections(formattedRelations.filter(r => r.status === 'active'));
                        setPendingRequests(formattedRelations.filter(r => r.status === 'pending'));
                    }
                }

                const membershipsRes = await fetch(`${API_BASE_URL}/memberships/user/${user.id}`, {headers});
                if (membershipsRes.ok) {
                    const membershipsData = await membershipsRes.json();
                    const activeMemberships = membershipsData.filter((m: any) => m.status === 'active');

                    const gymsList = await Promise.all(activeMemberships.map(async (m: any) => {
                        if (m.gyms) return {id: m.gym_id, name: m.gyms.name};

                        try {
                            const gRes = await fetch(`${API_BASE_URL}/gyms/${m.gym_id}`, {headers});
                            if (gRes.ok) {
                                const gData = await gRes.json();
                                return {id: m.gym_id, name: gData.name};
                            }
                        } catch (e) {
                            console.error(e);
                        }

                        return {id: m.gym_id, name: 'Спортзал'};
                    }));
                    setMyGyms(gymsList);
                }

            } catch (error) {
                console.error("Помилка завантаження профілю:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAllData();
    }, [user, session, API_BASE_URL]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !session) return;

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
        };

        try {
            await fetch(`${API_BASE_URL}/profiles/${user.id}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({
                    first_name: editForm.firstName,
                    last_name: editForm.lastName
                })
            });

            await fetch(`${API_BASE_URL}/metrics/${user.id}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({
                    gender: editForm.gender,
                    date_of_birth: editForm.dob,
                    weight_kg: editForm.weight,
                    height_cm: editForm.height,
                    experience_level: editForm.experienceLevel,
                    goal: editForm.goal,
                    injuries: editForm.injuries ? [editForm.injuries] : []
                })
            });

            if (profileData) {
                setProfileData({
                    ...profileData,
                    first_name: editForm.firstName,
                    last_name: editForm.lastName
                });
            }

            alert('Дані успішно збережено!');
            setActiveTab('metrics');
        } catch (error) {
            console.error("Помилка збереження:", error);
            alert("Не вдалося зберегти дані.");
        }
    };

    const handleExactSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session || !user) return;

        setSearchError('');
        setSearchResult(null);

        const query = searchQuery.trim().toLowerCase();
        if (!query) return;

        if (profileData && query === profileData.username.toLowerCase()) {
            setSearchError('Ви не можете шукати самого себе.');
            return;
        }

        try {
            const res = await fetch(`${API_BASE_URL}/profiles/search/${query}`, {
                headers: {'Authorization': `Bearer ${session.access_token}`}
            });

            if (res.ok) {
                const foundUser = await res.json();

                if (foundUser.role === 'manager') {
                    setSearchError('Менеджерів залів не можна додавати у зв\'язки.');
                    return;
                }
                if (foundUser.role === user.role) {
                    const targetRoleStr = user.role === 'athlete' ? 'тренерів' : 'клієнтів';
                    setSearchError(`У системі ви можете шукати лише ${targetRoleStr}.`);
                    return;
                }

                setSearchResult(foundUser);
            } else {
                setSearchError('Користувача з таким @username не знайдено.');
            }
        } catch (error) {
            setSearchError('Помилка сервера під час пошуку.');
        }
    };

    const handleSendRequest = async () => {
        if (!searchResult || !user || !session) return;

        const alreadyExists = pendingRequests.some(req => req.targetUser.id === searchResult.id) ||
            activeConnections.some(conn => conn.targetUser.id === searchResult.id);

        if (alreadyExists) {
            alert('У вас вже є активний зв\'язок або заявка до цього користувача.');
            return;
        }

        const coach_id = user.role === 'coach' ? user.id : searchResult.id;
        const athlete_id = user.role === 'athlete' ? user.id : searchResult.id;

        try {
            const res = await fetch(`${API_BASE_URL}/relations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({coach_id, athlete_id})
            });

            if (res.ok) {
                const newRelation = await res.json();
                const newReq: ConnectionRequest = {
                    id: newRelation.id,
                    status: 'pending',
                    targetUser: searchResult
                };

                setPendingRequests([...pendingRequests, newReq]);
                setSearchResult(null);
                setSearchQuery('');
                alert('Заявку успішно відправлено!');
            } else {
                throw new Error('Помилка створення заявки');
            }
        } catch (error) {
            alert("Не вдалося відправити заявку. Можливо, вона вже існує.");
        }
    };

    const handleRemoveConnection = async (id: string) => {
        if (!session || !window.confirm('Ви впевнені, що хочете видалити цей зв\'язок?')) return;
        try {
            await fetch(`${API_BASE_URL}/relations/${id}`, {
                method: 'DELETE',
                headers: {'Authorization': `Bearer ${session.access_token}`}
            });
            setPendingRequests(prev => prev.filter(req => req.id !== id));
            setActiveConnections(prev => prev.filter(conn => conn.id !== id));
        } catch (error) {
            alert("Помилка при видаленні зв'язку.");
        }
    };

    const calculateAge = (dateString: string) => {
        if (!dateString) return 0;
        const today = new Date();
        const birthDate = new Date(dateString);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
        return age;
    };

    if (isLoading) {
        return <div style={{color: 'white', textAlign: 'center', marginTop: '50px'}}>Завантаження профілю...</div>;
    }

    const currentAge = calculateAge(editForm.dob);
    const displayFirstName = profileData?.first_name || editForm.firstName;
    const displayLastName = profileData?.last_name || editForm.lastName;
    const displayUsername = profileData?.username || user?.username || 'user';

    return (
        <div className="profile-page">
            <div className="profile-content">

                <header className="profile-header">
                    <button className="back-btn" onClick={() => navigate(-1)}>‹ Назад</button>
                    <h1>Мій профіль</h1>
                    <div className="header-spacer"></div>
                </header>

                <div className="avatar-section">
                    <div className="avatar-circle">
                        {displayFirstName.charAt(0)}{displayLastName.charAt(0)}
                    </div>
                    <div className="user-names">
                        <h2>{displayFirstName} {displayLastName}</h2>
                        <p>@{displayUsername}</p>
                    </div>
                </div>

                <div className="profile-tabs-nav">
                    <button className={`p-tab ${activeTab === 'metrics' ? 'active' : ''}`}
                            onClick={() => setActiveTab('metrics')}>Метрики
                    </button>
                    <button className={`p-tab ${activeTab === 'network' ? 'active' : ''}`}
                            onClick={() => setActiveTab('network')}>Мережа
                    </button>
                    <button className={`p-tab ${activeTab === 'settings' ? 'active' : ''}`}
                            onClick={() => setActiveTab('settings')}>Налаштування
                    </button>
                </div>

                {activeTab === 'metrics' && (
                    <div className="profile-view">
                        <div className="stats-grid">
                            <div className="stat-card">
                                <span className="stat-value">{editForm.weight} <small>кг</small></span>
                                <span className="stat-label">Вага</span>
                            </div>
                            <div className="stat-card">
                                <span className="stat-value">{editForm.height} <small>см</small></span>
                                <span className="stat-label">Зріст</span>
                            </div>
                            <div className="stat-card">
                                <span className="stat-value">{currentAge} <small>років</small></span>
                                <span className="stat-label">Вік</span>
                            </div>
                        </div>

                        <div className="details-section">
                            <div className="detail-row">
                                <span className="detail-title">Стать</span>
                                <span
                                    className="detail-value">{editForm.gender === 'male' ? 'Чоловіча' : 'Жіноча'}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-title">Рівень підготовки</span>
                                <span className="detail-value">
                                    {editForm.experienceLevel === 'beginner' ? 'Новачок' :
                                        editForm.experienceLevel === 'intermediate' ? 'Середній (Любитель)' : 'Досвідчений (Профі)'}
                                </span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-title">Головна ціль</span>
                                <span className="detail-value">
                                    {editForm.goal === 'weight_loss' ? 'Схуднення' :
                                        editForm.goal === 'muscle_gain' ? 'Набір маси' :
                                            editForm.goal === 'strength' ? 'Розвиток сили' : 'Розвиток витривалості'}
                                </span>
                            </div>
                            <div className="detail-row injuries-row">
                                <span className="detail-title">Травми та обмеження</span>
                                <div className="injuries-box">
                                    {editForm.injuries ? <p>{editForm.injuries}</p> :
                                        <p className="no-injuries">Немає травм</p>}
                                </div>
                            </div>
                        </div>

                        <div className="view-actions">
                            <button className="edit-profile-btn" onClick={() => setActiveTab('settings')}>
                                Оновити метрики
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'network' && (
                    <div className="network-view">
                        <div className="network-section">
                            <h3>Знайти користувача</h3>
                            <form className="exact-search-form" onSubmit={handleExactSearch}>
                                <span className="at-symbol">@</span>
                                <input
                                    type="text"
                                    placeholder="username..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                                <button type="submit">Знайти</button>
                            </form>

                            {searchError && <p className="search-error-msg">{searchError}</p>}

                            {searchResult && (
                                <div className="search-result-card">
                                    <div className="res-info">
                                        <div className="res-avatar">{searchResult.first_name?.charAt(0) || '?'}</div>
                                        <div>
                                            <p className="res-name">{searchResult.first_name} {searchResult.last_name}</p>
                                            <p className="res-role">{searchResult.role === 'coach' ? 'Тренер' : 'Спортсмен'}</p>
                                        </div>
                                    </div>
                                    <button className="send-req-btn" onClick={handleSendRequest}>Відправити заявку
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="network-section">
                            <h3>Мої спортзали</h3>
                            <div className="connections-list">
                                {myGyms.length > 0 ? (
                                    myGyms.map(gym => (
                                        <div key={gym.id} className="connection-card active-conn">
                                            <div className="conn-info">
                                                <span className="conn-name">{gym.name}</span>
                                                <span className="conn-role">Спортзал</span>
                                            </div>
                                            <button className="go-to-plan-btn"
                                                    onClick={() => navigate(`/gyms/${gym.id}`)}>
                                                Деталі
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <p className="no-connections-text">Ви не приєднані до жодного залу.</p>
                                )}
                            </div>
                        </div>

                        {pendingRequests.length > 0 && (
                            <div className="network-section">
                                <h3>Відправлені заявки</h3>
                                <div className="connections-list">
                                    {pendingRequests.map(req => (
                                        <div key={req.id} className="connection-card pending-conn">
                                            <div className="conn-info">
                                                <span
                                                    className="conn-name">{req.targetUser.first_name} {req.targetUser.last_name}</span>
                                                <span className="conn-status">В очікуванні</span>
                                            </div>
                                            <button className="cancel-req-btn"
                                                    onClick={() => handleRemoveConnection(req.id)}>Скасувати
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="network-section">
                            <h3>Мої зв'язки</h3>
                            <div className="connections-list">
                                {activeConnections.length > 0 ? (
                                    activeConnections.map(conn => (
                                        <div key={conn.id} className="connection-card active-conn">
                                            <div className="conn-info">
                                                <span
                                                    className="conn-name">{conn.targetUser.first_name} {conn.targetUser.last_name}</span>
                                                <span
                                                    className="conn-role">{conn.targetUser.role === 'coach' ? 'Мій тренер' : 'Мій клієнт'}</span>
                                            </div>
                                            <button
                                                className="cancel-req-btn"
                                                onClick={() => handleRemoveConnection(conn.id)}
                                                style={{color: '#e74c3c', borderColor: 'rgba(231, 76, 60, 0.3)'}}
                                            >
                                                Видалити
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <p className="no-connections-text">У вас поки немає активних зв'язків.</p>
                                )}
                            </div>
                        </div>

                    </div>
                )}

                {activeTab === 'settings' && (
                    <form className="profile-form" onSubmit={handleSave}>
                        <div className="input-row">
                            <div className="input-group">
                                <label>Ім'я</label>
                                <input type="text" value={editForm.firstName}
                                       onChange={e => setEditForm({...editForm, firstName: e.target.value})} required/>
                            </div>
                            <div className="input-group">
                                <label>Прізвище</label>
                                <input type="text" value={editForm.lastName}
                                       onChange={e => setEditForm({...editForm, lastName: e.target.value})} required/>
                            </div>
                        </div>

                        <div className="input-row">
                            <div className="input-group">
                                <label>Стать</label>
                                <select value={editForm.gender}
                                        onChange={e => setEditForm({...editForm, gender: e.target.value})}>
                                    <option value="male">Чоловік</option>
                                    <option value="female">Жінка</option>
                                </select>
                            </div>
                            <div className="input-group">
                                <label>Дата народження</label>
                                <input type="date" value={editForm.dob}
                                       onChange={e => setEditForm({...editForm, dob: e.target.value})} required/>
                            </div>
                        </div>

                        <div className="input-row">
                            <div className="input-group">
                                <label>Вага (кг)</label>
                                <input type="number" value={editForm.weight || ''}
                                       onChange={e => setEditForm({...editForm, weight: Number(e.target.value)})}
                                       required/>
                            </div>
                            <div className="input-group">
                                <label>Зріст (см)</label>
                                <input type="number" value={editForm.height || ''}
                                       onChange={e => setEditForm({...editForm, height: Number(e.target.value)})}
                                       required/>
                            </div>
                        </div>

                        <div className="input-group">
                            <label>Рівень досвіду</label>
                            <select value={editForm.experienceLevel}
                                    onChange={e => setEditForm({...editForm, experienceLevel: e.target.value})}>
                                <option value="beginner">Новачок</option>
                                <option value="intermediate">Середній (Любитель)</option>
                                <option value="advanced">Досвідчений (Профі)</option>
                            </select>
                        </div>

                        <div className="input-group">
                            <label>Головна ціль</label>
                            <select value={editForm.goal}
                                    onChange={e => setEditForm({...editForm, goal: e.target.value})}>
                                <option value="muscle_gain">Набір маси</option>
                                <option value="weight_loss">Схуднення</option>
                                <option value="strength">Розвиток сили</option>
                                <option value="endurance">Розвиток витривалості</option>
                            </select>
                        </div>

                        <div className="input-group">
                            <label>Травми / Обмеження (необов'язково)</label>
                            <textarea
                                rows={3}
                                placeholder='Опишіть ваші травми, наприклад "біль в коліні"...'
                                value={editForm.injuries}
                                onChange={e => setEditForm({...editForm, injuries: e.target.value})}
                            ></textarea>
                        </div>

                        <div className="edit-actions">
                            <button type="submit" className="save-btn">Зберегти зміни</button>
                            <button type="button" className="cancel-create-btn"
                                    onClick={() => setActiveTab('metrics')}>Скасувати
                            </button>
                        </div>
                    </form>
                )}

            </div>
        </div>
    );
};

export default Profile;
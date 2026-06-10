import React, {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {useAuth} from '../../context/AuthContext';
import './CoachClients.css';

interface Client {
    relationId: string;
    athleteId: string;
    firstName: string;
    lastName: string;
    goal?: string;
}

const translateGoal = (goalKey?: string) => {
    switch (goalKey) {
        case 'weight_loss':
            return 'Схуднення';
        case 'muscle_gain':
            return 'Набір маси';
        case 'strength':
            return 'Розвиток сили';
        case 'endurance':
            return 'Розвиток витривалості';
        default:
            return 'Ціль не вказана';
    }
};

const CoachClients: React.FC = () => {
    const navigate = useNavigate();
    const {user, session} = useAuth();
    const API_BASE_URL = import.meta.env.VITE_API_URL;

    const [activeTab, setActiveTab] = useState<'active' | 'requests'>('active');
    const [isLoading, setIsLoading] = useState(true);

    const [activeClients, setActiveClients] = useState<Client[]>([]);
    const [pendingRequests, setPendingRequests] = useState<Client[]>([]);

    useEffect(() => {
        if (!user || !session || user.role !== 'coach') return;

        const fetchClients = async () => {
            setIsLoading(true);
            try {
                const headers = {'Authorization': `Bearer ${session.access_token}`};
                const res = await fetch(`${API_BASE_URL}/relations/coach/${user.id}`, {headers});

                if (res.ok) {
                    const relations = await res.json();

                    const formattedClients: Client[] = await Promise.all(
                        relations.map(async (rel: any) => {
                            let firstName = rel.athlete?.first_name || rel.athlete?.profiles?.first_name || 'Ім\'я';
                            let lastName = rel.athlete?.last_name || rel.athlete?.profiles?.last_name || 'Невідомо';
                            const athleteId = rel.athlete?.id || rel.athlete_id;
                            let clientGoal = 'Ціль не вказана';

                            if (athleteId) {
                                if (firstName === 'Ім\'я' || lastName === 'Невідомо') {
                                    try {
                                        const profileRes = await fetch(`${API_BASE_URL}/profiles/${athleteId}`, {headers});
                                        if (profileRes.ok) {
                                            const profileData = await profileRes.json();
                                            firstName = profileData.first_name || firstName;
                                            lastName = profileData.last_name || lastName;
                                        }
                                    } catch (e) {
                                        console.error(`Не вдалося завантажити профіль для ${athleteId}`, e);
                                    }
                                }

                                try {
                                    const metricsRes = await fetch(`${API_BASE_URL}/metrics/${athleteId}`, {headers});
                                    if (metricsRes.ok) {
                                        const metricsData = await metricsRes.json();
                                        clientGoal = translateGoal(metricsData.goal);
                                    }
                                } catch (e) {
                                    console.error(`Не вдалося завантажити метрики для ${athleteId}`, e);
                                }
                            }

                            return {
                                relationId: rel.id,
                                athleteId,
                                firstName,
                                lastName,
                                goal: clientGoal
                            };
                        })
                    );

                    setActiveClients(formattedClients.filter((_, index: number) => relations[index].status === 'active'));
                    setPendingRequests(formattedClients.filter((_, index: number) => relations[index].status === 'pending'));
                }
            } catch (error) {
                console.error("Помилка завантаження клієнтів:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchClients();
    }, [user, session, API_BASE_URL]);

    const handleAccept = async (relationId: string) => {
        if (!session) return;
        try {
            const res = await fetch(`${API_BASE_URL}/relations/${relationId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({status: 'active'})
            });

            if (res.ok) {
                const clientToAccept = pendingRequests.find(c => c.relationId === relationId);
                if (clientToAccept) {
                    setPendingRequests(pendingRequests.filter(c => c.relationId !== relationId));
                    setActiveClients([...activeClients, clientToAccept]);
                }
                alert("Заявку успішно прийнято!");
            } else {
                throw new Error("Не вдалося прийняти заявку");
            }
        } catch (error) {
            console.error("Помилка прийняття заявки:", error);
            alert("Помилка оновлення статусу.");
        }
    };

    const handleReject = async (relationId: string) => {
        if (!session) return;
        try {
            const res = await fetch(`${API_BASE_URL}/relations/${relationId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({status: 'rejected'})
            });

            if (res.ok) {
                setPendingRequests(pendingRequests.filter(c => c.relationId !== relationId));
            } else {
                throw new Error("Не вдалося відхилити заявку");
            }
        } catch (error) {
            console.error("Помилка відхилення заявки:", error);
            alert("Помилка оновлення статусу.");
        }
    };

    if (user?.role !== 'coach') {
        return <div className="error-screen">Ця сторінка доступна лише для тренерів.</div>;
    }

    return (
        <div className="clients-page">
            <div className="clients-content">

                <header className="clients-header">
                    <button className="back-btn" onClick={() => navigate(-1)}>‹ Назад</button>
                    <h1>Мої клієнти</h1>
                    <div className="header-spacer"></div>
                </header>

                <div className="tabs-container">
                    <button
                        className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
                        onClick={() => setActiveTab('active')}
                    >
                        Активні ({activeClients.length})
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
                        onClick={() => setActiveTab('requests')}
                    >
                        Заявки
                        {pendingRequests.length > 0 && <span className="badge">{pendingRequests.length}</span>}
                    </button>
                </div>

                <div className="tab-content">

                    {isLoading ? (
                        <p style={{textAlign: 'center', color: '#888', marginTop: '20px'}}>Завантаження клієнтів...</p>
                    ) : activeTab === 'active' ? (
                        <div className="clients-list">
                            {activeClients.length > 0 ? (
                                activeClients.map(client => (
                                    <div key={client.relationId} className="client-card active-card">
                                        <div className="client-info">
                                            <div className="client-avatar">
                                                {client.firstName.charAt(0)}{client.lastName.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="client-name">{client.firstName} {client.lastName}</h3>
                                                <p className="client-goal">Ціль: {client.goal}</p>
                                            </div>
                                        </div>
                                        <div className="client-actions">
                                            <button className="action-btn nutrition"
                                                    onClick={() => navigate(`/nutrition/${client.athleteId}`)}>
                                                Харчування
                                            </button>
                                            <button className="action-btn workouts"
                                                    onClick={() => navigate(`/workouts/${client.athleteId}`)}>
                                                Тренування
                                            </button>
                                            <button className="action-btn plan"
                                                    onClick={() => navigate(`/my-plan/${client.athleteId}`)}>
                                                План (Редагувати)
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="empty-state">У вас поки немає активних клієнтів.</p>
                            )}
                        </div>
                    ) : (
                        <div className="clients-list">
                            {pendingRequests.length > 0 ? (
                                pendingRequests.map(client => (
                                    <div key={client.relationId} className="client-card request-card">
                                        <div className="client-info">
                                            <div className="client-avatar pending-avatar">
                                                {client.firstName.charAt(0)}{client.lastName.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="client-name">{client.firstName} {client.lastName}</h3>
                                                <p className="client-goal">Ціль: {client.goal}</p>
                                            </div>
                                        </div>
                                        <div className="request-actions">
                                            <button className="req-btn accept"
                                                    onClick={() => handleAccept(client.relationId)}>
                                                ✓ Прийняти
                                            </button>
                                            <button className="req-btn reject"
                                                    onClick={() => handleReject(client.relationId)}>
                                                ✕ Відхилити
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="empty-state">Нових заявок немає.</p>
                            )}
                        </div>
                    )}

                </div>

            </div>
        </div>
    );
};

export default CoachClients;
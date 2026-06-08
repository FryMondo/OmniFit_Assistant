import React, {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {useAuth} from '../../context/AuthContext';
import './ManagerDashboard.css';

interface DaySchedule {
    isOpen: boolean;
    openTime: string;
    closeTime: string;
}

interface GymSchedule {
    [key: string]: DaySchedule;
}

interface EquipmentItem {
    id: string;
    name: string;
    quantity: number;
    isAvailable: boolean;
}

interface MemberItem {
    id: string;
    userId: string;
    firstName: string;
    lastName: string;
    specialization?: string;
    status: 'pending' | 'active' | 'rejected';
}

const ManagerDashboard: React.FC = () => {
    const navigate = useNavigate();
    const {user, session} = useAuth();
    const API_BASE_URL = import.meta.env.VITE_API_URL;

    const [activeTab, setActiveTab] = useState<'main' | 'schedule' | 'equipment' | 'staff' | 'clients'>('main');
    const [isLoading, setIsLoading] = useState(true);
    const [managedGymId, setManagedGymId] = useState<string | null>(null);

    const [gymInfo, setGymInfo] = useState({
        name: '', address: '', city: '', description: ''
    });

    const defaultSchedule: GymSchedule = {
        monday: {isOpen: true, openTime: '08:00', closeTime: '22:00'},
        tuesday: {isOpen: true, openTime: '08:00', closeTime: '22:00'},
        wednesday: {isOpen: true, openTime: '08:00', closeTime: '22:00'},
        thursday: {isOpen: true, openTime: '08:00', closeTime: '22:00'},
        friday: {isOpen: true, openTime: '08:00', closeTime: '22:00'},
        saturday: {isOpen: true, openTime: '09:00', closeTime: '20:00'},
        sunday: {isOpen: false, openTime: '00:00', closeTime: '00:00'}
    };

    const [schedule, setSchedule] = useState<GymSchedule>(defaultSchedule);

    const dayLabels: Record<string, string> = {
        monday: 'Понеділок', tuesday: 'Вівторок', wednesday: 'Середа',
        thursday: 'Четвер', friday: 'П\'ятниця', saturday: 'Субота', sunday: 'Неділя'
    };

    const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
    const [newEqName, setNewEqName] = useState('');
    const [newEqQty, setNewEqQty] = useState(1);

    const [trainers, setTrainers] = useState<MemberItem[]>([]);
    const [clients, setClients] = useState<MemberItem[]>([]);

    useEffect(() => {
        if (!user || !session) return;

        const fetchDashboardData = async () => {
            setIsLoading(true);
            const headers = {'Authorization': `Bearer ${session.access_token}`};

            try {
                const gymsRes = await fetch(`${API_BASE_URL}/gyms`, {headers});
                if (!gymsRes.ok) throw new Error('Помилка завантаження залів');
                const allGyms = await gymsRes.json();

                const myGym = allGyms.find((g: any) => g.manager_id === user.id);
                if (!myGym) {
                    setIsLoading(false);
                    return;
                }

                setManagedGymId(myGym.id);
                setGymInfo({
                    name: myGym.name || '',
                    city: myGym.address ? myGym.address.split(',')[0].trim() : '',
                    address: myGym.address ? myGym.address.split(',').slice(1).join(',').trim() : '',
                    description: myGym.description || ''
                });

                if (myGym.schedule && Object.keys(myGym.schedule).length > 0) {
                    setSchedule({...defaultSchedule, ...myGym.schedule});
                }

                const eqRes = await fetch(`${API_BASE_URL}/equipment/gym/${myGym.id}`, {headers});
                if (eqRes.ok) {
                    const eqData = await eqRes.json();
                    setEquipment(eqData.map((e: any) => ({
                        id: e.id,
                        name: e.equipment_name,
                        quantity: e.quantity,
                        isAvailable: e.is_available
                    })));
                }

                const membersRes = await fetch(`${API_BASE_URL}/memberships/gym/${myGym.id}`, {headers});
                if (membersRes.ok) {
                    const membersData = await membersRes.json();

                    const mappedMembers: MemberItem[] = membersData.map((m: any) => ({
                        id: m.id,
                        userId: m.user_id,
                        firstName: m.profiles?.first_name || 'Користувач',
                        lastName: m.profiles?.last_name || '',
                        specialization: m.profiles?.specialization || 'Тренер',
                        status: m.status,
                        userType: m.user_type
                    }));

                    setTrainers(mappedMembers.filter((m: any) => m.userType === 'staff'));
                    setClients(mappedMembers.filter((m: any) => m.userType === 'client'));
                }
            } catch (error) {
                console.error("Помилка завантаження Manager Dashboard:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, [user, session, API_BASE_URL]);

    const activeTrainers = trainers.filter(t => t.status === 'active');
    const pendingStaffRequests = trainers.filter(t => t.status === 'pending');

    const activeClients = clients.filter(c => c.status === 'active');
    const pendingClientRequests = clients.filter(c => c.status === 'pending');

    const handleUpdateMemberStatus = async (membershipId: string, newStatus: 'active' | 'rejected', isStaff: boolean) => {
        if (!session) return;
        try {
            const res = await fetch(`${API_BASE_URL}/memberships/${membershipId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({status: newStatus})
            });

            if (res.ok) {
                const updater = (list: MemberItem[]) => list.map(m => m.id === membershipId ? {
                    ...m,
                    status: newStatus
                } : m);
                if (isStaff) setTrainers(updater(trainers));
                else setClients(updater(clients));
            } else {
                alert('Не вдалося оновити статус.');
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteMember = async (membershipId: string, isStaff: boolean) => {
        if (!session || !window.confirm('Ви впевнені, що хочете видалити цього учасника із залу?')) return;
        try {
            const res = await fetch(`${API_BASE_URL}/memberships/${membershipId}`, {
                method: 'DELETE',
                headers: {'Authorization': `Bearer ${session.access_token}`}
            });
            if (res.ok) {
                const filterer = (list: MemberItem[]) => list.filter(m => m.id !== membershipId);
                if (isStaff) setTrainers(filterer(trainers));
                else setClients(filterer(clients));
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleSaveMainInfo = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!managedGymId || !session) return;
        try {
            const combinedAddress = `${gymInfo.city}, ${gymInfo.address}`;
            const res = await fetch(`${API_BASE_URL}/gyms/${managedGymId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    name: gymInfo.name,
                    address: combinedAddress,
                    description: gymInfo.description
                })
            });
            if (res.ok) alert('Інформацію про зал успішно оновлено!');
            else alert('Помилка оновлення інформації.');
        } catch (error) {
            console.error(error);
        }
    };

    const handleSaveSchedule = async () => {
        if (!managedGymId || !session) return;
        try {
            const res = await fetch(`${API_BASE_URL}/gyms/${managedGymId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({schedule})
            });
            if (res.ok) alert('Графік роботи успішно оновлено!');
        } catch (error) {
            console.error(error);
        }
    };

    const handleScheduleChange = (day: string, field: keyof DaySchedule, value: any) => {
        setSchedule({...schedule, [day]: {...schedule[day], [field]: value}});
    };

    const handleAddEquipment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!managedGymId || !session || !newEqName.trim()) return;

        try {
            const res = await fetch(`${API_BASE_URL}/equipment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    gym_id: managedGymId,
                    equipment_name: newEqName,
                    quantity: newEqQty,
                    is_available: true
                })
            });

            if (res.ok) {
                const newEq = await res.json();
                setEquipment([...equipment, {
                    id: newEq.id,
                    name: newEq.equipment_name,
                    quantity: newEq.quantity,
                    isAvailable: newEq.is_available
                }]);
                setNewEqName('');
                setNewEqQty(1);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleToggleEquipment = async (id: string, currentStatus: boolean) => {
        if (!session) return;
        try {
            const res = await fetch(`${API_BASE_URL}/equipment/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({is_available: !currentStatus})
            });
            if (res.ok) {
                setEquipment(equipment.map(item => item.id === id ? {...item, isAvailable: !currentStatus} : item));
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteEquipment = async (id: string) => {
        if (!session || !window.confirm('Видалити цей інвентар?')) return;
        try {
            const res = await fetch(`${API_BASE_URL}/equipment/${id}`, {
                method: 'DELETE',
                headers: {'Authorization': `Bearer ${session.access_token}`}
            });
            if (res.ok) setEquipment(equipment.filter(item => item.id !== id));
        } catch (error) {
            console.error(error);
        }
    };

    if (isLoading) return <div className="loading-screen"
                               style={{color: 'white', textAlign: 'center', marginTop: '50px'}}>Завантаження панелі
        керування...</div>;

    if (!managedGymId) {
        return (
            <div className="error-screen" style={{color: 'white', textAlign: 'center', marginTop: '50px'}}>
                <h2>Доступ заборонено</h2>
                <p>Ви не є менеджером жодного спортзалу.</p>
                <button onClick={() => navigate(-1)} style={{marginTop: '20px', padding: '10px 20px'}}>Повернутися
                </button>
            </div>
        );
    }

    return (
        <div className="manager-page">
            <div className="manager-content">

                <header className="manager-header">
                    <button className="back-btn" onClick={() => navigate(-1)}>‹ Назад</button>
                    <h1>Керування залом</h1>
                    <div className="header-spacer"></div>
                </header>

                <nav className="manager-tabs">
                    <button className={`tab-link ${activeTab === 'main' ? 'active' : ''}`}
                            onClick={() => setActiveTab('main')}>Головна
                    </button>
                    <button className={`tab-link ${activeTab === 'schedule' ? 'active' : ''}`}
                            onClick={() => setActiveTab('schedule')}>Графік
                    </button>
                    <button className={`tab-link ${activeTab === 'equipment' ? 'active' : ''}`}
                            onClick={() => setActiveTab('equipment')}>Інвентар
                    </button>
                    <button className={`tab-link ${activeTab === 'staff' ? 'active' : ''}`}
                            onClick={() => setActiveTab('staff')}>
                        Штаб {pendingStaffRequests.length > 0 &&
                        <span className="tab-badge">{pendingStaffRequests.length}</span>}
                    </button>
                    <button className={`tab-link ${activeTab === 'clients' ? 'active' : ''}`}
                            onClick={() => setActiveTab('clients')}>
                        Клієнти {pendingClientRequests.length > 0 &&
                        <span className="tab-badge blue-badge">{pendingClientRequests.length}</span>}
                    </button>
                </nav>

                <main className="tab-viewport">

                    {activeTab === 'main' && (
                        <form className="manager-form" onSubmit={handleSaveMainInfo}>
                            <div className="form-group"><label>Назва спортзалу</label>
                                <input type="text"
                                       value={gymInfo.name}
                                       onChange={e => setGymInfo({...gymInfo, name: e.target.value})} required/></div>
                            <div className="form-row">
                                <div className="form-group"><label>Місто</label>
                                    <input type="text" value={gymInfo.city}
                                           onChange={e => setGymInfo({...gymInfo, city: e.target.value})} required/>
                                </div>
                                <div className="form-group"><label>Адреса</label>
                                    <input type="text"
                                           value={gymInfo.address}
                                           onChange={e => setGymInfo({...gymInfo, address: e.target.value})} required/>
                                </div>
                            </div>
                            <div className="form-group"><label>Повноцінний опис залу</label>
                                <textarea rows={6}
                                          value={gymInfo.description}
                                          onChange={e => setGymInfo({...gymInfo, description: e.target.value})}
                                          required/>
                            </div>
                            <button type="submit" className="manager-submit-btn">Зберегти зміни</button>
                        </form>
                    )}

                    {activeTab === 'schedule' && (
                        <div className="schedule-editor">
                            <div className="schedule-grid">
                                {Object.keys(dayLabels).map(dayKey => {
                                    const day = schedule[dayKey];
                                    return (
                                        <div key={dayKey}
                                             className={`schedule-edit-row ${!day.isOpen ? 'is-disabled' : ''}`}>
                                            <div className="day-checkbox-block">
                                                <input type="checkbox" id={dayKey} checked={day.isOpen}
                                                       onChange={e => handleScheduleChange(dayKey, 'isOpen', e.target.checked)}/>
                                                <label htmlFor={dayKey}>{dayLabels[dayKey]}</label>
                                            </div>
                                            <div className="time-inputs-block">
                                                <input type="time" value={day.openTime || ''} disabled={!day.isOpen}
                                                       onChange={e => handleScheduleChange(dayKey, 'openTime', e.target.value)}/>
                                                <span>до</span>
                                                <input type="time" value={day.closeTime || ''} disabled={!day.isOpen}
                                                       onChange={e => handleScheduleChange(dayKey, 'closeTime', e.target.value)}/>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <button type="button" className="manager-submit-btn" onClick={handleSaveSchedule}>Оновити
                                розклад
                            </button>
                        </div>
                    )}

                    {activeTab === 'equipment' && (
                        <div className="equipment-manager">
                            <form className="add-equipment-inline" onSubmit={handleAddEquipment}>
                                <input type="text" placeholder="Назва інвентарю..." value={newEqName}
                                       onChange={e => setNewEqName(e.target.value)} required/>
                                <input type="number" min="1" value={newEqQty}
                                       onChange={e => setNewEqQty(Number(e.target.value))} required/>
                                <button type="submit">Додати</button>
                            </form>
                            <div className="equipment-list">
                                {equipment.map(item => (
                                    <div key={item.id} className="equipment-row-card">
                                        <div className="eq-main"><span className="eq-title">{item.name}</span><span
                                            className="eq-count">Кількість: {item.quantity} шт.</span></div>
                                        <div className="eq-controls">
                                            <button
                                                className={`eq-status-badge ${item.isAvailable ? 'available' : 'broken'}`}
                                                onClick={() => handleToggleEquipment(item.id, item.isAvailable)}>
                                                {item.isAvailable ? 'Доступно' : 'Ремонт'}
                                            </button>
                                            <button type="button" className="eq-delete-btn"
                                                    onClick={() => handleDeleteEquipment(item.id)}>✕
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'staff' && (
                        <div className="staff-manager">
                            <div className="staff-section">
                                <h3>Нові заявки тренерів</h3>
                                <div className="requests-stack">
                                    {pendingStaffRequests.length > 0 ? pendingStaffRequests.map(req => (
                                        <div key={req.id} className="request-manager-card">
                                            <div className="req-user"><span
                                                className="req-name">{req.firstName} {req.lastName}</span><span
                                                className="req-spec">{req.specialization}</span></div>
                                            <div className="req-btns">
                                                <button className="manager-req-btn accept-btn"
                                                        onClick={() => handleUpdateMemberStatus(req.id, 'active', true)}>Прийняти
                                                </button>
                                                <button className="manager-req-btn reject-btn"
                                                        onClick={() => handleUpdateMemberStatus(req.id, 'rejected', true)}>Відхилити
                                                </button>
                                            </div>
                                        </div>
                                    )) : <p className="no-staff-text">Немає нових заявок.</p>}
                                </div>
                            </div>

                            <div className="staff-section text-divider">
                                <h3>Активні тренери залу</h3>
                                <div className="staff-stack">
                                    {activeTrainers.length > 0 ? activeTrainers.map(trainer => (
                                        <div key={trainer.id} className="staff-manager-row">
                                            <div className="staff-profile">
                                                <div className="staff-icon-avatar">{trainer.firstName.charAt(0)}</div>
                                                <div className="staff-meta"><span
                                                    className="trainer-full-name">{trainer.firstName} {trainer.lastName}</span><span
                                                    className="trainer-specialty">{trainer.specialization}</span></div>
                                            </div>
                                            <button className="fire-trainer-btn"
                                                    onClick={() => handleDeleteMember(trainer.id, true)}>Звільнити
                                            </button>
                                        </div>
                                    )) : <p className="no-staff-text">Штаб порожній.</p>}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'clients' && (
                        <div className="staff-manager">
                            <div className="staff-section">
                                <h3>Заявки від клієнтів</h3>
                                <div className="requests-stack">
                                    {pendingClientRequests.length > 0 ? pendingClientRequests.map(req => (
                                        <div key={req.id} className="request-manager-card client-req-card">
                                            <div className="req-user">
                                                <span className="req-name">{req.firstName} {req.lastName}</span>
                                                <span className="req-spec client-spec">Бажає приєднатися до залу</span>
                                            </div>
                                            <div className="req-btns">
                                                <button className="manager-req-btn accept-btn blue-accept"
                                                        onClick={() => handleUpdateMemberStatus(req.id, 'active', false)}>Підтвердити
                                                </button>
                                                <button className="manager-req-btn reject-btn"
                                                        onClick={() => handleUpdateMemberStatus(req.id, 'rejected', false)}>Відхилити
                                                </button>
                                            </div>
                                        </div>
                                    )) : <p className="no-staff-text">Немає нових заявок від клієнтів.</p>}
                                </div>
                            </div>

                            <div className="staff-section text-divider">
                                <h3>Активні клієнти залу</h3>
                                <div className="staff-stack">
                                    {activeClients.length > 0 ? activeClients.map(client => (
                                        <div key={client.id} className="staff-manager-row">
                                            <div className="staff-profile">
                                                <div
                                                    className="staff-icon-avatar client-avatar">{client.firstName.charAt(0)}</div>
                                                <div className="staff-meta">
                                                    <span
                                                        className="trainer-full-name">{client.firstName} {client.lastName}</span>
                                                    <span className="trainer-specialty">Учасник залу</span>
                                                </div>
                                            </div>
                                            <button className="fire-trainer-btn delete-client-btn"
                                                    onClick={() => handleDeleteMember(client.id, false)}>Видалити
                                            </button>
                                        </div>
                                    )) : <p className="no-staff-text">У вашому залі ще немає зареєстрованих
                                        клієнтів.</p>}
                                </div>
                            </div>
                        </div>
                    )}

                </main>

            </div>
        </div>
    );
};

export default ManagerDashboard;
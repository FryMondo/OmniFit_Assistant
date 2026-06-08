import React, {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {useAuth} from '../../context/AuthContext';
import './PersonalRecords.css';

import editIcon from '../../assets/edit-icon.svg';
import deleteIcon from '../../assets/delete-icon.png';

interface RecordItem {
    id: string;
    exerciseName: string;
    weight: number;
    reps: number;
    date: string;
}

const PersonalRecords: React.FC = () => {
    const navigate = useNavigate();
    const {user, session} = useAuth();
    const API_BASE_URL = import.meta.env.VITE_API_URL;

    const [records, setRecords] = useState<RecordItem[]>([]);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<RecordItem | null>(null);

    const [isCreating, setIsCreating] = useState(false);
    const [newRecord, setNewRecord] = useState({exerciseName: '', weight: '', reps: '', date: ''});

    useEffect(() => {
        if (!user || !session) return;

        const fetchRecords = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/exercise-logs/athlete/${user.id}`, {
                    headers: {'Authorization': `Bearer ${session.access_token}`}
                });

                if (res.ok) {
                    const data = await res.json();

                    const formattedRecords: RecordItem[] = data.map((log: any) => ({
                        id: log.id,
                        exerciseName: log.exercise_name,
                        weight: log.weight_kg || 0,
                        reps: log.reps,
                        date: log.performed_at ? log.performed_at.split('T')[0] : ''
                    }));

                    setRecords(formattedRecords);
                }
            } catch (error) {
                console.error("Помилка завантаження рекордів:", error);
            }
        };

        fetchRecords();
    }, [user, session, API_BASE_URL]);

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !session) return;

        try {
            const res = await fetch(`${API_BASE_URL}/exercise-logs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    athlete_id: user.id,
                    exercise_name: newRecord.exerciseName,
                    weight_kg: Number(newRecord.weight),
                    reps: Number(newRecord.reps),
                    performed_at: new Date(newRecord.date).toISOString()
                })
            });

            if (!res.ok) throw new Error('Помилка створення рекорду');
            const savedLog = await res.json();

            const createdRecord: RecordItem = {
                id: savedLog.id,
                exerciseName: savedLog.exercise_name,
                weight: savedLog.weight_kg,
                reps: savedLog.reps,
                date: savedLog.performed_at.split('T')[0]
            };

            setRecords([createdRecord, ...records]);
            setIsCreating(false);
            setNewRecord({exerciseName: '', weight: '', reps: '', date: ''});
        } catch (error) {
            console.error("Помилка додавання рекорду:", error);
            alert("Не вдалося зберегти рекорд.");
        }
    };

    const startEditing = (record: RecordItem) => {
        setEditingId(record.id);
        setEditForm({...record});
    };

    const saveEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editForm || !session) return;

        try {
            const res = await fetch(`${API_BASE_URL}/exercise-logs/${editForm.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    exercise_name: editForm.exerciseName,
                    weight_kg: editForm.weight,
                    reps: editForm.reps,
                    performed_at: new Date(editForm.date).toISOString()
                })
            });

            if (!res.ok) throw new Error('Помилка оновлення');

            setRecords(records.map(r => r.id === editForm.id ? editForm : r));
            setEditingId(null);
        } catch (error) {
            console.error("Помилка редагування:", error);
            alert("Не вдалося оновити запис.");
        }
    };

    const deleteRecord = async (id: string) => {
        if (!session || !window.confirm('Ви впевнені, що хочете видалити цей запис?')) return;

        try {
            const res = await fetch(`${API_BASE_URL}/exercise-logs/${id}`, {
                method: 'DELETE',
                headers: {'Authorization': `Bearer ${session.access_token}`}
            });

            if (!res.ok) throw new Error('Помилка видалення');

            setRecords(records.filter(r => r.id !== id));
        } catch (error) {
            console.error("Помилка видалення:", error);
            alert("Не вдалося видалити запис.");
        }
    };

    return (
        <div className="records-page">
            <div className="records-content">

                <header className="records-header">
                    <button className="back-btn" onClick={() => navigate(-1)}>‹ Назад</button>
                    <h1>Особисті рекорди</h1>
                    <div className="header-spacer"></div>
                </header>

                {!isCreating && (
                    <button className="add-record-btn" onClick={() => {
                        const today = new Date().toISOString().split('T')[0];
                        setNewRecord({...newRecord, date: today});
                        setIsCreating(true);
                    }}>
                        + Додати рекорд
                    </button>
                )}

                {isCreating && (
                    <form className="record-form create-mode" onSubmit={handleCreateSubmit}>
                        <h3>Новий рекорд</h3>
                        <div className="input-group">
                            <label>Назва вправи</label>
                            <input
                                type="text"
                                placeholder="Напр: Жим лежачи"
                                value={newRecord.exerciseName}
                                onChange={e => setNewRecord({...newRecord, exerciseName: e.target.value})}
                                required
                            />
                        </div>
                        <div className="stats-row">
                            <div className="input-group">
                                <label>Вага (кг)</label>
                                <input type="number" min="0" step="0.5" value={newRecord.weight}
                                       onChange={e => setNewRecord({...newRecord, weight: e.target.value})} required/>
                            </div>
                            <div className="input-group">
                                <label>Повторення</label>
                                <input type="number" min="1" value={newRecord.reps}
                                       onChange={e => setNewRecord({...newRecord, reps: e.target.value})} required/>
                            </div>
                            <div className="input-group">
                                <label>Дата</label>
                                <input type="date" value={newRecord.date}
                                       onChange={e => setNewRecord({...newRecord, date: e.target.value})} required/>
                            </div>
                        </div>
                        <div className="form-actions">
                            <button type="submit" className="save-btn">Зберегти</button>
                            <button type="button" className="cancel-btn"
                                    onClick={() => setIsCreating(false)}>Скасувати
                            </button>
                        </div>
                    </form>
                )}

                <div className="records-list">
                    {records.map((record) => (
                        <div key={record.id} className="record-card">

                            {editingId === record.id ? (
                                <form className="record-form edit-mode" onSubmit={saveEdit}>
                                    <div className="input-group">
                                        <label>Назва вправи</label>
                                        <input
                                            type="text"
                                            value={editForm?.exerciseName}
                                            onChange={e => setEditForm({...editForm!, exerciseName: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="stats-row">
                                        <div className="input-group">
                                            <label>Вага (кг)</label>
                                            <input type="number" min="0" step="0.5" value={editForm?.weight}
                                                   onChange={e => setEditForm({
                                                       ...editForm!,
                                                       weight: Number(e.target.value)
                                                   })} required/>
                                        </div>
                                        <div className="input-group">
                                            <label>Повторення</label>
                                            <input type="number" min="1" value={editForm?.reps}
                                                   onChange={e => setEditForm({
                                                       ...editForm!,
                                                       reps: Number(e.target.value)
                                                   })} required/>
                                        </div>
                                        <div className="input-group">
                                            <label>Дата</label>
                                            <input type="date" value={editForm?.date}
                                                   onChange={e => setEditForm({...editForm!, date: e.target.value})}
                                                   required/>
                                        </div>
                                    </div>
                                    <div className="form-actions">
                                        <button type="submit" className="save-btn">Оновити</button>
                                        <button type="button" className="cancel-btn"
                                                onClick={() => setEditingId(null)}>Скасувати
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <>
                                    <div className="record-header">
                                        <h3 className="exercise-name">{record.exerciseName}</h3>
                                        <div className="action-buttons">
                                            <button className="icon-btn edit-btn" onClick={() => startEditing(record)}>
                                                <img src={editIcon} alt="Редагувати"/>
                                            </button>
                                            <button className="icon-btn delete-btn"
                                                    onClick={() => deleteRecord(record.id)}>
                                                <img src={deleteIcon} alt="Видалити"/>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="record-stats">
                                        <div className="stat-block">
                                            <span className="stat-value">{record.weight} <small>кг</small></span>
                                            <span className="stat-label">Вага</span>
                                        </div>
                                        <div className="stat-block">
                                            <span className="stat-value">{record.reps}</span>
                                            <span className="stat-label">Повторень</span>
                                        </div>
                                        <div className="stat-block">
                                            <span className="stat-value date-value">
                                                {new Date(record.date).toLocaleDateString('uk-UA', {
                                                    day: '2-digit',
                                                    month: 'short'
                                                })}
                                            </span>
                                            <span className="stat-label">Дата</span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
};

export default PersonalRecords;
import React, {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {useAuth} from '../../context/AuthContext';
import './MyMeals.css';

import editIcon from '../../assets/edit-icon.svg';
import deleteIcon from '../../assets/delete-icon.png';

interface MealItem {
    original_name: string;
    amount: number;
    unit: string;
    calories: number;
    protein_g: number;
    fat_g: number;
    carbs_g: number;
}

interface Meal {
    id: string;
    name: string;
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
    ingredients: MealItem[];
}

interface IngredientInput {
    id: number;
    name: string;
    weight: string;
}

const MyMeals: React.FC = () => {
    const navigate = useNavigate();
    const {user, session} = useAuth();
    const API_BASE_URL = import.meta.env.VITE_API_URL;

    const [meals, setMeals] = useState<Meal[]>([]);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Meal | null>(null);

    const [isCreating, setIsCreating] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [newMealName, setNewMealName] = useState('');
    const [ingredients, setIngredients] = useState<IngredientInput[]>([{id: Date.now(), name: '', weight: ''}]);

    useEffect(() => {
        if (!user || !session) return;

        const fetchCustomMeals = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/custom-meals/athlete/${user.id}`, {
                    headers: {'Authorization': `Bearer ${session.access_token}`}
                });

                if (res.ok) {
                    const data = await res.json();
                    const formattedMeals: Meal[] = data.map((meal: any) => ({
                        id: meal.id,
                        name: meal.name,
                        calories: Math.round(meal.total_calories || 0),
                        protein: Math.round(meal.total_protein || 0),
                        fat: Math.round(meal.total_fat || 0),
                        carbs: Math.round(meal.total_carbs || 0),
                        ingredients: meal.ingredients || []
                    }));
                    setMeals(formattedMeals);
                }
            } catch (error) {
                console.error("Помилка завантаження власних страв:", error);
            }
        };

        fetchCustomMeals();
    }, [user, session, API_BASE_URL]);

    const handleCreateMeal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !session || !newMealName.trim() || ingredients.length === 0) return;

        setIsProcessing(true);

        const aiQuery = ingredients
            .filter(ing => ing.name && ing.weight)
            .map(ing => `${ing.weight}g ${ing.name}`)
            .join(', ');

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
        };

        try {
            const calcRes = await fetch(`${API_BASE_URL}/nutrition/calculate`, {
                method: 'POST',
                headers,
                body: JSON.stringify({text: aiQuery, athlete_id: user.id})
            });

            if (!calcRes.ok) throw new Error('Помилка розрахунку інгредієнтів');
            const calcData = await calcRes.json();

            const saveRes = await fetch(`${API_BASE_URL}/custom-meals`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    athlete_id: user.id,
                    name: newMealName,
                    ingredients: calcData.items,
                    total_calories: calcData.totals.calories,
                    total_protein: calcData.totals.protein_g,
                    total_fat: calcData.totals.fat_g,
                    total_carbs: calcData.totals.carbs_g
                })
            });

            if (!saveRes.ok) throw new Error('Помилка збереження страви');
            const savedMeal = await saveRes.json();

            setMeals([{
                id: savedMeal.id,
                name: savedMeal.name,
                calories: Math.round(savedMeal.total_calories),
                protein: Math.round(savedMeal.total_protein),
                fat: Math.round(savedMeal.total_fat),
                carbs: Math.round(savedMeal.total_carbs),
                ingredients: savedMeal.ingredients
            }, ...meals]);

            setNewMealName('');
            setIngredients([{id: Date.now(), name: '', weight: ''}]);
            setIsCreating(false);
            alert('Страву успішно розраховано та збережено!');
        } catch (error) {
            console.error("Помилка:", error);
            alert("Не вдалося створити страву. Перевірте введені дані.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleLogMeal = async (meal: Meal) => {
        if (!user || !session) return;

        try {
            const res = await fetch(`${API_BASE_URL}/nutrition`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    athlete_id: user.id,
                    meal_category: 'snack',
                    items: [{
                        original_name: meal.name,
                        amount: 1,
                        unit: 'порція',
                        calories: meal.calories,
                        protein_g: meal.protein,
                        fat_g: meal.fat,
                        carbs_g: meal.carbs
                    }]
                })
            });

            if (!res.ok) throw new Error('Помилка додавання');
            alert(`"${meal.name}" успішно додано до щоденника!`);

        } catch (error) {
            console.error("Помилка додавання у щоденник:", error);
            alert("Не вдалося додати страву до щоденника.");
        }
    };

    const startEditing = (meal: Meal) => {
        setEditingId(meal.id);
        setEditForm({...meal});
    };

    const saveEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editForm || !session) return;

        try {
            const res = await fetch(`${API_BASE_URL}/custom-meals/${editForm.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    name: editForm.name,
                    total_calories: editForm.calories,
                    total_protein: editForm.protein,
                    total_fat: editForm.fat,
                    total_carbs: editForm.carbs
                })
            });

            if (!res.ok) throw new Error('Помилка оновлення');

            setMeals(meals.map(m => m.id === editForm.id ? editForm : m));
            setEditingId(null);
        } catch (error) {
            console.error("Помилка редагування:", error);
            alert("Не вдалося оновити страву.");
        }
    };

    const deleteMeal = async (id: string) => {
        if (!session || !window.confirm('Ви впевнені, що хочете видалити цю страву?')) return;

        try {
            const res = await fetch(`${API_BASE_URL}/custom-meals/${id}`, {
                method: 'DELETE',
                headers: {'Authorization': `Bearer ${session.access_token}`}
            });

            if (!res.ok) throw new Error('Помилка видалення');

            setMeals(meals.filter(m => m.id !== id));
        } catch (error) {
            console.error("Помилка видалення:", error);
            alert("Не вдалося видалити страву.");
        }
    };

    const addIngredientRow = () => setIngredients([...ingredients, {id: Date.now(), name: '', weight: ''}]);
    const removeIngredientRow = (id: number) => {
        if (ingredients.length > 1) setIngredients(ingredients.filter(ing => ing.id !== id));
    };
    const updateIngredient = (id: number, field: 'name' | 'weight', value: string) => {
        setIngredients(ingredients.map(ing => ing.id === id ? {...ing, [field]: value} : ing));
    };

    return (
        <div className="meals-page">
            <div className="meals-content">

                <header className="meals-header">
                    <button className="back-btn" onClick={() => navigate('/nutrition')}>‹ Назад</button>
                    <h1>Мої страви</h1>
                    <div className="header-spacer"></div>
                </header>

                {!isCreating && (
                    <button className="add-meal-btn" onClick={() => setIsCreating(true)}>
                        + Створити нову страву
                    </button>
                )}

                {isCreating && (
                    <form className="create-meal-card" onSubmit={handleCreateMeal}>
                        <h3>Створення нової страви</h3>

                        <div className="input-group">
                            <label>Назва страви</label>
                            <input
                                type="text"
                                placeholder="Наприклад: Мій фірмовий сніданок"
                                value={newMealName}
                                onChange={(e) => setNewMealName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="ingredients-section">
                            <label>Складники (Продукт та вага)</label>

                            {ingredients.map((ing) => (
                                <div key={ing.id} className="ingredient-row">
                                    <input
                                        type="text"
                                        placeholder="Назва (напр. Яйце)"
                                        value={ing.name}
                                        onChange={(e) => updateIngredient(ing.id, 'name', e.target.value)}
                                        required
                                    />
                                    <input
                                        type="number"
                                        placeholder="Грам"
                                        className="weight-input"
                                        value={ing.weight}
                                        onChange={(e) => updateIngredient(ing.id, 'weight', e.target.value)}
                                        required
                                    />
                                    {ingredients.length > 1 && (
                                        <button type="button" className="remove-row-btn"
                                                onClick={() => removeIngredientRow(ing.id)}>✕</button>
                                    )}
                                </div>
                            ))}

                            <button type="button" className="add-row-btn" onClick={addIngredientRow}>
                                + Додати продукт
                            </button>
                        </div>

                        <div className="create-actions">
                            <button type="submit" className="generate-btn" disabled={isProcessing}>
                                {isProcessing ? 'Рахуємо...' : 'Зберегти та розрахувати'}
                            </button>
                            <button type="button" className="cancel-create-btn"
                                    onClick={() => setIsCreating(false)} disabled={isProcessing}>
                                Скасувати
                            </button>
                        </div>
                    </form>
                )}

                <div className="meals-list">
                    {meals.length === 0 && !isCreating && (
                        <p style={{textAlign: 'center', color: '#888', marginTop: '20px'}}>У вас ще немає збережених
                            страв.</p>
                    )}

                    {meals.map((meal) => (
                        <div key={meal.id} className="meal-strip">

                            {editingId === meal.id ? (
                                <form className="inline-edit-form" onSubmit={saveEdit}>
                                    <input
                                        type="text"
                                        className="edit-name-input"
                                        value={editForm?.name}
                                        onChange={(e) => setEditForm({...editForm!, name: e.target.value})}
                                        required
                                    />
                                    <div className="edit-macros-row">
                                        <div className="macro-input">
                                            <label>Ккал</label>
                                            <input type="number" value={editForm?.calories}
                                                   onChange={(e) => setEditForm({
                                                       ...editForm!,
                                                       calories: Number(e.target.value)
                                                   })} required/>
                                        </div>
                                        <div className="macro-input">
                                            <label>Б</label>
                                            <input type="number" value={editForm?.protein}
                                                   onChange={(e) => setEditForm({
                                                       ...editForm!,
                                                       protein: Number(e.target.value)
                                                   })} required/>
                                        </div>
                                        <div className="macro-input">
                                            <label>Ж</label>
                                            <input type="number" value={editForm?.fat} onChange={(e) => setEditForm({
                                                ...editForm!,
                                                fat: Number(e.target.value)
                                            })} required/>
                                        </div>
                                        <div className="macro-input">
                                            <label>В</label>
                                            <input type="number" value={editForm?.carbs} onChange={(e) => setEditForm({
                                                ...editForm!,
                                                carbs: Number(e.target.value)
                                            })} required/>
                                        </div>
                                    </div>
                                    <div className="edit-actions">
                                        <button type="submit" className="save-edit-btn">Зберегти</button>
                                        <button type="button" className="cancel-edit-btn"
                                                onClick={() => setEditingId(null)}>Скасувати
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <>
                                    <div className="meal-info">
                                        <h3 style={{textTransform: 'capitalize'}}>{meal.name}</h3>
                                        <p className="meal-macros">
                                            <span className="cal-highlight">{meal.calories} ккал</span>
                                            <span
                                                className="macro-details">• Б: {meal.protein}г • Ж: {meal.fat}г • В: {meal.carbs}г</span>
                                        </p>
                                        {meal.ingredients && meal.ingredients.length > 0 && (
                                            <ul style={{
                                                fontSize: '12px',
                                                color: '#888',
                                                marginTop: '8px',
                                                paddingLeft: '15px'
                                            }}>
                                                {meal.ingredients.map((ing, idx) => (
                                                    <li key={idx}>
                                                        {ing.original_name} — {ing.amount}{ing.unit} ({Math.round(ing.calories)} ккал)
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                    <div className="meal-actions">
                                        <button
                                            className="action-btn"
                                            style={{
                                                backgroundColor: 'rgba(39, 174, 96, 0.2)',
                                                color: '#27ae60',
                                                border: '1px solid #27ae60'
                                            }}
                                            onClick={() => handleLogMeal(meal)}
                                            title="Додати в щоденник"
                                        >
                                            ➕
                                        </button>
                                        <button className="action-btn edit-btn" onClick={() => startEditing(meal)}>
                                            <img src={editIcon} alt="Редагувати"/>
                                        </button>
                                        <button className="action-btn delete-btn" onClick={() => deleteMeal(meal.id)}>
                                            <img src={deleteIcon} alt="Видалити"/>
                                        </button>
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

export default MyMeals;
import React, {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {supabase} from '../../config/supabaseClient';
import {useAuth} from '../../context/AuthContext';
import './Auth.css';

const Auth: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const navigate = useNavigate();
    const {user} = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [username, setUsername] = useState('');
    const [role, setRole] = useState<'athlete' | 'coach' | 'manager'>('athlete');

    const [errorMsg, setErrorMsg] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (user) {
            if (user.role === 'manager') {
                navigate('/manager/dashboard', {replace: true});
            } else {
                navigate('/dashboard', {replace: true});
            }
        }
    }, [user, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        setIsLoading(true);

        const API_BASE_URL = import.meta.env.VITE_API_URL;
        const AUTH_API = `${API_BASE_URL}/auth`;

        try {
            if (isLogin) {
                const res = await fetch(`${AUTH_API}/login`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({email, password})
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Помилка входу');

                if (data.session) {
                    await supabase.auth.setSession({
                        access_token: data.session.access_token,
                        refresh_token: data.session.refresh_token
                    });
                }
            } else {
                const res = await fetch(`${AUTH_API}/register`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        email,
                        password,
                        username,
                        first_name: firstName,
                        last_name: lastName,
                        role
                    })
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Помилка реєстрації');

                const loginRes = await fetch(`${AUTH_API}/login`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({email, password})
                });

                const loginData = await loginRes.json();
                if (loginData.session) {
                    await supabase.auth.setSession({
                        access_token: loginData.session.access_token,
                        refresh_token: loginData.session.refresh_token
                    });
                }
            }
        } catch (err: any) {
            setErrorMsg(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2 className="auth-title">
                    {isLogin ? 'З поверненням!' : 'Створити акаунт'}
                </h2>

                {errorMsg && (
                    <div style={{color: '#e74c3c', marginBottom: '15px', textAlign: 'center', fontSize: '14px'}}>
                        {errorMsg}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="auth-form">
                    {!isLogin && (
                        <>
                            <div className="input-row">
                                <div className="input-group">
                                    <label htmlFor="firstName">Ім'я</label>
                                    <input type="text" id="firstName" value={firstName}
                                           onChange={e => setFirstName(e.target.value)} placeholder="Іван" required/>
                                </div>
                                <div className="input-group">
                                    <label htmlFor="lastName">Прізвище</label>
                                    <input type="text" id="lastName" value={lastName}
                                           onChange={e => setLastName(e.target.value)} placeholder="Франко" required/>
                                </div>
                            </div>

                            <div className="input-group">
                                <label htmlFor="username">Юзернейм</label>
                                <input type="text" id="username" value={username}
                                       onChange={e => setUsername(e.target.value)} placeholder="ivan_f" required/>
                            </div>

                            <div className="input-group">
                                <label htmlFor="role">Оберіть вашу роль</label>
                                <select id="role" value={role} onChange={e => setRole(e.target.value as any)} required>
                                    <option value="athlete">Спортсмен</option>
                                    <option value="coach">Тренер</option>
                                    <option value="manager">Менеджер залу</option>
                                </select>
                            </div>
                        </>
                    )}

                    <div className="input-group">
                        <label htmlFor="email">Email</label>
                        <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)}
                               placeholder="mail@example.com" required/>
                    </div>

                    <div className="input-group">
                        <label htmlFor="password">Пароль</label>
                        <input type="password" id="password" value={password}
                               onChange={e => setPassword(e.target.value)} placeholder="••••••••" required/>
                    </div>

                    <button type="submit" className="submit-btn" disabled={isLoading}>
                        {isLoading ? 'Обробка...' : (isLogin ? 'Увійти' : 'Зареєструватися')}
                    </button>
                </form>

                <div className="auth-footer">
                    {isLogin ? (
                        <p>
                            Немає акаунта?{' '}
                            <span className="toggle-link" onClick={() => {
                                setIsLogin(false);
                                setErrorMsg('');
                            }}>
                                Створіть його
                            </span>
                        </p>
                    ) : (
                        <p>
                            Уже є акаунт?{' '}
                            <span className="toggle-link" onClick={() => {
                                setIsLogin(true);
                                setErrorMsg('');
                            }}>
                                Увійти
                            </span>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Auth;
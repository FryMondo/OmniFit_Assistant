import React, {createContext, useContext, useState, useEffect} from 'react';
import type {ReactNode} from 'react';
import {supabase} from '../config/supabaseClient';
import type {Session, User} from '@supabase/supabase-js';

export interface UserProfile {
    id: string;
    email?: string;
    username: string;
    firstName: string;
    lastName: string;
    role: 'athlete' | 'coach' | 'manager';
}

interface AuthContextType {
    session: Session | null;
    user: UserProfile | null;
    isLoading: boolean;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({children}) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchUserProfile = async (authUser: User) => {
        try {
            const {data, error} = await supabase
                .from('profiles')
                .select('*')
                .eq('id', authUser.id)
                .single();

            if (error) {
                console.error('Помилка завантаження профілю:', error.message);
                setUser(null);
                return;
            }

            if (data) {
                setUser({
                    id: data.id,
                    email: authUser.email,
                    username: data.username,
                    firstName: data.first_name,
                    lastName: data.last_name,
                    role: data.role,
                });
            }
        } catch (error) {
            console.error('Непередбачена помилка під час отримання профілю:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        supabase.auth.getSession().then(({data: {session: currentSession}}) => {
            setSession(currentSession);
            if (currentSession?.user) {
                void fetchUserProfile(currentSession.user);
            } else {
                setIsLoading(false);
            }
        });

        const {data: {subscription}} = supabase.auth.onAuthStateChange((_event, currentSession) => {
            setSession(currentSession);
            if (currentSession?.user) {
                setIsLoading(true);
                void fetchUserProfile(currentSession.user);
            } else {
                setUser(null);
                setIsLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const logout = async () => {
        setIsLoading(true);
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
        setIsLoading(false);
    };

    const value = {session, user, isLoading, logout};

    return (
        <AuthContext.Provider value={value}>
            {!isLoading ? children : <div className="loading-style">Завантаження системи...</div>}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth повинен використовуватися всередині AuthProvider');
    }
    return context;
};
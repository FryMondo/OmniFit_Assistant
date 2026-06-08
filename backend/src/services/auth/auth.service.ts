import {supabase} from '../../config/supabase';

export interface RegisterData {
    email: string;
    password: string;
    username: string;
    first_name: string;
    last_name: string;
    role: 'athlete' | 'coach' | 'manager';
}

export async function registerUser(data: RegisterData) {
    const {email, password, ...metaData} = data;

    const {data: authData, error} = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: metaData
        }
    });

    if (error) {
        console.error('Помилка реєстрації Supabase:', error.message);
        throw new Error(error.message);
    }

    return authData;
}

export async function loginUser(email: string, password: string) {
    const {data, error} = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        console.error('Помилка входу Supabase:', error.message);
        throw new Error('Неправильний email або пароль');
    }

    return data;
}